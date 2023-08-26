use std::sync::Arc;

use reqwest::{
    header::{HeaderMap, HeaderValue},
    Method,
};

use serde_json::Value;
use tokio::sync::RwLock;

use crate::TokenLock;

pub struct AppleMusicApi {
    pub client: Arc<RwLock<reqwest::Client>>,
    pub developer_token: TokenLock,
}

impl AppleMusicApi {
    pub async fn request_endpoint(
        &self,
        method: Method,
        endpoint: &str,
    ) -> Result<Value, reqwest::Error> {
        let req = self
            .client
            .read()
            .await
            .request(method, format!("https://api.music.apple.com/{}", endpoint))
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
}
