import axios from "axios";
import dotenv from "dotenv";

import { fetchEmbyUserByTelegramId, deleteEmbyUserByTelegramId } from "./prisma.js";

dotenv.config();

const EMBY_URL = process.env.EMBY_URL;
const EMBY_API_KEY = process.env.EMBY_API_KEY;
const EMBY_TEMPLATE_USER_ID = process.env.EMBY_TEMPLATE_USER_ID;
const EMBY_USER_PREFIX = process.env.EMBY_USER_PREFIX;

const fetchHeaders = {
  headers: {
    "X-Emby-Token": EMBY_API_KEY,
    "Content-Type": "application/json",
  },
};

const generateRandomPassword = (length = 8): string => {
  // 定义字母、数字和特殊字符
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHKLMNPQRSTUVWXYZ";
  const digits = "023456789";
  const special = "@#$%&";
  // 确保密码包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符
  let password = [
    letters[Math.floor(Math.random() * 26) + 26],
    letters[Math.floor(Math.random() * 26)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  // 剩余位数随机填充
  const allChars = letters + digits + special;
  for (let i = 0; i < length - 4; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  // 打乱密码顺序
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
};

export const updateEmbyUserPassword = async (userId: string, password: string, isReset = false) => {
  const requestUrl = `${EMBY_URL}/emby/Users/${userId}/Password`;
  const data = { Id: userId, NewPw: password, ResetPassword: isReset };
  await axios.post(requestUrl, data, fetchHeaders);
};

export const createEmbyUser = async (email: string) => {
  try {
    const requestUrl = `${EMBY_URL}/emby/Users/New`;
    const username = EMBY_USER_PREFIX ? `${EMBY_USER_PREFIX}#${email}` : email;
    const password = generateRandomPassword(12);
    const data = { Name: username, CopyFromUserId: EMBY_TEMPLATE_USER_ID, UserCopyOptions: "UserPolicy,UserConfiguration" };
    const res = await axios.post(requestUrl, data, fetchHeaders);
    const embyId = res.data.Id;
    await updateEmbyUserPassword(embyId, password);
    return { code: 200, data: { embyId, username, password }, message: "success" };
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("创建 Emby 用户失败，请稍后再试或联系管理员。");
  }
};

export const deleteEmbyUser = async (userId: string) => {
  try {
    const requestUrl = `${EMBY_URL}/emby/Users/${userId}`;
    const { data: res } = await axios.delete(requestUrl, fetchHeaders);
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    throw new Error("删除 Emby 用户失败，请稍后再试或联系管理员。");
  }
};

export const deleteEmbyServer = async (telegram_id: number, tips = false) => {
  try {
    const res = await fetchEmbyUserByTelegramId(telegram_id);
    // 检查是否需要提示且用户未绑定 Emby 账号
    if (tips && !res.data) throw new Error("您未绑定 Emby 账号，无需删除。");
    // 如果用户未绑定 Emby 账号，直接返回
    if (!res.data) return;

    await deleteEmbyUserByTelegramId(telegram_id);
    await deleteEmbyUser(res.data.emby_id);
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("查询用户信息失败，请稍后再试或联系管理员。");
  }
};
