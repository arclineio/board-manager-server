import { Telegraf, session, type Context } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";

import { fetchUserByTelegramId, updateUserTelegramId, fetchUserByToken, fetchExpiredUser } from "./prisma.js";

import extractToken from "./utils/extractToken.js";
import generateInviteLink from "./utils/inviteLink.js";

interface SceneContext extends Context {
  session: {
    token_status?: boolean;
  };
}

dotenv.config();
const bot = new Telegraf<SceneContext>(process.env.TG_BOT_TOKEN);
bot.use(session());

const sendMessage = (chat_id: number, message: string) => {
  bot.telegram.sendMessage(chat_id, message);
};

const handleBindCommand = async (url: string, telegram_chat_id: number, telegram_user_id: number) => {
  const token = extractToken(url);
  if (!token) return sendMessage(telegram_chat_id, "您输入的订阅地址无效，请重新输入。");

  sendMessage(telegram_chat_id, "正在验证您输入的订阅地址...");
  const { code, data } = await fetchUserByToken(token);
  if (code !== 200) return sendMessage(telegram_chat_id, "查询用户信息失败，请稍后再试或联系管理员。");
  if (!data) return sendMessage(telegram_chat_id, "您输入的订阅地址无效，请重新输入。");
  const currentTime = Math.floor(Date.now() / 1000);
  if (data.telegram_id) {
    if (String(data.telegram_id) === String(telegram_user_id))
      return sendMessage(telegram_chat_id, "您已绑定过订阅地址，如需重新绑定，请先使用 /unbind 命令解绑。");
    else return sendMessage(telegram_chat_id, "您输入的订阅地址已被其他用户绑定，请重新输入。");
  } else if (!data.plan_id || !data.group_id) {
    return sendMessage(telegram_chat_id, "您目前未购买任何套餐，请先购买套餐后再绑定。");
  } else if (data.expired_at && data.expired_at <= currentTime) {
    return sendMessage(telegram_chat_id, "您的订阅已过期，请重新购买套餐后再绑定。");
  }

  const res = await updateUserTelegramId(data.id, telegram_user_id);
  if (res.code !== 200) return sendMessage(telegram_chat_id, "绑定失败，请稍后再试或联系管理员。");
  if (!res.data) return sendMessage(telegram_chat_id, "绑定失败，请稍后再试或联系管理员。");
  sendMessage(telegram_chat_id, "绑定成功，您可以使用 /private_group 命令进入专属服务群组。");
};

bot.telegram.setMyCommands(
  [
    { command: "start", description: "启动机器人" },
    { command: "help", description: "查看本机器人命令" },
    { command: "bind", description: "绑定订阅地址" },
    { command: "unbind", description: "解绑订阅地址" },
    { command: "private_group", description: "进入专属群组" },
  ],
  { scope: { type: "all_group_chats" } }
);

bot.telegram.setMyCommands(
  [
    { command: "start", description: "启动机器人" },
    { command: "help", description: "查看本机器人命令" },
    { command: "bind", description: "绑定订阅地址" },
    { command: "unbind", description: "解绑订阅地址" },
    { command: "private_group", description: "进入专属群组" },
    { command: "clean", description: "检查群组所有用户的订阅状态" },
  ],
  { scope: { type: "all_chat_administrators" } }
);

bot.command("start", (ctx) => {
  const message = `您好！${ctx.from.first_name}，欢迎使用本机器人！\n您可以使用 /help 查看本机器人可用命令。`;
  sendMessage(ctx.chat.id, message);
});

bot.command("help", (ctx) => {
  const message = `/start - 启动机器人\n/help - 查看本机器人命令\n/bind - 绑定订阅地址\n/unbind - 解绑订阅地址\n/private_group - 进入专属群组`;
  sendMessage(ctx.chat.id, message);
});

bot.command("bind", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  if (!ctx.args.length) {
    sendMessage(ctx.chat.id, "您未输入订阅地址，请在输入框里重新输入。");
    ctx.session = { token_status: true };
    return bot.on(message("text"), async (ctx) => {
      if (ctx.session && ctx.session.token_status) {
        ctx.session.token_status = false;
        handleBindCommand(ctx.message.text, ctx.chat.id, ctx.from.id);
      }
    });
  }

  handleBindCommand(ctx.args[0], ctx.chat.id, ctx.from.id);
  return;
});

bot.command("unbind", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }
  sendMessage(ctx.chat.id, "正在查询您的账号状态...");
  const res = await fetchUserByTelegramId(ctx.from.id);
  if (res.code !== 200) return sendMessage(ctx.chat.id, "查询用户信息失败，请稍后再试或联系管理员。");
  if (!res.data) return sendMessage(ctx.chat.id, "您未绑定订阅地址，请先使用 /bind 命令绑定订阅地址。");
  const res2 = await updateUserTelegramId(res.data.id, null);
  if (res2.code !== 200) return sendMessage(ctx.chat.id, "解绑失败，请稍后再试或联系管理员。");
  sendMessage(ctx.chat.id, "解绑成功，您可以使用 /bind 命令重新绑定订阅地址。");
});

bot.command("private_group", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  sendMessage(ctx.chat.id, "正在验证您的订阅状态...");
  const res = await fetchUserByTelegramId(ctx.from.id);
  if (res.code !== 200) return sendMessage(ctx.chat.id, "查询用户信息失败，请稍后再试或联系管理员。");
  if (!res.data) return sendMessage(ctx.chat.id, "您未绑定订阅地址，请先使用 /bind 命令绑定订阅地址。");

  const currentTime = Math.floor(Date.now() / 1000);
  if (!res.data.group_id || !res.data.plan_id) {
    return sendMessage(ctx.chat.id, "您目前未拥有任何订阅套餐，请购买后再使用本机器人。");
  } else if (res.data.expired_at && res.data.expired_at <= currentTime) {
    return sendMessage(ctx.chat.id, "您的订阅已过期，请续费后再使用本机器人。");
  }

  sendMessage(ctx.chat.id, "验证通过，即将为您开通专属群组访问权限...");
  const result = await generateInviteLink(ctx.from.id);
  if (result.code !== 200) return sendMessage(ctx.chat.id, "系统处理请求时发生错误，请稍后再试。");
  if (!result.data) return sendMessage(ctx.chat.id, "您已在专属群组中，无需重复加入。");
  sendMessage(ctx.chat.id, `您的专属群组邀请链接为：${result.data.invite_link}`);
});

bot.command("clean", async (ctx) => {
  sendMessage(ctx.chat.id, "正在检查群组所有用户的订阅状态...");

  const res = await fetchExpiredUser();
  if (res.code !== 200) return sendMessage(ctx.chat.id, "查询用户信息失败，请稍后再试。");
  if (!res.data) return sendMessage(ctx.chat.id, "太棒了，当前群组内没有过期用户。");

  let successCount = 0;
  for (const user of res.data) {
    await bot.telegram.kickChatMember(process.env.TG_GROUP_ID, Number(user.telegram_id));
    await updateUserTelegramId(user.id, null);
    successCount++;
  }

  sendMessage(ctx.chat.id, `共找到${res.data.length}个过期用户，成功处理${successCount}个。`);
});

export default bot;
