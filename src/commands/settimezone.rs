use log::info;
use poise::{command, CreateReply};
use chrono_tz::Tz;

use crate::commands::{Context, Error};

/// Set your local time zone
#[command(slash_command)]
pub async fn settimezone(
    ctx: Context<'_>, #[description = "Provide your local timezone"] timezone: String,
) -> Result<(), Error> {
    let tz: Tz = timezone.parse()?;
    info!("timezone: {:?}", tz);
    //ctx.say(format!("timezone: {:?}", tz)).await?;
    ctx.send(|b| {
        b.content(format!("timezone: {:?}", tz))
            .reply(true)
            .ephemeral(true)
    })
    .await?;
    Ok(())
}