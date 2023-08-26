use log::info;
use poise::{command, serenity_prelude::futures};
use chrono_tz::{TZ_VARIANTS, Tz};
use serde::{Serialize, Deserialize};
use futures::{Stream, StreamExt};

use crate::{commands::{Context, Error}, models::User, DB};

async fn autocomplete_timezone<'a>(
    _ctx: Context<'_>,
    partial: &'a str
) -> impl Stream<Item = String> + 'a {
    futures::stream::iter(TZ_VARIANTS.iter())
        .filter(move |name| futures::future::ready(name.to_string().starts_with(partial)))
        .map(|name| name.to_string())
}

/// Set your local time zone
#[command(slash_command)]
pub async fn settimezone(
    ctx: Context<'_>, 
    #[description = "Provide your local timezone"] 
    #[autocomplete = "autocomplete_timezone"]
    timezone: String,
) -> Result<(), Error> {
    let tz: Tz = timezone.parse()?;
    //ctx.say(format!("timezone: {:?}", tz)).await?;
    ctx.send(|b| {
        b.content(format!("timezone: {:?}", tz))
            .reply(true)
            .ephemeral(true)
    })
    .await?;

    User::create_if_not_exist(ctx.author().id.0, &ctx.author().name).await?;

    // Set TZ in the users profile

    #[derive(Debug, Serialize, Deserialize)]
    struct MergeUser {
        timezone: Option<Tz>,
    }

    let user: User = DB.update(("user", ctx.author().id.0))
        .merge(MergeUser {
            timezone: Some(tz)
        }).await?;

    info!("user: {:?}", user);
    Ok(())
}