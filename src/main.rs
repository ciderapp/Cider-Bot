#![feature(lazy_cell)]
use poise::{
    builtins,
    serenity_prelude::{
        async_trait, Client, ClientBuilder, EventHandler, GatewayIntents, Http, Ready,
        ShardManager, Timestamp, UserId,
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
    tracks::{Track, TrackHandle},
    Event, EventContext, SerenityInit, Songbird, TrackEvent,
};
use thiserror::Error;
use yokai::{
    prelude::{AudioStream, Playback},
    provider::Provider,
};
use yokai_apple::{AppleProvider, AppleTrack};

use std::{fmt, future::Future, sync::Arc, thread, time::Duration};
use tokio::{sync::RwLock, time::Instant};

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
mod vpath;
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

use once_cell::sync::Lazy;
static DB: Lazy<Surreal<surrealdb::engine::remote::ws::Client>> = Lazy::new(Surreal::init);

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

struct SongEndNotifier {
    song: QueueItem,
}

lazy_static! {
    pub static ref PROVIDER: Arc<RwLock<Option<AppleProvider<'static>>>> =
        Arc::new(RwLock::new(None));
    pub static ref APPLE_TOKEN: TokenLock = Arc::new(RwLock::new(None));
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

        *PROVIDER.write().await = Some(
            yokai_apple::AppleProvider::new(
                ".",
                "".to_string(),
                APPLE_TOKEN.read().await.clone().unwrap(),
            )
            .unwrap(),
        );
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

    // crate::DB
    //     .connect::<Ws>(DATABASE_IP.as_str())
    //     .await
    //     .expect("Unable to connect to database");
    // crate::DB
    //     .signin(Root {
    //         username: "root",
    //         password: &DATABASE_PASSWORD,
    //     })
    //     .await
    //     .unwrap();

    // crate::DB.use_ns("cider").use_db("cider-bot").await.unwrap();

    // Setup the developer token object

    let intents = GatewayIntents::non_privileged()
        | GatewayIntents::MESSAGE_CONTENT
        | GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::GUILD_INTEGRATIONS;

    info!("Spawning token update task");
    tokio::task::spawn(update::token_updater(APPLE_TOKEN.clone()));

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
