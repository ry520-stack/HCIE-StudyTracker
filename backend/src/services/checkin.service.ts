import prisma from '../utils/prisma';

const MAKEUP_MAX = 3;

function getMonday(d: Date): string {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  dt.setDate(diff);
  return dt.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkinToday(userId: string) {
  const date = todayStr();
  const existing = await prisma.checkIn.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) return { ok: false, message: '今天已打卡', checkin: existing };

  const checkin = await prisma.checkIn.create({
    data: { userId, date, timestamp: new Date(), makeup: false },
  });
  return { ok: true, checkin };
}

export async function useMakeup(userId: string, date: string) {
  const today = todayStr();
  if (date > today) return { ok: false, message: '不能补签未来日期' };

  const targetDate = new Date(date + 'T00:00:00');
  const monday = getMonday(new Date());
  if (date < monday) return { ok: false, message: '只能补签本周日期' };

  const existing = await prisma.checkIn.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) return { ok: false, message: '该日期已打卡' };

  // Check makeup usage
  const weekStart = monday;
  let mu = await prisma.makeupUsage.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
  if (!mu) {
    mu = await prisma.makeupUsage.create({ data: { userId, weekStart, count: 0 } });
  }
  if (mu.count >= MAKEUP_MAX) return { ok: false, message: '本周补签卡已用完' };

  await prisma.makeupUsage.update({ where: { id: mu.id }, data: { count: mu.count + 1 } });

  const checkin = await prisma.checkIn.create({
    data: { userId, date, timestamp: new Date(), makeup: true },
  });

  return { ok: true, checkin };
}

export async function getStreak(userId: string) {
  const checkins = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (checkins.find(c => c.date === ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export async function getCheckinStats(userId: string) {
  const total = await prisma.checkIn.count({ where: { userId } });
  const streak = await getStreak(userId);
  const today = todayStr();
  const todayChecked = !!(await prisma.checkIn.findUnique({ where: { userId_date: { userId, date: today } } }));

  const weekStart = getMonday(new Date());
  let mu = await prisma.makeupUsage.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
  const makeupLeft = MAKEUP_MAX - (mu?.count ?? 0);

  // Month checkins
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthCheckins = await prisma.checkIn.count({
    where: { userId, date: { startsWith: monthPrefix } },
  });

  // Month data for calendar
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const monthData = await prisma.checkIn.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });

  return { total, streak, todayChecked, makeupLeft, monthCheckins, monthData };
}

export async function getMonthData(userId: string, year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return prisma.checkIn.findMany({
    where: { userId, date: { startsWith: prefix } },
    orderBy: { date: 'asc' },
  });
}
