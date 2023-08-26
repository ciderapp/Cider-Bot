use std::time::Duration;

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
            .await else {
                warn!("Failed to get new token, keeping previous");
                return
            };

        let Ok(serialized) = response
            .json::<TokenBody>()
            .await else {
                warn!("Failed to get new token, keeping previous");
                return
            };

        *token.write().await = Some(serialized.token);

        tokio::time::sleep(Duration::from_secs(60 * 30)).await; // Sleep for 30 minutes
    }
}

// pub async fn status_updater(ctx: serenity::prelude::Context) {
//     let status = OnlineStatus::DoNotDisturb;
//     loop {
//         let read_store: Store = crate::DB
//             .select(("stats", "conversions"))
//             .await
//             .unwrap_or(Store::default());
//         let activity = Activity::listening(format!(
//             "Cider | {} songs converted",
//             read_store.total_conversions
//         ));
//         ctx.set_presence(Some(activity.clone()), status).await;
//         tokio::time::sleep(Duration::from_secs(10)).await;
//     }
// }
