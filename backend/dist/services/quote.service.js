"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyQuote = getDailyQuote;
exports.createQuote = createQuote;
exports.deleteQuote = deleteQuote;
exports.listQuotes = listQuotes;
const prisma_1 = __importDefault(require("../utils/prisma"));
const DEFAULT_QUOTE = '天行健，君子以自强不息';
// 获取每日一言（优先随机返回用户自定义的，否则返回默认）
async function getDailyQuote() {
    const count = await prisma_1.default.quote.count();
    if (count === 0) {
        return { id: null, content: DEFAULT_QUOTE, author: null, isDefault: true };
    }
    // 随机偏移取一条
    const randomIndex = Math.floor(Math.random() * count);
    const [quote] = await prisma_1.default.quote.findMany({
        skip: randomIndex,
        take: 1,
    });
    return {
        id: quote.id,
        content: quote.content,
        author: quote.author,
        isDefault: false,
    };
}
async function createQuote(content, author) {
    const quote = await prisma_1.default.quote.create({
        data: { content, author: author ?? null },
    });
    return { id: quote.id, content: quote.content, author: quote.author, isDefault: false };
}
async function deleteQuote(id) {
    try {
        await prisma_1.default.quote.delete({ where: { id } });
        return true;
    }
    catch {
        return false;
    }
}
async function listQuotes() {
    const quotes = await prisma_1.default.quote.findMany({ orderBy: { createdAt: 'desc' } });
    return quotes.map((q) => ({
        id: q.id,
        content: q.content,
        author: q.author,
        isDefault: false,
    }));
}
//# sourceMappingURL=quote.service.js.map