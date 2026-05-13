import prisma from '../utils/prisma';

export interface CreateSessionInput {
  duration?: number;
  userId: string;
}

export interface UpdateSessionInput {
  elapsed?: number;
  switched?: number;
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface SessionResponse {
  id: string;
  startedAt: Date;
  duration: number;
  elapsed: number;
  switched: number;
  status: string;
  createdAt: Date;
  userId: string;
}

// 创建专注会话
export async function createSession(
  input: CreateSessionInput,
): Promise<SessionResponse> {
  return prisma.focusSession.create({
    data: {
      duration: input.duration ?? 2700,
      userId: input.userId,
    },
  });
}

// 获取用户会话列表（支持分页：limit / offset）
export async function listSessions(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<SessionResponse[]> {
  return prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// 获取单条
export async function getSessionById(
  id: string,
  userId: string,
): Promise<SessionResponse | null> {
  return prisma.focusSession.findFirst({ where: { id, userId } });
}

// 更新会话（结束倒计时时由前端调用，传入最终数据）
export async function updateSession(
  id: string,
  userId: string,
  input: UpdateSessionInput,
): Promise<SessionResponse | null> {
  const existing = await prisma.focusSession.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const data: any = {};
  if (input.elapsed !== undefined) data.elapsed = input.elapsed;
  if (input.switched !== undefined) data.switched = input.switched;
  if (input.status !== undefined) data.status = input.status;

  return prisma.focusSession.update({ where: { id }, data });
}

// 删除
export async function deleteSession(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.focusSession.findFirst({
    where: { id, userId },
  });
  if (!existing) return false;

  await prisma.focusSession.delete({ where: { id } });
  return true;
}

// 统计：今日总时长 / 成功次数
export async function getTodayStats(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      startedAt: { gte: today },
    },
  });

  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.status === 'COMPLETED' ? s.elapsed : 0),
    0,
  );
  const completedCount = sessions.filter(
    (s) => s.status === 'COMPLETED',
  ).length;

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    completedCount,
    totalCount: sessions.length,
  };
}
