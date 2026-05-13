"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.listSessions = listSessions;
exports.getSessionById = getSessionById;
exports.updateSession = updateSession;
exports.deleteSession = deleteSession;
exports.getTodayStats = getTodayStats;
const prisma_1 = __importDefault(require("../utils/prisma"));
// 创建专注会话
async function createSession(input) {
    return prisma_1.default.focusSession.create({
        data: {
            duration: input.duration ?? 2700,
            userId: input.userId,
        },
    });
}
// 获取用户会话列表（支持分页：limit / offset）
async function listSessions(userId, limit = 20, offset = 0) {
    return prisma_1.default.focusSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
    });
}
// 获取单条
async function getSessionById(id, userId) {
    return prisma_1.default.focusSession.findFirst({ where: { id, userId } });
}
// 更新会话（结束倒计时时由前端调用，传入最终数据）
async function updateSession(id, userId, input) {
    const existing = await prisma_1.default.focusSession.findFirst({
        where: { id, userId },
    });
    if (!existing)
        return null;
    const data = {};
    if (input.elapsed !== undefined)
        data.elapsed = input.elapsed;
    if (input.switched !== undefined)
        data.switched = input.switched;
    if (input.status !== undefined)
        data.status = input.status;
    return prisma_1.default.focusSession.update({ where: { id }, data });
}
// 删除
async function deleteSession(id, userId) {
    const existing = await prisma_1.default.focusSession.findFirst({
        where: { id, userId },
    });
    if (!existing)
        return false;
    await prisma_1.default.focusSession.delete({ where: { id } });
    return true;
}
// 统计：今日总时长 / 成功次数
async function getTodayStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = await prisma_1.default.focusSession.findMany({
        where: {
            userId,
            startedAt: { gte: today },
        },
    });
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.status === 'COMPLETED' ? s.elapsed : 0), 0);
    const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
    return {
        totalMinutes: Math.round(totalSeconds / 60),
        completedCount,
        totalCount: sessions.length,
    };
}
//# sourceMappingURL=focus.service.js.map