use log::*;
use poise::serenity_prelude::User;

use crate::api;

pub mod about;
pub mod time;
pub mod timezone;

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

/// Returns if the first user passed is higher ranking than the 2nd
pub async fn is_higher(ctx: &Context<'_>, user1: &User, user2: &User) -> bool {
    if user1.id == user2.id {
        return true;
    }

    let Some(guild_id) = ctx.guild_id() else {
        warn!("{} is not in a guild", user1.name);
        return false;
    };

    let Ok(member1) = guild_id.member(&ctx, user1.id).await else {
        warn!("{} is not a member in {}", user1.name, guild_id.0);
        return false;
    };

    let Ok(member2) = guild_id.member(&ctx, user2.id).await else {
        warn!("{} is not a member in {}", user2.name, guild_id.0);
        return false;
    };

    let Some(user1_highest_role) = member1.highest_role_info(&ctx) else {
        warn!("{} does not have a role", user1.name);
        return false;
    };

    let Some(user2_highest_role) = member2.highest_role_info(&ctx) else {
        warn!("{} does not have a role", user2.name);
        return false;
    };
    user1_highest_role.1 > user2_highest_role.1
}
