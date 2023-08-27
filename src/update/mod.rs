use std::time::Duration;

use poise::serenity_prelude::{Activity, Context, OnlineStatus};
use serde::{Deserialize, Serialize};
use tracing::log::*;

use crate::TokenLock;

#[derive(Debug, Serialize, Deserialize)]
struct TokenBody {
    token: String,
}

pub async fn token_updater(token: TokenLock) {
    let client = reqwest::Client::new();
    loop {
        let Ok(response) = client
            .get("https://api.cider.sh/v1")
            .header("User-Agent", "Cider")
            .header("Referer", "tauri.localhost")
            .send()
            .await
        else {
            warn!("Failed to get new token, keeping previous");
            return;
        };

        let Ok(serialized) = response.json::<TokenBody>().await else {
            warn!("Failed to get new token, keeping previous");
            return;
        };

        *token.write().await = Some(serialized.token);

        tokio::time::sleep(Duration::from_secs(60 * 30)).await; // Sleep for 30 minutes
    }
}

pub async fn status_updater(ctx: Context) {
    let status = OnlineStatus::DoNotDisturb;
    loop {
        let activity = Activity::watching(format!("Cider | BOT IN DEVELOPMENT"));
        ctx.set_presence(Some(activity.clone()), status).await;
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}
