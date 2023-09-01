use chrono_tz::{Tz, TZ_VARIANTS};
use futures::{Stream, StreamExt};
use log::{info, trace};
use poise::{
    command,
    serenity_prelude::{futures, User as SerenityUser},
};
use serde::{Deserialize, Serialize};
use songbird::{
    input::{reader::MediaSource, Container, Input, Metadata, Reader},
    tracks::Track,
    SerenityInit, Songbird,
};
use std::{
    fmt,
    io::{self, SeekFrom},
    str::FromStr,
    sync::{Arc, LazyLock, RwLock},
    time::Duration,
};
use thiserror::Error;
use tokio::sync::RwLock as TokioRwLock;
use yokai_apple::AppleTrack;

use crate::{
    commands::{get_highest_role, is_admin, is_higher, Context, Error},
    models::User,
    resample, DB,
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
    pub song: u64,
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
    fn new(author: SerenityUser, song: u64, speed: PlaybackSpeed) -> Self {
        QueueItem {
            author,
            song,
            speed,
        }
    }
}

lazy_static! {
    pub static ref QUEUE: Arc<TokioRwLock<PriorityQueue<QueueItem, u64>>> =
        Arc::new(TokioRwLock::new(PriorityQueue::new()));
}

/// Cider bot playback controls
#[command(slash_command, subcommands("queue", "list"))]
pub async fn player(_ctx: Context<'_>) -> Result<(), Error> {
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

    if let Some(id) = id {
        let item = QueueItem::new(ctx.author().clone(), id, speed);
        QUEUE
            .write()
            .await
            .push(item.clone(), get_highest_role(&ctx, ctx.author()).await);
        let read_queue = QUEUE.read().await;
        for read_item in read_queue.clone().into_sorted_iter().enumerate() {
            if read_item.1 .0.song == item.song {
                ctx.say(format!("Queued song {}, Current position in queue is {}\nThis may take up the 30 seconds to download", id, read_item.0)).await?;
            }
        }
    }
    Ok(())
}

/// Queues a song for the bot to play
#[command(slash_command)]
pub async fn list(ctx: Context<'_>) -> Result<(), Error> {
    let mut buffer = String::from("Queue: \n\n");
    let read_queue = QUEUE.read().await;
    for read_item in read_queue.clone().into_sorted_iter().enumerate() {
        buffer.push_str(&format!(
            "{}: {} - {}\n",
            read_item.0 + 1,
            read_item.1 .0.author.name,
            read_item.1 .0.song
        ))
    }
    ctx.say(buffer).await?;
    Ok(())
}
