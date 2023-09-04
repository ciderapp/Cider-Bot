use chrono::{DateTime, Utc};
use chrono_tz::Tz;
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

use crate::DB;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct User {
    pub id: Option<Thing>,
    pub username: String,
    pub timezone: Option<Tz>,
    pub created: DateTime<Utc>,
    pub deleted: Option<DateTime<Utc>>,
}

type Error = Box<dyn std::error::Error + Send + Sync>;

impl User {
    pub async fn create_if_not_exist(id: u64, username: &str) -> Result<Self, Error> {
        // Check to see if the user exists
        let user: Option<User> = DB.select(("user", id)).await?;

        if user.is_none() {
            let user = User {
                username: username.to_string(),
                created: chrono::offset::Utc::now(),
                ..Default::default()
            };

            let user: Option<User> = DB.update(("user", id)).content(&user).await?;

            Ok(user.unwrap())
        } else {
            Ok(user.unwrap())
        }
    }
}
