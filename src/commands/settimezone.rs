use chrono_tz::{Tz, TZ_VARIANTS};
use futures::{Stream, StreamExt};
use log::{info, trace};
use poise::{
    command,
    serenity_prelude::{futures, User as SerenityUser},
};
use serde::{Deserialize, Serialize};

use crate::{
    commands::{is_admin, Context, Error},
    models::User,
    DB,
};

async fn autocomplete_timezone<'a>(
    _ctx: Context<'_>,
    partial: &'a str,
) -> impl Stream<Item = String> + 'a {
    futures::stream::iter(TZ_VARIANTS.iter())
        .filter(move |name| {
            futures::future::ready(name.to_string().to_lowercase().contains(partial))
        })
        .map(|name| name.to_string())
}

/// Set your local time zone
#[command(slash_command)]
pub async fn settimezone(
    ctx: Context<'_>,
    #[description = "Provide your local timezone"]
    #[autocomplete = "autocomplete_timezone"]
    timezone: String,
    #[description = "Sets a users timezone (Admin Only)"] user: Option<SerenityUser>,
) -> Result<(), Error> {
    let tz: Tz = timezone.parse()?;
    ctx.send(|b| {
        b.content(format!("Set timezone to {:?}", tz))
            .reply(true)
            .ephemeral(true)
    })
    .await?;

    // If the user option is empty, set as ourself
    let user = if let Some(user) = user {
        // Verify permissions before continuing!!!
        if ctx.author().id.0 != user.id.0 && !is_admin(&ctx, &ctx.author()).await {
            ctx.send(|b| {
                b.content("You do not have permissions to set users timezone")
                    .reply(true)
                    .ephemeral(true)
            })
            .await?;
            return Ok(());
        }
        user
    } else {
        ctx.author().to_owned()
    };

    User::create_if_not_exist(user.id.0, &user.name).await?;

    // Set TZ in the users profile

    #[derive(Debug, Serialize, Deserialize)]
    struct MergeUser {
        timezone: Option<Tz>,
    }

    let user: User = DB
        .update(("user", user.id.0))
        .merge(MergeUser { timezone: Some(tz) })
        .await?;

    info!(
        "Adding {}'s timezone ({}) to the database",
        user.username, tz
    );
    trace!("user: {:?}", user);
    Ok(())
}
