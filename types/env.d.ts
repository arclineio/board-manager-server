declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TG_BOT_TOKEN: string;
      TG_GROUP_ID: string;

      DATABASE_URL: string;

      EMBY_URL: string;
      EMBY_API_KEY: string;
      EMBY_TEMPLATE_USER_ID: string;
      EMBY_USER_PREFIX: string;
      EMBY_SERVER_LINE: string;
    }
  }
}

export {};
