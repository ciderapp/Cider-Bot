pub mod about;
pub mod settimezone;
pub mod time;

// Data for all commands to access
pub struct Data {}

// Misc data structures for commands
type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;
