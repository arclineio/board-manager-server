import prisma from "./servers/prisma.js";
import { deleteEmbyUser } from "./emby.js";

export const fetchUserByToken = async (token: string) => {
  try {
    const res = await prisma.v2_user.findFirst({ where: { token } });
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    throw new Error("fetchUserByToken - 查询用户信息失败，请稍后再试或联系管理员。");
  }
};

export const fetchUserByTelegramId = async (telegram_id: number) => {
  try {
    const res = await prisma.v2_user.findFirst({ where: { telegram_id } });
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    throw new Error("fetchUserByTelegramId - 查询用户信息失败，请稍后再试或联系管理员。");
  }
};

export const updateUserById = async (id: number, telegram_id: number | null) => {
  try {
    const user = await prisma.v2_user.update({ where: { id }, data: { telegram_id } });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    throw new Error("updateUserById - 更新用户信息失败，请稍后再试或联系管理员。");
  }
};

export const fetchExpiredUser = async () => {
  try {
    const users = await prisma.v2_user.findMany({
      where: { telegram_id: { not: null }, expired_at: { lt: Math.floor(Date.now() / 1000) } },
    });

    return { code: 200, data: users, message: "success" };
  } catch (error) {
    throw new Error("fetchExpiredUser - 查询群组内绑定用户失败，请稍后再试或联系管理员。");
  }
};

export const fetchEmbyUserByTelegramId = async (telegram_id: number) => {
  try {
    const res = await prisma.v2_emby.findFirst({ where: { telegram_id } });
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    throw new Error("fetchEmbyUserByTelegramId - 查询用户信息失败，请稍后再试或联系管理员。");
  }
};

export const createV2EmbyUser = async (data: { user_id: number; emby_id: string; telegram_id: number; username: string; password: string }) => {
  try {
    const user = await prisma.v2_emby.create({ data });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    // 在此处，需要删除 emby 用户信息
    try {
      await deleteEmbyUser(data.emby_id);
      throw new Error("deleteEmbyUser - 同步 Emby 用户库信息失败，请稍后再试或联系管理员。");
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error("createSQLEmbyUser - 创建 Emby 用户失败，请稍后再试或联系管理员。");
    }
  }
};

export const deleteEmbyUserByTelegramId = async (telegram_id: number) => {
  try {
    const { count } = await prisma.v2_emby.deleteMany({ where: { telegram_id } });
    return { code: 200, data: count, message: "success" };
  } catch (error) {
    throw new Error("deleteEmbyUserByTelegramId - 删除 Emby 账号失败，请稍后再试或联系管理员。");
  }
};
