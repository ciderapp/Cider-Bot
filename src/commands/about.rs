use poise::command;

use crate::commands::{Context, Error};

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
pub async fn about(
    ctx: Context<'_>,
) -> Result<(), Error> {
    
    ctx.say(format!(
        "Version: {}
Author(s): {}
Build time: {}
Commit hash: [{hash}](https://github.com/ciderapp/Cider-Bot/commit/{hash})
Rust version: {}",
        option_env!("CARGO_PKG_VERSION").na(),
        split_authors(&option_env!("CARGO_PKG_AUTHORS").na()),
        option_env!("VERGEN_BUILD_TIMESTAMP").na(),
        option_env!("VERGEN_RUSTC_SEMVER").na(),
        hash=option_env!("VERGEN_GIT_SHA").na()
    )).await?;
    Ok(())
}