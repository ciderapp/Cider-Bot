use chrono_tz::{Tz, TZ_VARIANTS};
use futures::{Stream, StreamExt};
use log::{error, info, trace};
use poise::{
    command,
    serenity_prelude::{futures, guild, User as SerenityUser},
};
use reqwest::Method;
use serde::{Deserialize, Serialize};
use songbird::{
    input::{reader::MediaSource, Container, Input, Metadata, Reader},
    tracks::Track,
    Event, EventContext, SerenityInit, Songbird,
};
use std::{
    fmt,
    io::{self, SeekFrom},
    str::FromStr,
    sync::{Arc, LazyLock, RwLock},
    time::{Duration, Instant},
};
use thiserror::Error;
use tokio::sync::RwLock as TokioRwLock;
use url::Url;
use uuid::Uuid;
use yokai_apple::AppleTrack;

use crate::{
    api::{wh, AppleMusicApi, Song},
    commands::{get_highest_role, is_admin, is_higher, Context, Error},
    models::User,
    resample,
    vpath::ValuePath,
    APPLE_TOKEN, DB, PROVIDER,
};

use yokai::{playback, prelude::*, provider::Provider};

use poise::serenity_prelude as serenity;

// #[group]
// #[commands(deafen, join, leave, mute, play, ping, undeafen, unmute)]
// struct General;

// Create a priority queue for the music bot!

use enum_iterator::Sequence;
use priority_queue::PriorityQueue;

#[derive(Debug, Serialize, Deserialize, Hash, PartialEq, Eq, Clone)]
pub struct QueueItem {
    pub id: Uuid,
    pub song: Song,
    pub author: SerenityUser,
    pub speed: PlaybackSpeed,
}

#[derive(Default, Debug, Serialize, Deserialize, Hash, PartialEq, Eq, Clone, Sequence)]
pub enum PlaybackSpeed {
    Slowed,
    #[default]
    Normal,
    Nightcore,
}

impl PlaybackSpeed {
    pub const SLOWED_VALUE: u32 = 56000;
    pub const NORMAL_VALUE: u32 = 48000;
    pub const NIGHTCORE_VALUE: u32 = 43000;

    pub fn get_value(&self) -> u32 {
        match self {
            PlaybackSpeed::Slowed => Self::SLOWED_VALUE,
            PlaybackSpeed::Normal => Self::NORMAL_VALUE,
            PlaybackSpeed::Nightcore => Self::NIGHTCORE_VALUE,
        }
    }
}

pub struct AudioBuffer {
    pub buffer: Arc<RwLock<Vec<u8>>>,
    pub position: usize,
}

impl AudioBuffer {
    pub fn new(buffer: Arc<RwLock<Vec<u8>>>) -> Self {
        AudioBuffer {
            buffer,
            position: 0,
        }
    }
}

impl io::Seek for AudioBuffer {
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        let buffer = self.buffer.write().unwrap();
        let buffer_len = buffer.len() as i64;

        self.position = match pos {
            SeekFrom::Start(new_pos) => new_pos as usize,
            SeekFrom::End(offset) => (buffer_len + offset) as usize,
            SeekFrom::Current(offset) => (self.position as i64 + offset) as usize,
        };

        if self.position > buffer_len as usize {
            self.position = buffer_len as usize;
        }

        Ok(self.position as u64)
    }
}

impl io::Read for AudioBuffer {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let buffer = self.buffer.read().unwrap();

        if self.position >= buffer.len() {
            return Ok(0); // End of buffer
        }

        let bytes_to_copy = std::cmp::min(buf.len(), buffer.len() - self.position);
        buf[..bytes_to_copy].copy_from_slice(&buffer[self.position..self.position + bytes_to_copy]);
        self.position += bytes_to_copy;

        Ok(bytes_to_copy)
    }
}

impl MediaSource for AudioBuffer {
    fn is_seekable(&self) -> bool {
        true
    }

    fn byte_len(&self) -> Option<u64> {
        Some(self.buffer.read().unwrap().len() as u64)
    }
}

#[derive(Debug, Error)]
pub enum PlaybackSpeedConversionError {
    E,
}

impl fmt::Display for PlaybackSpeedConversionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Error converting.")
    }
}

impl FromStr for PlaybackSpeed {
    type Err = PlaybackSpeedConversionError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        for speed in enum_iterator::all::<PlaybackSpeed>() {
            if &speed.to_string() == s {
                return Ok(speed);
            }
        }
        Err(PlaybackSpeedConversionError::E)
    }
}

impl ToString for PlaybackSpeed {
    fn to_string(&self) -> String {
        format!("{:?}", self)
    }
}

impl QueueItem {
    fn new(author: SerenityUser, song: &Song, speed: &PlaybackSpeed) -> Self {
        QueueItem {
            id: Uuid::new_v4(),
            author,
            song: song.clone(),
            speed: speed.clone(),
        }
    }
}

lazy_static! {
    pub static ref QUEUE: Arc<TokioRwLock<PriorityQueue<QueueItem, u64>>> =
        Arc::new(TokioRwLock::new(PriorityQueue::new()));
}

/// Cider bot playback controls
#[command(slash_command, subcommands("queue", "list", "skip"))]
pub async fn player(_ctx: Context<'_>) -> Result<(), Error> {
    _ctx.say("worked").await?;
    Ok(())
}

async fn autocomplete_playback_speed<'a>(
    _ctx: Context<'_>,
    partial: &'a str,
) -> impl Stream<Item = String> + 'a {
    futures::stream::iter(enum_iterator::all::<PlaybackSpeed>())
        .filter(move |name| {
            futures::future::ready(
                name.to_string()
                    .to_lowercase()
                    .contains(&partial.to_lowercase()),
            )
        })
        .map(|name| name.to_string())
}

use poise::serenity_prelude::ChannelType;

/// Queues a song for the bot to play
#[command(slash_command)]
pub async fn queue(
    ctx: Context<'_>,
    #[description = "Song name (NOT IMPLEMENTED)"] query: Option<String>,
    #[description = "Song ID"] id: Option<u64>,
    #[description = "Set the playback speed"]
    #[autocomplete = "autocomplete_playback_speed"]
    speed: Option<String>,
) -> Result<(), Error> {
    let speed = if speed.is_some() {
        let speed: PlaybackSpeed = speed.unwrap().parse().unwrap();
        speed
    } else {
        PlaybackSpeed::Normal
    };

    let api = AppleMusicApi {
        client: Arc::new(TokioRwLock::new(reqwest::Client::new())),
        developer_token: APPLE_TOKEN.clone(),
    };

    let id = if let Some(id) = id {
        id
    } else if let Some(query) = query {
        let mut url = Url::from_str(&format!(
            "https://api.music.apple.com/v1/catalog/us/search/"
        ))?;
        url.query_pairs_mut()
            .append_pair("term", &urlencoding::encode(&query))
            //.append_pair("platform", "web")
            .append_pair("types", "songs")
            .append_pair("limit", "1")
            .append_pair("with", "serverBubbles,lyricHighlights")
            .append_pair("omit[resource]", "autos");

        let Ok(apiresponse) = api.request_endpoint(Method::GET, &url.to_string()).await else {
            ctx.say("Unable to find a song with that name").await?;
            return Ok(());
        };

        // info!("{:#?}", apiresponse);
        apiresponse
            .get_value_by_path("results.song.data.0.attributes.playParams.id")
            .unwrap()
            .as_str()
            .unwrap()
            .parse::<u64>()
            .unwrap()
    } else {
        return Ok(());
    };

    // Get the song information from the API
    // TODO: Allow user to change storefront
    let Ok(song) = api.get_song_info(id, "us").await else {
        ctx.say("Unable to get song information from the API")
            .await?;
        return Ok(());
    };

    let guild_id = Arc::new(TokioRwLock::new(ctx.guild_id().unwrap()));

    // Start some critical resources...
    let speed = Arc::new(TokioRwLock::new(speed));
    let speed2 = speed.clone();
    let song = Arc::new(TokioRwLock::new(song));
    let song2 = song.clone();
    let sctx = Arc::new(TokioRwLock::new(ctx.serenity_context().clone()));
    let user = ctx.author().clone();
    tokio::task::spawn(async move {
        info!(
            "Got queue item, playing {}",
            song.read().await.attributes.name
        );

        let track = AppleTrack::from_remote_id(song.read().await.id.to_string());
        let Ok(mut audio) = PROVIDER
            .read()
            .await
            .as_ref()
            .unwrap()
            .get_audio_track(track)
            .await
        else {
            info!("Invalid song");
            return;
        };

        let byte_stream = Arc::new(std::sync::RwLock::new(Vec::new()));

        let mut samplerate = 0;

        let mut position = 0f32;
        let mut started = false;
        while position < audio.get_length().await.unwrap() {
            let mut data = vec![Vec::new(); 2];
            info!("Position: {}", position);
            let segment = audio.get_segment_containing(position).await.unwrap();
            if segment.sample_rate == 0 {
                break; // EOS
            }
            position += segment.data[0].len() as f32 / segment.sample_rate as f32;
            samplerate = segment.sample_rate;
            data[0].extend_from_slice(&segment.data[0]);
            data[1].extend_from_slice(&segment.data[1]);

            let mut stream = Vec::new();

            let stamp = Instant::now();
            for sample in 0..data[0].len() {
                for channel in &data {
                    let sample = channel[sample];
                    stream.push(sample);
                }
            }
            info!("interleaved in {:?}", stamp.elapsed());

            let stamp = Instant::now();
            let stream = resample(&stream, samplerate, speed.read().await.get_value());
            info!("resampled in {:?}", stamp.elapsed());

            let stamp = Instant::now();
            for sample in stream {
                byte_stream
                    .write()
                    .unwrap()
                    .extend_from_slice(&sample.to_le_bytes());
            }
            info!("float stream to byte stream in {:?}", stamp.elapsed());

            if !started {
                started = true;

                let speed = speed.clone();
                let song = song.clone();
                let byte_stream_copy = byte_stream.clone();

                let read_song = song.read().await.to_owned();
                let author = user.clone();
                let sctx = sctx.clone();
                let guild_id = guild_id.clone();
                tokio::task::spawn(async move {
                    info!("Started playback thread");
                    let input = Input::new(
                        true,
                        Reader::Extension(Box::new(AudioBuffer::new(byte_stream_copy.clone()))),
                        songbird::input::Codec::FloatPcm,
                        Container::Raw,
                        Some(Metadata {
                            thumbnail: Some(read_song.attributes.artwork.url),
                            artist: Some(read_song.attributes.artist_name),
                            title: Some(read_song.attributes.name),
                            channels: Some(2),
                            sample_rate: Some(samplerate),
                            source_url: Some(read_song.attributes.url),
                            channel: Some(author.name), // We can really put whatever here, in this case, i wanna preserve who put it in the queue
                            ..Default::default()
                        }),
                    );

                    let manager = songbird::get(&*sctx.read().await).await.unwrap();

                    // Get the guild of the original message.
                    let guildid = guild_id.read().await.to_owned();

                    // Find the voice channel named #Music, if it cant find it,
                    // fall back to # General

                    let ctx = sctx.read().await.clone();

                    let Ok(channels) = ctx.http.get_channels(guild_id.read().await.0).await else {
                        error!("No channels found in guild");
                        return;
                    };

                    let mut voice_channel = None;

                    for channel in &channels {
                        if channel.kind == ChannelType::Voice {
                            if channel.name == "Music" {
                                voice_channel = Some(channel);
                                break;
                            } else if channel.name == "General" && voice_channel.is_none() {
                                voice_channel = Some(channel);
                            }
                        }
                    }

                    if voice_channel.is_none() {
                        error!("Could not find sutable channel to join");
                        return;
                    }

                    let (handle, result) = manager.join(guildid, voice_channel.unwrap().id).await;

                    let song = handle.lock().await.enqueue_source(input);
                    // song.add_event(songbird::Event::Periodic(Duration::from_secs(5), Some(Duration::from_secs(7))), SongFader {})
                    //song.add_event(Event::Delayed(()), action)
                });
            }
        }
    });

    let manager = songbird::get(&ctx.serenity_context()).await.unwrap();

    //let guild = guild_id.read().await.0;

    let queue = match manager.get(ctx.guild_id().unwrap()) {
        Some(m) => m.lock().await.queue().len(),
        None => 1,
    };

    let song = song2.read().await.clone();
    let speed = speed2.read().await.clone();

    //manager.lock().await.queue().add(track, handler);
    ctx.send(|b| {
        b.embed(|e| {
            e.title(song.attributes.name)
                .url(song.attributes.url)
                .color(7136846)
                .field("Artist", song.attributes.artist_name, true)
                .field("Speed", &speed.to_string(), true)
                .field(
                    "Queue Position",
                    format!("{} out of {}", queue, queue),
                    false,
                )
                .author(|a| a.name("Song added to queue"))
                .thumbnail(wh(&song.attributes.artwork.url.clone(), 512, 512))
        })
    })
    .await
    .unwrap();

    Ok(())
}

struct SongFader {}

#[async_trait]
impl songbird::EventHandler for SongFader {
    async fn act(&self, ctx: &EventContext<'_>) -> Option<Event> {
        if let EventContext::Track(&[(state, track)]) = ctx {
            let _ = track.set_volume(state.volume / 2.0);

            if state.volume < 1e-2 {
                let _ = track.stop();
                Some(Event::Cancel)
            } else {
                info!("Volume reduced.");
                None
            }
        } else {
            None
        }
    }
}

/// Lists all the items in the queue
#[command(slash_command)]
pub async fn list(ctx: Context<'_>) -> Result<(), Error> {
    let manager = songbird::get(&ctx.serenity_context()).await.unwrap();
    let manager = manager.get(ctx.guild_id().unwrap()).unwrap();
    let queue = manager.lock().await.queue().clone();
    // let read_queue = QUEUE.read().await;
    // let queue_length = QUEUE.read().await.len();
    ctx.send(|b| {
        b.embed(|e| {
            e.title("Queue").color(13845552);
            for item in queue.current_queue().iter().enumerate() {
                let metadata = item.1.metadata();
                e.field(
                    format!(
                        "{}. {}",
                        item.0 + 1,
                        metadata.channel.as_ref().unwrap_or(&String::from("N/A"))
                    ),
                    format!(
                        "[{}]({})",
                        metadata.title.as_ref().unwrap_or(&String::from("N/A")),
                        metadata.source_url.as_ref().unwrap_or(&String::from("N/A"))
                    ),
                    false,
                );
            }
            e.description(format!(
                "There are currently **{}** song(s) in the queue.",
                queue.len()
            ));
            e
        })
    })
    .await?;
    Ok(())
}

/// Skips a song (Admin only)
#[command(slash_command, required_permissions = "MODERATE_MEMBERS")]
pub async fn skip(ctx: Context<'_>) -> Result<(), Error> {
    let manager = songbird::get(&ctx.serenity_context()).await.unwrap();
    let manager = manager.get(ctx.guild_id().unwrap()).unwrap();
    let _ = manager.lock().await.queue().skip();
    Ok(())
}
