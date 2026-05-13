import prisma from '../utils/prisma';

const ACHIEVEMENTS = [
  { id: 'first_task', icon: '✅', name: '第一步', desc: '创建第一个任务' },
  { id: '5_tasks', icon: '📋', name: '规划者', desc: '创建5个任务' },
  { id: 'first_note', icon: '📝', name: '笔记入门', desc: '创建第一篇笔记' },
  { id: '10_notes', icon: '📚', name: '知识库', desc: '创建10篇笔记' },
  { id: 'first_review', icon: '🔄', name: '温故知新', desc: '完成第一次复习' },
  { id: 'first_focus', icon: '⏱️', name: '专注者', desc: '完成第一次专注' },
  { id: 'focus_10', icon: '🔥', name: '专注达人', desc: '完成10次专注' },
  { id: 'streak_3', icon: '📅', name: '连续3天', desc: '连续打卡3天' },
  { id: 'streak_7', icon: '🌟', name: '一周全勤', desc: '连续打卡7天' },
  { id: 'streak_30', icon: '👑', name: '月度冠军', desc: '连续打卡30天' },
  { id: 'total_1h', icon: '⏰', name: '1小时', desc: '累计专注1小时' },
  { id: 'total_10h', icon: '🏆', name: '10小时', desc: '累计专注10小时' },
  { id: 'total_50h', icon: '💎', name: '50小时', desc: '累计专注50小时' },
  { id: 'notes_master', icon: '🧠', name: '记忆大师', desc: '积累5个已巩固笔记' },
];

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({ where: { userId } });
}

export async function checkAndUnlock(userId: string) {
  const unlocked = await getUserAchievements(userId);
  const unlockedIds = new Set(unlocked.map(u => u.achievementId));

  // Compute conditions
  const [taskCount, noteCount, reviewedCount, focusCompleted, focusSessions, checkins] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.note.count({ where: { userId } }),
    prisma.note.count({ where: { userId, reviewCount: { gt: 0 } } }),
    prisma.focusSession.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.focusSession.findMany({ where: { userId } }),
    prisma.checkIn.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
  ]);

  const totalElapsed = focusSessions.reduce((s: number, f: any) => s + (f.elapsed || 0), 0);
  const totalMin = Math.round(totalElapsed / 60);
  const notesMastered = await prisma.note.count({ where: { userId, nextReviewAt: null } });

  // Calculate streak
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (checkins.find((c: any) => c.date === ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  const conditions: Record<string, boolean> = {
    first_task: taskCount >= 1,
    '5_tasks': taskCount >= 5,
    first_note: noteCount >= 1,
    '10_notes': noteCount >= 10,
    first_review: reviewedCount >= 1,
    first_focus: focusCompleted >= 1,
    focus_10: focusCompleted >= 10,
    streak_3: streak >= 3,
    streak_7: streak >= 7,
    streak_30: streak >= 30,
    total_1h: totalMin >= 60,
    total_10h: totalMin >= 600,
    total_50h: totalMin >= 3000,
    notes_master: notesMastered >= 5,
  };

  const newUnlocks: any[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.has(ach.id) && conditions[ach.id]) {
      const ua = await prisma.userAchievement.create({
        data: { userId, achievementId: ach.id },
      });
      newUnlocks.push({ ...ach, unlockedAt: ua.unlockedAt });
    }
  }

  return { achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockedIds.has(a.id) })), newUnlocks };
}

export async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  try { return JSON.parse(user.settings); } catch { return {}; }
}

export async function updateUserSettings(userId: string, settings: any) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const current = JSON.parse(user.settings || '{}');
  Object.assign(current, settings);
  await prisma.user.update({ where: { id: userId }, data: { settings: JSON.stringify(current) } });
  return current;
}

// Daily Goal
export async function getDailyGoal(userId: string, date: string) {
  return prisma.dailyGoal.findUnique({ where: { userId_date: { userId, date } } });
}

export async function upsertDailyGoal(userId: string, date: string, targetMinutes: number) {
  return prisma.dailyGoal.upsert({
    where: { userId_date: { userId, date } },
    update: { targetMinutes },
    create: { userId, date, targetMinutes },
  });
}

// Daily Journal
export async function getDailyJournal(userId: string, date: string) {
  return prisma.dailyJournal.findUnique({ where: { userId_date: { userId, date } } });
}

export async function upsertDailyJournal(userId: string, date: string, content: string) {
  return prisma.dailyJournal.upsert({
    where: { userId_date: { userId, date } },
    update: { content },
    create: { userId, date, content },
  });
}

// 重置用户全部数据（保留账号和名言）
export async function resetUserData(userId: string) {
  await prisma.$transaction([
    prisma.reviewRecord.deleteMany({ where: { note: { userId } } }),
    prisma.note.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { userId } }),
    prisma.focusSession.deleteMany({ where: { userId } }),
    prisma.checkIn.deleteMany({ where: { userId } }),
    prisma.makeupUsage.deleteMany({ where: { userId } }),
    prisma.dailyGoal.deleteMany({ where: { userId } }),
    prisma.dailyJournal.deleteMany({ where: { userId } }),
    prisma.userAchievement.deleteMany({ where: { userId } }),
  ]);
  return { ok: true, message: '所有数据已重置' };
}

// Dashboard summary
export async function getDashboardSummary(userId: string) {
  const date = new Date().toISOString().slice(0, 10);

  const [tasks, notes, focusSessions, checkinStats, goal, journal, achData] = await Promise.all([
    prisma.task.findMany({ where: { userId }, orderBy: [{ completed: 'asc' }, { updatedAt: 'desc' }] }),
    prisma.note.findMany({ where: { userId }, orderBy: { nextReviewAt: 'asc' } }),
    prisma.focusSession.findMany({ where: { userId }, orderBy: { startedAt: 'desc' }, take: 50 }),
    getCheckinStatsLocal(userId),
    getDailyGoal(userId, date),
    getDailyJournal(userId, date),
    checkAndUnlock(userId),
  ]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completed).length;
  const dueNotes = notes.filter(n => n.nextReviewAt && new Date(n.nextReviewAt) <= new Date());
  const totalMin = Math.round(focusSessions.reduce((s, f) => s + (f.elapsed || 0), 0) / 60);

  return {
    tasks: { total: totalTasks, done: doneTasks, pending: totalTasks - doneTasks, recent: tasks.filter(t => !t.completed).slice(0, 3) },
    notes: { total: notes.length, due: dueNotes.length, dueList: dueNotes.slice(0, 3) },
    focus: { totalSessions: focusSessions.length, totalMin, recentSessions: focusSessions.slice(0, 5) },
    checkin: checkinStats,
    goal: goal || { targetMinutes: 120 },
    journal: journal || { content: '' },
    achievements: achData.achievements,
    newUnlocks: achData.newUnlocks,
  };
}

async function getCheckinStatsLocal(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  })();

  const [total, todayCheckin, mu, checkins] = await Promise.all([
    prisma.checkIn.count({ where: { userId } }),
    prisma.checkIn.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.makeupUsage.findUnique({ where: { userId_weekStart: { userId, weekStart } } }),
    prisma.checkIn.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
  ]);

  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (checkins.find(c => c.date === ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  return {
    total, streak,
    todayChecked: !!todayCheckin,
    makeupLeft: Math.max(0, 3 - (mu?.count ?? 0)),
    todayCheckin: todayCheckin || null,
  };
}
