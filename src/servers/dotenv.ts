import dotenv from "dotenv";

dotenv.config();

const ENV = {
  EMBY_URL: process.env.EMBY_URL,
  EMBY_API_KEY: process.env.EMBY_API_KEY,
  EMBY_TEMPLATE_USER_ID: process.env.EMBY_TEMPLATE_USER_ID,
  EMBY_USER_PREFIX: process.env.EMBY_USER_PREFIX,
  TG_GROUP_ID: process.env.TG_GROUP_ID,
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN,
  EMBY_SERVER_LINE: process.env.EMBY_SERVER_LINE,
};

export default ENV;
