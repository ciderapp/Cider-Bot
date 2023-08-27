use crate::{
    commands::{Context, Error},
    DB,
};
use chrono::{DateTime, Utc};
use poise::{command, serenity_prelude::User};

/// Displays user's local time
#[command(slash_command)]
pub async fn time(
    ctx: Context<'_>,
    #[description = "User"] user: Option<User>,
) -> Result<(), Error> {
    // If the optional user field is empty, read ourself. Why? idfk.
    let user = if user.is_some() {
        user.unwrap()
    } else {
        ctx.author().to_owned()
    };

    // Get timezone in the database from the given user
    let db_user: Option<crate::models::User> = DB.select(("user", user.id.0)).await?;

    if let Some(u) = db_user {
        if let Some(tz) = u.timezone {
            let current_utc_time: DateTime<Utc> = Utc::now();
            let local_time = current_utc_time.with_timezone(&tz);

            ctx.send(|b| {
                b.embed(|e| {
                    e.title(local_time.format("%I:%M%p (%I:%M:%S %Z)"))
                        .color(15093583)
                        .author(|a| {
                            a.name(format!("Current timezone for @{}", user.name))
                                .icon_url(user.static_avatar_url().unwrap_or("".to_string()))
                        })
                        .footer(|f| f.text(local_time.format("%B %e, %Y - %A")))
                })
                .reply(true)
            })
            .await?;
        } else {
            ctx.send(|b| {
                b.content("Could not find user's timezone in the database. Please tell them to set thier timezone using </settimezone:1145068192146935888>")
                    .reply(true)
                    .ephemeral(true)
            }).await?;
        }
    } else {
        ctx.send(|b| {
            b.content("Could not find user in the database.")
                .reply(true)
                .ephemeral(true)
        })
        .await?;
    }

    Ok(())
}
