import schedule from "node-schedule";
import dotenv from "dotenv";
import bot from "./telegraf.js";

import { fetchExpiredUser, updateUserById } from "../prisma.js";
import { deleteEmbyServer } from "../emby.js";

dotenv.config();
const TG_GROUP_ID = process.env.TG_GROUP_ID;

export default function scheduleJob() {
  schedule.scheduleJob("0 * * * *", async () => {
    await bot.telegram.sendMessage(TG_GROUP_ID, "📡 正在检查群组所有用户的订阅状态...");
    const res = await fetchExpiredUser();

    if (!res.data.length) {
      await bot.telegram.sendMessage(TG_GROUP_ID, "🎉 太棒了，当前群组内都是好朋友 ~");
      return;
    }

    for (const user of res.data) {
      await bot.telegram.banChatMember(TG_GROUP_ID, Number(user.telegram_id));
      await updateUserById(user.id, null);
      await deleteEmbyServer(Number(user.telegram_id), false);
    }

    await bot.telegram.sendMessage(TG_GROUP_ID, `已处理${res.data.length}个过期用户。`);
  });
}
