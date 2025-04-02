import schedule from "node-schedule";
import ENV from "./dotenv.js";
import bot from "./telegraf.js";

import { fetchExpiredUser, updateUserById } from "../prisma/user.js";
import { deleteEmbyServer } from "../emby.js";
import { userUnbindCommand } from "../utils/index.js";

export default function scheduleJob() {
  schedule.scheduleJob("0 9,21 * * *", async () => {
    await bot.telegram.sendMessage(ENV.TG_GROUP_ID, "📡 正在检查群组内所有用户的订阅状态...");
    const res = await fetchExpiredUser();

    if (!res.data.length) {
      await bot.telegram.sendMessage(ENV.TG_GROUP_ID, "🎉 太棒了，当前群组内都是好朋友 ~");
      return;
    }

    for (const user of res.data) {
      await userUnbindCommand(user.id, Number(user.telegram_id));
    }

    await bot.telegram.sendMessage(ENV.TG_GROUP_ID, `🤡 已处理${res.data.length}个过期用户。`);
  });
}
