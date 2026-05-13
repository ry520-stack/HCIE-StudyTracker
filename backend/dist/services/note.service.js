"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNote = createNote;
exports.listNotes = listNotes;
exports.getNoteById = getNoteById;
exports.updateNote = updateNote;
exports.deleteNote = deleteNote;
exports.reviewNote = reviewNote;
exports.getDueNotes = getDueNotes;
exports.getNoteHealth = getNoteHealth;
const prisma_1 = __importDefault(require("../utils/prisma"));
const ebbinghaus_1 = require("./ebbinghaus");
function formatNote(note) {
    return {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
    };
}
function parseTags(tags) {
    return JSON.stringify(tags ?? []);
}
// 创建笔记（自动计算首次复习时间）
async function createNote(input) {
    const note = await prisma_1.default.note.create({
        data: {
            title: input.title,
            content: input.content,
            tags: parseTags(input.tags),
            nextReviewAt: (0, ebbinghaus_1.getNextReviewTime)(0),
            reviewCount: 0,
            userId: input.userId,
        },
    });
    return formatNote(note);
}
// 获取用户的所有笔记，支持标签筛选、按下次复习时间排序
async function listNotes(userId, tag) {
    const where = { userId };
    if (tag) {
        where.tags = { contains: tag };
    }
    const notes = await prisma_1.default.note.findMany({
        where,
        orderBy: { nextReviewAt: 'asc' },
    });
    return notes.map(formatNote);
}
// 获取单条笔记
async function getNoteById(id, userId) {
    const note = await prisma_1.default.note.findFirst({
        where: { id, userId },
    });
    return note ? formatNote(note) : null;
}
// 更新笔记（不重置艾宾浩斯进度）
async function updateNote(id, userId, input) {
    const existing = await prisma_1.default.note.findFirst({ where: { id, userId } });
    if (!existing)
        return null;
    const data = {};
    if (input.title !== undefined)
        data.title = input.title;
    if (input.content !== undefined)
        data.content = input.content;
    if (input.tags !== undefined)
        data.tags = parseTags(input.tags);
    const note = await prisma_1.default.note.update({ where: { id }, data });
    return formatNote(note);
}
// 删除笔记
async function deleteNote(id, userId) {
    const existing = await prisma_1.default.note.findFirst({ where: { id, userId } });
    if (!existing)
        return false;
    await prisma_1.default.note.delete({ where: { id } });
    return true;
}
// 复习笔记：记录复习 + 计算下一次复习时间
async function reviewNote(id, userId) {
    const existing = await prisma_1.default.note.findFirst({ where: { id, userId } });
    if (!existing)
        return null;
    const newReviewCount = existing.reviewCount + 1;
    const [updatedNote] = await prisma_1.default.$transaction([
        prisma_1.default.note.update({
            where: { id },
            data: {
                reviewCount: newReviewCount,
                nextReviewAt: (0, ebbinghaus_1.getNextReviewTime)(newReviewCount),
            },
        }),
        prisma_1.default.reviewRecord.create({
            data: {
                stage: newReviewCount,
                noteId: id,
            },
        }),
    ]);
    return formatNote(updatedNote);
}
// 获取今日待复习笔记
async function getDueNotes(userId) {
    const now = new Date();
    const notes = await prisma_1.default.note.findMany({
        where: {
            userId,
            nextReviewAt: { lte: now },
        },
        orderBy: { nextReviewAt: 'asc' },
    });
    return notes.map(formatNote);
}
// 获取笔记记忆健康度统计
async function getNoteHealth(id, userId) {
    const note = await prisma_1.default.note.findFirst({ where: { id, userId } });
    if (!note)
        return null;
    // 取最近一条复习记录，若无则用创建时间
    const lastReview = await prisma_1.default.reviewRecord.findFirst({
        where: { noteId: id },
        orderBy: { reviewedAt: 'desc' },
    });
    const lastReviewDate = lastReview?.reviewedAt ?? note.createdAt;
    const elapsedDays = Math.floor((Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
        retentionRate: (0, ebbinghaus_1.getRetentionRate)(elapsedDays, note.reviewCount),
        daysSinceLastReview: elapsedDays,
    };
}
//# sourceMappingURL=note.service.js.map