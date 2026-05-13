import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  console.warn('[auth] 未设置 JWT_SECRET 环境变量，使用不安全的临时密钥。请在生产环境中设置 JWT_SECRET。');
}

export interface AuthPayload {
  userId: string;
  role: string;
}

const JWT_SECRET: string = SECRET || 'hcie-dev-fallback-not-for-production';

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export async function register(username: string, email: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    throw new Error(existing.username === username ? '用户名已存在' : '邮箱已被注册');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('邮箱或密码错误');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('邮箱或密码错误');

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}
