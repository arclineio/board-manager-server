import prisma from "../servers/prisma.js";

export const createV2CheckinUser = async (data: { user_id: number; telegram_id: number }) => {
  try {
    const user = await prisma.v2_checkin.create({ data });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("createV2CheckinUser - 创建用户失败，请稍后再试或联系管理员。");
  }
};

export const fetchV2CheckinByTelegramId = async (telegram_id: number) => {
  try {
    const res = await prisma.v2_checkin.findFirst({ where: { telegram_id } });
    return { code: 200, data: res, message: "success" };
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("fetchV2CheckinByTelegramId - 查询用户信息失败，请稍后再试或联系管理员。");
  }
};

export const updateV2CheckinUser = async (id: number, data: { points: number; lastsign_at: Date }) => {
  try {
    const user = await prisma.v2_checkin.update({ where: { id }, data });
    return { code: 200, data: user, message: "success" };
  } catch (error) {
    if (error instanceof Error) throw error;
    else throw new Error("updateV2CheckinUser - 更新用户信息失败，请稍后再试或联系管理员。");
  }
};
