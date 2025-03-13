import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const fetchUserByToken = async (token: string) => {
  try {
    const user = await prisma.v2_user.findFirst({ where: { token } });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    return { code: 500, data: null, message: "error" };
  }
};

export const fetchUserByTelegramId = async (telegram_id: number) => {
  try {
    const user = await prisma.v2_user.findFirst({ where: { telegram_id } });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    return { code: 500, data: null, message: "error" };
  }
};

export const updateUserTelegramId = async (id: number, telegram_id: number | null) => {
  try {
    const user = await prisma.v2_user.update({ where: { id }, data: { telegram_id } });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    return { code: 500, data: null, message: "error" };
  }
};

export const fetchExpiredUser = async () => {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 604800; // 7天前时间戳
    const users = await prisma.v2_user.findMany({
      where: { telegram_id: { not: null }, expired_at: { lt: sevenDaysAgo } },
    });

    return { code: 200, data: users, message: "success" };
  } catch (error) {
    return { code: 500, data: null, message: "error" };
  }
};
