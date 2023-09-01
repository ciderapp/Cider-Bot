#![feature(lazy_cell)]
use poise::{
    builtins,
    serenity_prelude::{
        async_trait, Client, ClientBuilder, EventHandler, GatewayIntents, Http, Ready,
        ShardManager, UserId,
    },
    FrameworkOptions,
};
use surrealdb::{
    engine::remote::ws::{Client as SClient, Ws},
    opt::auth::Root,
    Surreal,
};

use songbird::{
    id::ChannelId,
    input::{reader::MediaSource, Input, Metadata, Reader},
    serenity,
    tracks::Track,
    Event, EventContext, SerenityInit, Songbird, TrackEvent,
};
use thiserror::Error;
use yokai::{
    prelude::{AudioStream, Playback},
    provider::Provider,
};
use yokai_apple::{AppleProvider, AppleTrack};

use std::{fmt, future::Future, sync::Arc, thread, time::Duration};
use tokio::sync::RwLock;

use log::*;

use crate::commands::{
    player::{AudioBuffer, QueueItem, QUEUE},
    Data,
};

// Submodules
mod api;
mod commands;
mod models;
mod update;
// end Submodules

// Types
type TokenLock = Arc<RwLock<Option<String>>>;
// end Types

use rubato::{Resampler, SincInterpolationParameters};

#[macro_use]
extern crate lazy_static;

lazy_static! {
    pub static ref DATABASE_IP: String =
        std::env::var("DB_IP").expect("Please set the DB_IP env variable");
    pub static ref DATABASE_PASSWORD: String =
        std::env::var("DB_PASS").expect("Please set the DB_PASS env variable");
    pub static ref TOKEN: String =
        std::env::var("TOKEN").expect("Please set the TOKEN env variable");
}

static DB: Surreal<SClient> = Surreal::init();

type Error = Box<dyn std::error::Error + Send + Sync>;

struct Hanler {
    //audio: Arc<RwLock<Box<dyn AudioStream + 'a + Send + Sync>>>,
    options: FrameworkOptions<(), Error>,
    shard_manager: std::sync::Mutex<Option<std::sync::Arc<tokio::sync::Mutex<ShardManager>>>>,
}

use songbird::input::Container;

use std::error::Error as StdError;

impl From<Box<dyn StdError>> for EAAA {
    fn from(error: Box<dyn StdError>) -> Self {
        EAAA::Fuck("aaaaaaa")
    }
}

#[derive(Debug, Error)]
enum EAAA {
    Fuck(&'static str),
}

impl fmt::Display for EAAA {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Error.")
    }
}

fn sinc(x: f32) -> f32 {
    if x == 0.0 {
        1.0
    } else {
        let pi_x = std::f32::consts::PI * x;
        pi_x.sin() / pi_x
    }
}

fn resample(input_signal: &[f32], input_rate: u32, output_rate: u32) -> Vec<f32> {
    let num_samples = input_signal.len() / 2;
    info!(
        "fn(sinc) interpolating 2 channels with {} samples ; {} -> {}",
        num_samples, input_rate, output_rate
    );
    let output_length =
        (num_samples as f32 * output_rate as f32 / input_rate as f32).round() as usize;

    let mut output_signal = Vec::with_capacity(output_length * 2);

    for i in 0..output_length {
        let input_index = i as f32 * input_rate as f32 / output_rate as f32;

        let left_index = input_index.floor() as usize;
        let mut interpolated_left = 0.0;
        let mut interpolated_right = 0.0;

        for j in left_index.wrapping_sub(4)..=left_index.wrapping_add(4) {
            if j < num_samples {
                let fraction = input_index - j as f32;
                let weight = sinc(fraction)
                    * sinc((j as f32 - input_index) * input_rate as f32 / output_rate as f32);

                let left_sample = input_signal[j * 2];
                let right_sample = input_signal[j * 2 + 1];

                interpolated_left += left_sample * weight;
                interpolated_right += right_sample * weight;
            }
        }

        output_signal.push(interpolated_left);
        output_signal.push(interpolated_right);
    }

    output_signal
}

use rubato::{SincFixedIn, SincInterpolationType, WindowFunction};

lazy_static! {
    static ref LOCKED: Arc<RwLock<bool>> = { Arc::new(RwLock::new(false)) };
}

struct SongEndNotifier {
    song: QueueItem,
}

#[async_trait]
impl songbird::events::EventHandler for SongEndNotifier {
    async fn act(&self, _ctx: &EventContext<'_>) -> Option<Event> {
        info!("Removing {} from queue", self.song.song);
        let Some(_success) = QUEUE.write().await.remove(&self.song) else {
            info!("Song already removed from queue");
            *LOCKED.write().await = false;
            return None;
        };
        info!("Removed {} from queue", self.song.song);
        *LOCKED.write().await = false;
        None
    }
}

#[async_trait]
impl poise::serenity_prelude::EventHandler for Hanler {
    // For slash commands or edit tracking to work, forward interaction_create and message_update
    async fn ready(&self, _ctx: poise::serenity_prelude::Context, data_about_bot: Ready) {
        info!("{} logged in", data_about_bot.user.name);

        info!("Spawing status task");
        tokio::task::spawn(update::status_updater(_ctx.clone()));

        let shard_manager = (*self.shard_manager.lock().unwrap()).clone().unwrap();
        let framework_data = poise::FrameworkContext {
            bot_id: UserId(1140810878783070229),
            options: &self.options,
            user_data: &(),
            shard_manager: &shard_manager,
        };

        poise::builtins::register_globally(&_ctx, &framework_data.options().commands)
            .await
            .unwrap();
        let thread_ctx = _ctx.clone();
        tokio::task::spawn(async move {
            let apple =
                yokai_apple::AppleProvider::new(".", "".to_string(), "".to_string()).unwrap();
            // See if any song is in the queue
            loop {
                if *LOCKED.read().await {
                    tokio::time::sleep(Duration::from_millis(250)).await;
                    continue;
                }

                let read = QUEUE.read().await.clone();
                let Some(a) = read.peek() else {
                    //drop(read);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    continue;
                };

                let a = a.0;

                //drop(read);

                *LOCKED.write().await = true;

                info!("Got queue item, playing {}", a.song);

                let track = AppleTrack::from_remote_id(a.song.to_string());
                let Ok(mut audio) = apple.get_audio_track(track).await else {
                    info!("Invalid song");
                    info!("Removing {} from queue", a.song);
                    let Some(_success) = QUEUE.write().await.remove(&a) else {
                        info!("Song already removed from queue");
                        *LOCKED.write().await = false;
                        continue;
                    };
                    info!("Removed {} from queue", a.song);
                    *LOCKED.write().await = false;
                    continue;
                };

                let byte_stream = Arc::new(std::sync::RwLock::new(Vec::new()));

                let mut samplerate = 0;

                let mut position = 0f32;
                let mut started = false;
                while position < audio.get_length().await.unwrap() {
                    let mut data = vec![Vec::new(); 2];
                    info!("Position: {}", position);
                    let segment = audio.get_segment_containing(position).await.unwrap();
                    position += segment.data[0].len() as f32 / segment.sample_rate as f32;
                    samplerate = segment.sample_rate;
                    data[0].extend_from_slice(&segment.data[0]);
                    data[1].extend_from_slice(&segment.data[1]);

                    let mut stream = Vec::new();

                    for sample in 0..data[0].len() {
                        for channel in &data {
                            let sample = channel[sample];
                            stream.push(sample);
                        }
                    }

                    let stream = resample(&stream, samplerate, a.speed.get_value());

                    for sample in stream {
                        byte_stream
                            .write()
                            .unwrap()
                            .extend_from_slice(&sample.to_le_bytes());
                    }

                    if !started {
                        started = true;
                        // Create the playback thread!
                        // Create some important copies of things...
                        let ctx_clone = _ctx.clone();
                        let byte_stream_copy = byte_stream.clone();
                        let a_copy = a.clone();

                        tokio::task::spawn(async move {
                            info!("Started playback thread");

                            let input = Input::new(
                                true,
                                Reader::Extension(Box::new(AudioBuffer::new(
                                    byte_stream_copy.clone(),
                                ))),
                                songbird::input::Codec::FloatPcm,
                                Container::Raw,
                                Some(Metadata {
                                    channels: Some(2),
                                    sample_rate: Some(44100),
                                    ..Default::default()
                                }),
                            );

                            info!("{}", 44100);
                            let manager = songbird::get(&ctx_clone).await.unwrap();
                            let (handle, result) =
                                manager.join(843954443845238864, 1146635519426560140).await;

                            //Track::new_raw(source, commands, handle)

                            let mut handle = handle.lock().await.play_source(input);
                            let _ = handle.add_event(
                                Event::Track(TrackEvent::End),
                                SongEndNotifier { song: a_copy },
                            );
                        });
                    }
                }
            }
        });
    }

    async fn message(
        &self,
        _ctx: poise::serenity_prelude::Context,
        new_message: poise::serenity_prelude::Message,
    ) {
        let shard_manager = (*self.shard_manager.lock().unwrap()).clone().unwrap();
        let framework_data = poise::FrameworkContext {
            bot_id: UserId(846453852164587620),
            options: &self.options,
            user_data: &(),
            shard_manager: &shard_manager,
        };
        poise::dispatch_event(
            framework_data,
            &_ctx,
            &poise::Event::Message { new_message },
        )
        .await;
    }

    async fn interaction_create(
        &self,
        _ctx: poise::serenity_prelude::Context,
        _interaction: poise::serenity_prelude::Interaction,
    ) {
        let shard_manager = (*self.shard_manager.lock().unwrap()).clone().unwrap();
        let framework_data = poise::FrameworkContext {
            bot_id: UserId(846453852164587620),
            options: &self.options,
            user_data: &(),
            shard_manager: &shard_manager,
        };
        poise::dispatch_event(
            framework_data,
            &_ctx,
            &poise::Event::InteractionCreate {
                interaction: _interaction,
            },
        )
        .await;
    }
}

fn main() {
    with_enough_stack(start())
}

async fn start() {
    // Setup our logging solution
    tracing_subscriber::fmt()
        .with_env_filter("ciderbot=trace")
        .init();

    info!("Connecting to SurrealDB @ {}", DATABASE_IP.as_str());

    crate::DB
        .connect::<Ws>(DATABASE_IP.as_str())
        .await
        .expect("Unable to connect to database");
    crate::DB
        .signin(Root {
            username: "root",
            password: &DATABASE_PASSWORD,
        })
        .await
        .unwrap();

    crate::DB.use_ns("cider").use_db("cider-bot").await.unwrap();

    // Setup the developer token object
    let developer_token = TokenLock::default();

    let sb = Songbird::serenity();

    // Shared data to be used in poise/serenity
    let data = Data {
        api: api::AppleMusicApi {
            client: Arc::new(RwLock::new(reqwest::Client::new())),
            developer_token: developer_token.clone(),
        },
        db: Arc::new(RwLock::new(sb)),
    };

    let intents = GatewayIntents::non_privileged()
        | GatewayIntents::MESSAGE_CONTENT
        | GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::GUILD_INTEGRATIONS;

    info!("Spawning token update task");
    tokio::task::spawn(update::token_updater(developer_token.clone()));

    // let c = Client::builder(TOKEN.as_str(), intents).event_handler(event_handler)..register_songbird().await.unwrap();

    let mut handler = Hanler {
        options: poise::FrameworkOptions {
            commands: vec![
                commands::about::about(),
                commands::timezone::timezone(),
                commands::time::time(),
                commands::player::player(),
            ],
            ..Default::default()
        },
        //audio: Arc::new(RwLock::new(Box::new(audio))),
        shard_manager: std::sync::Mutex::new(None),
    };

    poise::set_qualified_names(&mut handler.options.commands);

    let handler = std::sync::Arc::new(handler);

    let mut client = Client::builder(TOKEN.as_str(), intents)
        .event_handler_arc(handler.clone())
        .register_songbird()
        .await
        .unwrap();

    *handler.shard_manager.lock().unwrap() = Some(client.shard_manager.clone());

    client.start().await.unwrap();
}

fn with_enough_stack<T>(fut: impl Future<Output = T> + Send) -> T {
    let stack_size = 100 * 1024 * 1024;

    // Stack frames are generally larger in debug mode.
    #[cfg(debug_assertions)]
    let stack_size = stack_size * 2;

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .thread_stack_size(stack_size)
        .build()
        .unwrap()
        .block_on(fut)
}
