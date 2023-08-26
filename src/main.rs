use poise::{serenity_prelude::GatewayIntents, command, builtins};

use std::sync::Arc;
use tokio::sync::RwLock;

use log::*;

// Submodules
mod api;
mod update;
mod commands;
mod models;
// end Submodules

// Types
type TokenLock = Arc<RwLock<Option<String>>>;
// end Types


#[macro_use]
extern crate lazy_static;

lazy_static! {
    // pub static ref DATABASE_IP: String =
    //     std::env::var("DB_IP").expect("Please set the DB_IP env variable");
    // pub static ref DATABASE_PASSWORD: String =
    //     std::env::var("DB_PASS").expect("Please set the DB_PASS env variable");
    pub static ref TOKEN: String =
        std::env::var("TOKEN").expect("Please set the TOKEN env variable");
}


#[tokio::main]
async fn main() {
    // Setup our logging solution
    tracing_subscriber::fmt()
        .with_env_filter("ciderbot=trace")
        .init();

    // Setup the developer token object
    let developer_token = TokenLock::default();

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
                commands::settimezone::settimezone()
            ],
            event_handler: |_ctx, event, _framework, _data| {
                Box::pin(async move {
                    match event {
                        poise::Event::Message { new_message } => {
                            info!("todo")
                        },
                        _ => (),
                    }
                    Ok(())
                })
            },
            on_error: |error| {
                match error {
                    // Handle a command error. Overriden from the main functionallity of just sending a message.
                    // https://github.com/serenity-rs/poise/blob/e2f40bd88aa13a63bf61b4c9c21a1d0b539f2cc4/src/builtins/mod.rs#L46
                    poise::FrameworkError::Command { error, ctx } => {
                        Box::pin(async move {
                            ctx.send(|b| {
                                b.content(error.to_string())
                                    .reply(true)
                                    .ephemeral(true)
                            }).await.unwrap();
                        })
                    },  
                    // Passthough everything else into its default behaviour
                    _ => {
                        Box::pin(async move {
                            builtins::on_error(error).await.unwrap()
                        })
                    },
                }
            },
            ..Default::default()
        })
        .token(TOKEN.as_str())
        .intents(intents)
        .setup(|ctx, _ready, framework| {
            info!("{} logged in", _ready.user.name);
            tokio::task::spawn(update::status_updater(ctx.clone()));
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(commands::Data {})
            })
        });

    if let Err(why) = framework.run().await {
        error!("Client error: {:?}", why);
    }
}
