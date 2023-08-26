use poise::{serenity_prelude::GatewayIntents, command};

use std::sync::Arc;
use tokio::sync::RwLock;

use log::*;

// Submodules
mod api;
mod update;
// end Submodules

// Types
type TokenLock = Arc<RwLock<Option<String>>>;
// end Types


struct Data {} // User data, which is stored and accessible in all command invocations
type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

pub fn split_authors(authors: &str) -> String {
    authors.split(':').collect::<Vec<&str>>().join(", ")
}

trait NaIfNone {
    fn na(&self) -> String;
}

impl NaIfNone for Option<&str> {
    fn na(&self) -> String {
        self.unwrap_or("N/A").to_string()
    }
}

/// Get information about Cider
#[command(slash_command)]
async fn about(
    ctx: Context<'_>,
) -> Result<(), Error> {
    
    ctx.say(format!(
        "Version: {}
Author(s): {}
Build time: {}
Commit hash: [{hash}](https://github.com/ciderapp/Cidar/commit/{hash})
Rust version: {}",
        option_env!("CARGO_PKG_VERSION").na(),
        split_authors(&option_env!("CARGO_PKG_AUTHORS").na()),
        option_env!("VERGEN_BUILD_TIMESTAMP").na(),
        option_env!("VERGEN_RUSTC_SEMVER").na(),
        hash=option_env!("VERGEN_GIT_SHA").na()
    )).await?;
    Ok(())
}

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
            commands: vec![about()],
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
            ..Default::default()
        })
        .token(TOKEN.as_str())
        .intents(intents)
        .setup(|ctx, _ready, framework| {
            info!("{} logged in", _ready.user.name);
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(Data {})
            })
        });

    if let Err(why) = framework.run().await {
        error!("Client error: {:?}", why);
    }
}
