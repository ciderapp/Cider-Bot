use std::{
    error::Error,
    fmt::{self, write},
    sync::Arc,
};

use log::info;
use reqwest::{
    header::{HeaderMap, HeaderValue},
    Method,
};

use serde_json::Value;
use thiserror::Error;
use tokio::sync::RwLock;

use crate::{vpath::ValuePath, TokenLock};

pub struct AppleMusicApi {
    pub client: Arc<RwLock<reqwest::Client>>,
    pub developer_token: TokenLock,
}

impl AppleMusicApi {
    const URL: &'static str = "https://api.music.apple.com/";
    pub fn new(token: TokenLock) -> Self {
        AppleMusicApi {
            client: Arc::new(RwLock::new(reqwest::Client::new())),
            developer_token: token,
        }
    }

    pub async fn request_endpoint(
        &self,
        method: Method,
        endpoint: &str,
    ) -> Result<Value, reqwest::Error> {
        let req = self
            .client
            .read()
            .await
            .request(method, endpoint)
            .headers(Self::build_headers(
                self.developer_token.read().await.as_ref().unwrap(),
            ))
            .send()
            .await?;

        req.json().await
    }

    fn build_headers(token: &String) -> HeaderMap {
        let mut headers = HeaderMap::new();

        headers.insert(
            "Authorization",
            HeaderValue::from_str(&format!("Bearer {}", token)).unwrap(),
        );

        headers.insert("DNT", HeaderValue::from_static("1"));
        headers.insert(
            "authority",
            HeaderValue::from_static("amp-api.music.apple.com"),
        );
        headers.insert(
            "origin",
            HeaderValue::from_static("https://beta.music.apple.com"),
        );
        headers.insert(
            "referer",
            HeaderValue::from_static("https://beta.music.apple.com"),
        );
        headers.insert("sec-fetch-dest", HeaderValue::from_static("empty"));
        headers.insert("sec-fetch-mode", HeaderValue::from_static("cors"));
        headers.insert("sec-fetch-site", HeaderValue::from_static("same-site"));

        headers
    }

    pub async fn get_song_info(&self, id: u64, storefront: &str) -> Result<Song, AppleMusicError> {
        let response = self
            .request_endpoint(
                Method::GET,
                &format!("{}v1/catalog/{storefront}/songs/{id}", Self::URL),
            )
            .await?;
        info!("{:#?}", response);
        let song: Root = serde_json::from_value(response).unwrap();

        Ok(song.data[0].clone())
    }
}

#[derive(Debug, Error)]
pub enum AppleMusicError {
    RequestError(reqwest::Error),
}

impl fmt::Display for AppleMusicError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "An error occured with the Apple Music api request. {}",
            self.to_string()
        )
    }
}

impl From<reqwest::Error> for AppleMusicError {
    fn from(value: reqwest::Error) -> Self {
        AppleMusicError::RequestError(value)
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Root {
    data: Vec<Song>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub id: String,
    pub attributes: Attributes,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Attributes {
    pub duration_in_millis: u64,
    pub artwork: Artwork,
    pub name: String,
    pub artist_name: String,
    pub url: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Artwork {
    pub url: String,
}

pub fn wh(url: &str, w: u32, h: u32) -> String {
    url.replace("{w}", &format!("{}", w))
        .replace("{h}", &format!("{}", h))
}
