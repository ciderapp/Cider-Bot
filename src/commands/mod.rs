use log::{info, trace, warn};
use poise::serenity_prelude::{Permissions, User};

use crate::api;

pub mod about;
pub mod settimezone;
pub mod time;

// Data for all commands to access
pub struct Data {
    pub api: api::AppleMusicApi,
}

// Misc data structures for commands
type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

// User permissions
pub async fn is_admin(ctx: &Context<'_>, user: &User) -> bool {
    let Some(guild_id) = ctx.guild_id() else {
        warn!("{} is not in a guild", user.name);
        return false;
    };

    let Ok(member) = guild_id.member(&ctx, user.id).await else {
        warn!("{} is not a member in {}", user.name, guild_id.0);
        return false;
    };

    let Ok(permissions) = member.permissions(ctx) else {
        info!("{} does not have any permissions", user.name);
        return false;
    };

    permissions.administrator()
        || permissions.manage_guild()
        || permissions.moderate_members()
        || permissions.kick_members()
}
