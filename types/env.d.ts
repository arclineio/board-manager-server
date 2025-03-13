declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TG_BOT_TOKEN: string;
      TG_GROUP_ID: string;
      DATABASE_URL: string;
    }
  }
}

export {};
