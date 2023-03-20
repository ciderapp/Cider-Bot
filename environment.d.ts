declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      DISCORD_TOKEN: string;
      DISCORD_ID: string;
    }
  }
}

export {};
