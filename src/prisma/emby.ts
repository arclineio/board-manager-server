import prisma from "../servers/prisma.js";
import { deleteEmbyUser } from "../emby.js";

export const createV2EmbyUser = async (data: { user_id: number; emby_id: string; telegram_id: number; username: string; password: string }) => {
  try {
    const user = await prisma.v2_emby.create({ data });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    try {
      await deleteEmbyUser(data.emby_id);
      throw new Error("deleteEmbyUser - 同步 Emby 用户库信息失败，请稍后再试或联系管理员。");
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error("createSQLEmbyUser - 创建 Emby 用户失败，请稍后再试或联系管理员。");
    }
  }
};

export const fetchV2EmbyByTelegramId = async (telegram_id: number) => {
  try {
    const res = await prisma.v2_emby.findFirst({ where: { telegram_id } });
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    throw new Error("fetchV2EmbyByTelegramId - 查询用户信息失败，请稍后再试或联系管理员。");
  }
};

export const deleteV2EmbyByTelegramId = async (telegram_id: number) => {
  try {
    const { count } = await prisma.v2_emby.deleteMany({ where: { telegram_id } });
    return { code: 200, data: count, message: "success" };
  } catch (error) {
    throw new Error("deleteV2EmbyByTelegramId - 删除 Emby 账号失败，请稍后再试或联系管理员。");
  }
};
