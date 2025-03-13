import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TG_GROUP_ID = process.env.TG_GROUP_ID;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

export default async function generateInviteLink(user_id: number) {
  try {
    const getChatMember = `https://api.telegram.org/bot${TG_BOT_TOKEN}/getChatMember`;
    const res = await axios.get(getChatMember, { params: { chat_id: TG_GROUP_ID, user_id } });
    if (res.data.result.status !== "left") {
      return { code: 200, data: null, message: "success" };
    }

    const createChatInviteLink = `https://api.telegram.org/bot${TG_BOT_TOKEN}/createChatInviteLink`;
    const expire_date = Math.floor(Date.now() / 1000) + 600;
    const res2 = await axios.post(createChatInviteLink, { chat_id: TG_GROUP_ID, expire_date, member_limit: 1 });
    if (res2.data.ok) {
      return { code: 200, data: res2.data.result, message: "success" };
    }
    return { code: 500, data: null, message: "error" };
  } catch (error) {
    return { code: 500, data: null, message: "error" };
  }
}
