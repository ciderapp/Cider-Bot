use log::info;

use crate::{
    commands::{Context, Error},
    models::User,
    DB,
};

// Respect user data, and allow the user to remove their data from the database.
/// Delete you data from the database
#[poise::command(slash_command)]
pub async fn deletetimezone(ctx: Context<'_>) -> Result<(), Error> {
    // Assure the user exists before deleting
    let user: Option<User> = DB.select(("user", ctx.author().id.0)).await?;

    if user.is_none() {
        ctx.send(|b| {
            b.content("User is not in the database")
                .reply(true)
                .ephemeral(true)
        })
        .await?;
        return Ok(());
    }

    let _user: User = DB.delete(("user", ctx.author().id.0)).await?;

    info!("Deleting {} in the database", ctx.author().name);

    ctx.send(|b| {
        b.content("Deleted user info in the database.")
            .reply(true)
            .ephemeral(true)
    })
    .await?;
    Ok(())
}
