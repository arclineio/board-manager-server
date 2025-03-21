import dotenv from "dotenv";
import bot, { MessageUpdate, commandList } from "./servers/telegraf.js";

import { createV2CheckinUser, fetchV2CheckinByTelegramId, updateV2CheckinUser } from "./prisma/checkin.js";
import { createV2EmbyUser, fetchV2EmbyByTelegramId } from "./prisma/emby.js";
import { fetchUserByTelegramId, updateUserById, fetchUserByToken } from "./prisma/user.js";

import scheduleJob from "./servers/schedule.js";
import { extractToken, generateInviteLink, generateEmbyServerLine } from "./utils/index.js";
import { createEmbyUser, deleteEmbyServer } from "./emby.js";

dotenv.config();

const sendMessage = (chat_id: number, message: string) => {
  bot.telegram.sendMessage(chat_id, message);
};

const handleBindCommand = async (url: string, chat_id: number, telegram_id: number) => {
  const token = extractToken(url);
  if (!token) return sendMessage(chat_id, "您输入的订阅地址无效，请重新输入。");
  sendMessage(chat_id, "正在验证您输入的订阅地址...");

  try {
    const res = await fetchUserByToken(token);
    if (!res.data) throw new Error("您输入的订阅地址无效，请重新输入。");
    if (res.data.telegram_id) {
      if (String(res.data.telegram_id) === String(telegram_id)) throw new Error("当前账号已绑定过订阅地址，无需重复绑定。");
      else throw new Error("您输入的订阅地址已被其他用户绑定，请重新输入。");
    } else if (!res.data.plan_id || !res.data.group_id) {
      throw new Error("您目前未拥有任何套餐，请先购买套餐后再绑定。");
    } else if (res.data.expired_at && res.data.expired_at <= Math.floor(Date.now() / 1000)) {
      throw new Error("您的订阅已过期，请先续费套餐后再绑定。");
    }
    await updateUserById(res.data.id, telegram_id);
    await createV2CheckinUser({ user_id: res.data.id, telegram_id });
    sendMessage(chat_id, "绑定成功，您可以使用 /private_group 命令进入专属服务群组。");
  } catch (error) {
    sendMessage(chat_id, (error as Error).message);
  }
};

bot.command("start", (ctx) => {
  const message = `亲爱的 <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> 您好，欢迎使用本机器人。\n\n您可以使用 /help 查看本机器人可用命令。`;
  bot.telegram.sendMessage(ctx.chat.id, message, { parse_mode: "HTML" });
});

bot.command("help", (ctx) => {
  const message = `以下是本机器人可用的命令：\n\n` + commandList.map((cmd) => `/${cmd.command} - ${cmd.description}`).join("\n");
  bot.telegram.sendMessage(ctx.chat.id, message);
});

bot.command("bind", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return bot.telegram.sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  if (!ctx.args.length) {
    bot.telegram.sendMessage(ctx.chat.id, "请输入完整的订阅地址：");
    ctx.session = { token_status: true };
    return bot.on(MessageUpdate("text"), (ctx) => {
      if (ctx.session && ctx.session.token_status) {
        ctx.session.token_status = false;
        handleBindCommand(ctx.message.text, ctx.chat.id, ctx.from.id);
      }
    });
  }

  if (ctx.args.length !== 1) return bot.telegram.sendMessage(ctx.chat.id, "当前命令仅支持一个参数，请重新绑定。");
  handleBindCommand(ctx.args[0], ctx.chat.id, ctx.from.id);
  return;
});

bot.command("unbind", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  try {
    sendMessage(ctx.chat.id, "📡 正在查询您的账号状态...");
    const res = await fetchUserByTelegramId(ctx.from.id);
    if (!res.data) throw new Error("您未绑定订阅地址，请先使用 /bind 命令绑定订阅地址。");
    await updateUserById(res.data.id, null);
    await deleteEmbyServer(ctx.from.id);
    sendMessage(ctx.chat.id, "解绑成功，您可以使用 /bind 命令重新绑定订阅地址。");
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

const checkEmbyAccountStatus = async (telegram_id: number) => {
  try {
    const res = await fetchUserByTelegramId(telegram_id);

    if (!res.data) throw new Error("您未绑定订阅地址，请先使用 /bind 命令绑定订阅地址。");
    if (!res.data.plan_id || !res.data.group_id) {
      throw new Error("您目前未购买任何套餐，请先购买套餐后再绑定。");
    } else if (res.data.expired_at && res.data.expired_at <= Math.floor(Date.now() / 1000)) {
      throw new Error("您的订阅已过期，请重新购买套餐后再绑定。");
    }

    return res.data;
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("查询用户信息失败，请稍后再试或联系管理员。");
  }
};

bot.command("create_emby_account", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  try {
    sendMessage(ctx.chat.id, "📡 正在查询您的账号状态...");
    const res = await checkEmbyAccountStatus(ctx.from.id);

    const embyUserRes = await fetchV2EmbyByTelegramId(ctx.from.id);
    if (embyUserRes.data) return sendMessage(ctx.chat.id, "您已绑定 Emby 账号，请先使用 /find_emby_account 命令查询 Emby 信息。");

    sendMessage(ctx.chat.id, "正在为您创建Emby账号...");
    const embyRes = await createEmbyUser(res.email);
    const { embyId, username, password } = embyRes.data;
    const params = { user_id: res.id, telegram_id: ctx.from.id, emby_id: embyId, username, password };
    const res3 = await createV2EmbyUser(params);
    bot.telegram.sendMessage(ctx.chat.id, generateEmbyServerLine(res3.data.username, res3.data.password), { parse_mode: "HTML" });
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

bot.command("find_emby_account", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  try {
    sendMessage(ctx.chat.id, "📡 正在查询您的账号状态...");
    await checkEmbyAccountStatus(ctx.from.id);
    const res = await fetchV2EmbyByTelegramId(ctx.from.id);
    if (!res.data) throw new Error("您未绑定 Emby 账号，请先使用 /create_emby_account 命令创建 Emby 账号。");
    bot.telegram.sendMessage(ctx.chat.id, generateEmbyServerLine(res.data.username, res.data.password), { parse_mode: "HTML" });
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

bot.command("delete_emby_account", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }
  try {
    sendMessage(ctx.chat.id, "📡 正在查询您的账号状态...");
    await deleteEmbyServer(ctx.from.id, true);
    sendMessage(ctx.chat.id, "Emby 账号删除成功。");
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

bot.command("private_group", async (ctx) => {
  if (ctx.chat.type !== "private") {
    ctx.deleteMessage();
    return sendMessage(ctx.chat.id, "当前命令仅支持私聊使用。");
  }

  try {
    sendMessage(ctx.chat.id, "📡 正在查询您的账号状态...");
    await checkEmbyAccountStatus(ctx.from.id);
    const res = await generateInviteLink(ctx.from.id);
    sendMessage(ctx.chat.id, `已为您开通专属进群通道，10分钟内有效，仅限您加入。\n\n您的专属群组邀请链接为：${res.data.invite_link}`);
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

bot.command("sign", async (ctx) => {
  console.log(ctx.chat.id);

  if (ctx.chat.type === "private") {
    ctx.deleteMessage();
    sendMessage(ctx.chat.id, "当前命令仅支持在群组中使用。");
  }

  try {
    const res = await fetchV2CheckinByTelegramId(ctx.from.id);
    if (!res.data) return;
    const lastSignDate = res.data.lastsign_at ? new Date(res.data.lastsign_at) : null;
    const today = new Date();
    if (lastSignDate && lastSignDate.toDateString() === today.toDateString()) {
      bot.telegram.sendMessage(ctx.chat.id, "您今天已经签到过了，请勿重复签到。", {
        reply_parameters: {
          message_id: ctx.message.message_id,
        },
      });
      return;
    }

    // 生成随机积分（10-30）
    const pointsEarned = Math.floor(Math.random() * 21) + 10;
    const newPoints = (res.data.points || 0) + pointsEarned;
    await updateV2CheckinUser(res.data.id, { points: newPoints, lastsign_at: today });
    bot.telegram.sendMessage(ctx.chat.id, `签到成功！获得 ${pointsEarned} 积分，当前总积分：${newPoints}`, {
      reply_parameters: { message_id: ctx.message.message_id },
    });
  } catch (error) {
    sendMessage(ctx.chat.id, (error as Error).message);
  }
});

(async () => {
  bot.launch();
  scheduleJob();
})();
