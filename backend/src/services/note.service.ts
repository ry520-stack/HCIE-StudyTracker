import prisma from '../utils/prisma';
import { getNextReviewTime, getRetentionRate } from './ebbinghaus';

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
  userId: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  nextReviewAt: Date | null;
  reviewCount: number;
  userId: string;
}

function formatNote(note: any): NoteResponse {
  return {
    ...note,
    tags: JSON.parse(note.tags || '[]'),
  };
}

function parseTags(tags?: string[]): string {
  return JSON.stringify(tags ?? []);
}

// 创建笔记（自动计算首次复习时间）
export async function createNote(input: CreateNoteInput): Promise<NoteResponse> {
  const note = await prisma.note.create({
    data: {
      title: input.title,
      content: input.content,
      tags: parseTags(input.tags),
      nextReviewAt: getNextReviewTime(0),
      reviewCount: 0,
      userId: input.userId,
    },
  });
  return formatNote(note);
}

// 获取用户的所有笔记，支持标签筛选、按下次复习时间排序
export async function listNotes(
  userId: string,
  tag?: string,
): Promise<NoteResponse[]> {
  const where: any = { userId };

  if (tag) {
    where.tags = { contains: tag };
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: { nextReviewAt: 'asc' },
  });
  return notes.map(formatNote);
}

// 获取单条笔记
export async function getNoteById(
  id: string,
  userId: string,
): Promise<NoteResponse | null> {
  const note = await prisma.note.findFirst({
    where: { id, userId },
  });
  return note ? formatNote(note) : null;
}

// 更新笔记（不重置艾宾浩斯进度）
export async function updateNote(
  id: string,
  userId: string,
  input: UpdateNoteInput,
): Promise<NoteResponse | null> {
  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.tags !== undefined) data.tags = parseTags(input.tags);

  const note = await prisma.note.update({ where: { id }, data });
  return formatNote(note);
}

// 删除笔记
export async function deleteNote(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.note.delete({ where: { id } });
  return true;
}

// 复习笔记：记录复习 + 计算下一次复习时间
export async function reviewNote(
  id: string,
  userId: string,
): Promise<NoteResponse | null> {
  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const newReviewCount = existing.reviewCount + 1;
  const REVIEW_INTERVALS_LENGTH = 8;

  const [updatedNote] = await prisma.$transaction([
    prisma.note.update({
      where: { id },
      data: {
        reviewCount: newReviewCount,
        nextReviewAt: newReviewCount < REVIEW_INTERVALS_LENGTH ? getNextReviewTime(newReviewCount) : null,
      },
    }),
    prisma.reviewRecord.create({
      data: {
        stage: newReviewCount,
        noteId: id,
      },
    }),
  ]);

  return formatNote(updatedNote);
}

// 获取今日待复习笔记
export async function getDueNotes(userId: string): Promise<NoteResponse[]> {
  const now = new Date();
  const notes = await prisma.note.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
    },
    orderBy: { nextReviewAt: 'asc' },
  });
  return notes.map(formatNote);
}

// 获取笔记记忆健康度统计
export async function getNoteHealth(
  id: string,
  userId: string,
): Promise<{ retentionRate: number; daysSinceLastReview: number } | null> {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) return null;

  // 取最近一条复习记录，若无则用创建时间
  const lastReview = await prisma.reviewRecord.findFirst({
    where: { noteId: id },
    orderBy: { reviewedAt: 'desc' },
  });

  const lastReviewDate = lastReview?.reviewedAt ?? note.createdAt;
  const elapsedDays = Math.floor(
    (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    retentionRate: getRetentionRate(elapsedDays, note.reviewCount),
    daysSinceLastReview: elapsedDays,
  };
}
