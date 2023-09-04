use chrono_tz::{Tz, TZ_VARIANTS};
use futures::{Stream, StreamExt};
use log::{info, trace};
use poise::{
    command,
    serenity_prelude::{futures, User as SerenityUser},
};
use serde::{Deserialize, Serialize};

use crate::{
    commands::{is_admin, is_higher, Context, Error},
    models::User,
    DB,
};

async fn autocomplete_timezone<'a>(
    _ctx: Context<'_>,
    partial: &'a str,
) -> impl Stream<Item = String> + 'a {
    futures::stream::iter(TZ_VARIANTS.iter())
        .filter(move |name| {
            futures::future::ready(
                name.to_string()
                    .to_lowercase()
                    .contains(&partial.to_lowercase()),
            )
        })
        .map(|name| name.to_string())
}

#[command(slash_command, subcommands("set", "delete"))]
pub async fn timezone(_ctx: Context<'_>) -> Result<(), Error> {
    Ok(())
}

/// Set your local time zone
#[command(slash_command)]
pub async fn set(
    ctx: Context<'_>,
    #[description = "Provide your local timezone"]
    #[max_length = 32] // Maximum TZ str len
    #[autocomplete = "autocomplete_timezone"]
    timezone: String,
    #[description = "Sets a users timezone (Admin Only)"] user: Option<SerenityUser>,
) -> Result<(), Error> {
    let tz: Tz = timezone.parse()?;

    // If the user option is empty, set as ourself
    // let user = if let Some(user) = user {
    //     // Verify permissions before continuing!!!
    //     if ctx.author().id != user.id && !is_admin(&ctx, &ctx.author()).await
    //         || !is_higher(&ctx, &ctx.author(), &user).await
    //     {
    //         ctx.send(|b| {
    //             b.content("You do not have permissions to set users timezone")
    //                 .reply(true)
    //                 .ephemeral(true)
    //         })
    //         .await?;
    //         return Ok(());
    //     }
    //     user
    // } else {
    //     ctx.author().to_owned()
    // };

    // User::create_if_not_exist(user.id.0, &user.name).await?;

    // // Set TZ in the users profile

    // #[derive(Debug, Serialize, Deserialize)]
    // struct MergeUser {
    //     username: String,
    //     timezone: Option<Tz>,
    // }

    // let user: Option<User> = DB
    //     .update(("user", user.id.0))
    //     .merge(MergeUser {
    //         username: user.name, // Update the username to keep it up-to-date
    //         timezone: Some(tz),
    //     })
    //     .await?;

    // let user = user.unwrap();

    // info!(
    //     "Adding {}'s timezone ({}) to the database",
    //     &user.username, tz
    // );

    // ctx.send(|b| {
    //     b.content(format!("Set timezone to {:?}", tz))
    //         .reply(true)
    //         .ephemeral(true)
    // })
    // .await?;

    // trace!("user: {:?}", &user);
    Ok(())
}

// Respect user data, and allow the user to remove their data from the database.
/// Delete you data from the database
#[poise::command(slash_command)]
pub async fn delete(ctx: Context<'_>) -> Result<(), Error> {
    // Assure the user exists before deleting
    // let user: Option<User> = DB.select(("user", ctx.author().id.0)).await?;

    // if user.is_none() {
    //     ctx.send(|b| {
    //         b.content("User is not in the database")
    //             .reply(true)
    //             .ephemeral(true)
    //     })
    //     .await?;
    //     return Ok(());
    // }

    // #[derive(Debug, Serialize, Deserialize)]
    // struct MergeUser {
    //     timezone: Option<Tz>,
    // }

    // let _user: Option<User> = DB
    //     .update(("user", ctx.author().id.0))
    //     .merge(MergeUser { timezone: None })
    //     .await?;

    info!("Deleting {}'s timezone in the database", ctx.author().name);

    ctx.send(|b| {
        b.content("Deleted user's timezone in the database.")
            .reply(true)
            .ephemeral(true)
    })
    .await?;
    Ok(())
}
