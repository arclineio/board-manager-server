import axios from "axios";
import ENV from "../servers/dotenv.js";

const extractToken = (url: string): string | null => {
  if (!/^https?:\/\//i.test(url)) return null;
  const urlObject = new URL(url);

  const queryToken = urlObject.searchParams.get("token");
  if (queryToken) return queryToken;

  const segments = urlObject.pathname.split("/").filter(Boolean);
  const pathToken = segments[segments.length - 1];

  if (pathToken && pathToken.length === 32) return pathToken;
  return null;
};

const generateInviteLink = async (user_id: number) => {
  try {
    const getChatMember = `https://api.telegram.org/bot${ENV.TG_BOT_TOKEN}/getChatMember`;
    const res = await axios.get(getChatMember, { params: { chat_id: ENV.TG_GROUP_ID, user_id } });
    if (res.data.result.status === "member") throw new Error("你已经是群成员，无需重复加入。");
    if (res.data.result.status === "kicked") throw new Error("您由于历史订阅到期被请出群聊，请联系管理员。");

    const createChatInviteLink = `https://api.telegram.org/bot${ENV.TG_BOT_TOKEN}/createChatInviteLink`;
    const res2 = await axios.post(createChatInviteLink, {
      chat_id: ENV.TG_GROUP_ID,
      expire_date: Math.floor(Date.now() / 1000) + 600,
      member_limit: 1,
    });
    if (!res2.data.ok) throw new Error("生成邀请链接失败，请稍后再试或联系管理员。");
    return { code: 200, data: res2.data.result, message: "success" };
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("生成邀请链接失败，请稍后再试或联系管理员。");
  }
};

const generateEmbyServerLine = (username: string, password: string) => {
  const serverUrlTemplate = ENV.EMBY_SERVER_LINE.split("&&")
    .map((url) => url.trim())
    .join("\n");

  return `
您的 Emby 账号信息如下：

账号：<code>${username}</code>
密码：<code>${password}</code>


Emby 服务器连接信息如下：

${serverUrlTemplate}
`;
};

export { extractToken, generateInviteLink, generateEmbyServerLine };
