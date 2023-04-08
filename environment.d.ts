declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      DISCORD_TOKEN: string;
      DISCORD_ID: string;
      DP_FORCE_YTDL_MODE: "play-dl" | "ytdl-core";
    }
  }
}

export {};
