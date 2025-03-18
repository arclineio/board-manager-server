import { Telegraf, session, type Context } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";

interface SceneContext extends Context {
  session: {
    token_status?: boolean;
  };
}

dotenv.config();
const bot = new Telegraf<SceneContext>(process.env.TG_BOT_TOKEN);
bot.use(session());

const commandList = [
  { command: "start", description: "启动机器人" },
  { command: "help", description: "查看本机器人命令" },
  { command: "bind", description: "绑定订阅地址" },
  { command: "unbind", description: "解绑订阅地址" },
  { command: "create_emby_account", description: "创建 Emby 账号" },
  { command: "find_emby_account", description: "查看 Emby 账号" },
  { command: "delete_emby_account", description: "删除 Emby 账号" },
  { command: "private_group", description: "进入专属群组" },
];

bot.telegram.setMyCommands(commandList);

export { message as MessageUpdate, commandList };
export default bot;
