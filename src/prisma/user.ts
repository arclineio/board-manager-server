import prisma from "../servers/prisma.js";

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
