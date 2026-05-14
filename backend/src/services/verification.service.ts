import prisma from '../utils/prisma';
import { sendVerificationCode } from './email.service';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendCode(email: string): Promise<{ success: boolean; message: string }> {
  // 检查邮箱是否已注册
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, message: '该邮箱已被注册' };
  }

  // 清除旧验证码
  await prisma.verificationCode.deleteMany({ where: { email } });

  // 频率限制：检查最近60秒是否已发送
  const recent = await prisma.verificationCode.findFirst({
    where: {
      email,
      createdAt: { gte: new Date(Date.now() - 60000) },
    },
  });
  if (recent) {
    return { success: false, message: '请60秒后再试' };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

  const sent = await sendVerificationCode(email, code);
  if (!sent) {
    return { success: false, message: '邮件发送失败，请检查服务器邮件配置' };
  }

  await prisma.verificationCode.create({
    data: { email, code, expiresAt },
  });

  return { success: true, message: '验证码已发送，5分钟内有效' };
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return false;

  // 标记已使用
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}
