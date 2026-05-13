"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.listTasks = listTasks;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.toggleTask = toggleTask;
exports.getTaskStats = getTaskStats;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function createTask(input) {
    return prisma_1.default.task.create({
        data: {
            title: input.title,
            type: input.type ?? 'SHORT_TERM',
            description: input.description,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            userId: input.userId,
        },
    });
}
async function listTasks(userId, filters) {
    const where = { userId };
    if (filters?.type)
        where.type = filters.type;
    if (filters?.completed !== undefined)
        where.completed = filters.completed;
    return prisma_1.default.task.findMany({
        where,
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    });
}
async function getTaskById(id, userId) {
    return prisma_1.default.task.findFirst({ where: { id, userId } });
}
async function updateTask(id, userId, input) {
    const existing = await prisma_1.default.task.findFirst({ where: { id, userId } });
    if (!existing)
        return null;
    const data = {};
    if (input.title !== undefined)
        data.title = input.title;
    if (input.type !== undefined)
        data.type = input.type;
    if (input.description !== undefined)
        data.description = input.description;
    if (input.completed !== undefined)
        data.completed = input.completed;
    if (input.dueDate !== undefined) {
        data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    return prisma_1.default.task.update({ where: { id }, data });
}
async function deleteTask(id, userId) {
    const existing = await prisma_1.default.task.findFirst({ where: { id, userId } });
    if (!existing)
        return false;
    await prisma_1.default.task.delete({ where: { id } });
    return true;
}
async function toggleTask(id, userId) {
    const existing = await prisma_1.default.task.findFirst({ where: { id, userId } });
    if (!existing)
        return null;
    return prisma_1.default.task.update({
        where: { id },
        data: { completed: !existing.completed },
    });
}
async function getTaskStats(userId) {
    const [total, completed, shortTerm, longTerm] = await Promise.all([
        prisma_1.default.task.count({ where: { userId } }),
        prisma_1.default.task.count({ where: { userId, completed: true } }),
        prisma_1.default.task.count({ where: { userId, type: 'SHORT_TERM' } }),
        prisma_1.default.task.count({ where: { userId, type: 'LONG_TERM' } }),
    ]);
    return { total, completed, pending: total - completed, shortTerm, longTerm };
}
//# sourceMappingURL=task.service.js.map