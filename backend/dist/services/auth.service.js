"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const SECRET = process.env.JWT_SECRET || 'fallback-secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, SECRET, { expiresIn: EXPIRES });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
async function register(username, email, password) {
    const existing = await prisma_1.default.user.findFirst({
        where: { OR: [{ username }, { email }] },
    });
    if (existing) {
        throw new Error(existing.username === username ? '用户名已存在' : '邮箱已被注册');
    }
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: { username, email, password: hashed },
    });
    const token = signToken({ userId: user.id, role: user.role });
    return { token, user: { id: user.id, username: user.username, email: user.email } };
}
async function login(email, password) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error('邮箱或密码错误');
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        throw new Error('邮箱或密码错误');
    const token = signToken({ userId: user.id, role: user.role });
    return { token, user: { id: user.id, username: user.username, email: user.email } };
}
//# sourceMappingURL=auth.service.js.map