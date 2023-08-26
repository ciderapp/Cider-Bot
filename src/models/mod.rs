use chrono::{DateTime, Utc};
use chrono_tz::Tz;

pub struct User {
    pub id: u64,
    pub timezone: Tz,
    pub created: DateTime<Utc>,
    pub deleted: Option<DateTime<Utc>>
}