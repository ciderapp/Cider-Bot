use poise::{builtins, serenity_prelude::GatewayIntents};
use surrealdb::{
    engine::remote::ws::{Client, Ws},
    opt::auth::Root,
    Surreal,
};

use std::sync::Arc;
use tokio::sync::RwLock;

use log::*;

use crate::commands::Data;

// Submodules
mod api;
mod commands;
mod models;
mod update;
// end Submodules

// Types
type TokenLock = Arc<RwLock<Option<String>>>;
// end Types

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

static DB: Surreal<Client> = Surreal::init();

#[tokio::main]
async fn main() {
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

    // Shared data to be used in poise/serenity
    let data = Data {
        api: api::AppleMusicApi {
            client: Arc::new(RwLock::new(reqwest::Client::new())),
            developer_token: developer_token.clone(),
        },
    };

    let intents = GatewayIntents::non_privileged()
        | GatewayIntents::MESSAGE_CONTENT
        | GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::GUILD_INTEGRATIONS;

    info!("Spawning token update task");
    tokio::task::spawn(update::token_updater(developer_token.clone()));

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                commands::about::about(),
                commands::settimezone::settimezone(),
                commands::time::time(),
            ],
            event_handler: |_ctx, event, _framework, _data| {
                Box::pin(async move {
                    match event {
                        // poise::Event::Message { new_message } => {
                        //     info!("todo")
                        // },
                        _ => (),
                    }
                    Ok(())
                })
            },
            on_error: |error| {
                match error {
                    // Handle a command error. Overriden from the main functionallity of just sending a message.
                    // https://github.com/serenity-rs/poise/blob/e2f40bd88aa13a63bf61b4c9c21a1d0b539f2cc4/src/builtins/mod.rs#L46
                    poise::FrameworkError::Command { error, ctx } => Box::pin(async move {
                        if ctx
                            .send(|b| b.content(error.to_string()).reply(true).ephemeral(true))
                            .await
                            .is_err()
                        {
                            warn!("Unable to send error message to user")
                        };
                    }),
                    // Passthough everything else into its default behaviour
                    _ => Box::pin(async move {
                        if builtins::on_error(error).await.is_err() {
                            warn!("Unable passthough message to its default functionallity")
                        }
                    }),
                }
            },
            ..Default::default()
        })
        .token(TOKEN.as_str())
        .intents(intents)
        .setup(|ctx, _ready, framework| {
            info!("{} logged in", _ready.user.name);

            info!("Spawing status task");
            tokio::task::spawn(update::status_updater(ctx.clone()));
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(data)
            })
        });

    if let Err(why) = framework.run().await {
        error!("Client error: {:?}", why);
    }
}
