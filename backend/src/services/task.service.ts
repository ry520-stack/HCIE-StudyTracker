import prisma from '../utils/prisma';

export interface CreateTaskInput {
  title: string;
  type?: 'SHORT_TERM' | 'LONG_TERM';
  description?: string;
  priority?: string;
  dueDate?: string;
  userId: string;
}

export interface UpdateTaskInput {
  title?: string;
  type?: 'SHORT_TERM' | 'LONG_TERM';
  description?: string;
  priority?: string;
  dueDate?: string | null;
  completed?: boolean;
}

export interface TaskResponse {
  id: string;
  title: string;
  type: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export async function createTask(input: CreateTaskInput): Promise<TaskResponse> {
  return prisma.task.create({
    data: {
      title: input.title,
      type: input.type ?? 'SHORT_TERM',
      description: input.description,
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      userId: input.userId,
    },
  });
}

export async function listTasks(
  userId: string,
  filters?: { type?: string; completed?: boolean },
): Promise<TaskResponse[]> {
  const where: any = { userId };
  if (filters?.type) where.type = filters.type;
  if (filters?.completed !== undefined) where.completed = filters.completed;

  return prisma.task.findMany({
    where,
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
  });
}

export async function getTaskById(
  id: string,
  userId: string,
): Promise<TaskResponse | null> {
  return prisma.task.findFirst({ where: { id, userId } });
}

export async function updateTask(
  id: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskResponse | null> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.type !== undefined) data.type = input.type;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.description !== undefined) data.description = input.description;
  if (input.completed !== undefined) data.completed = input.completed;
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.task.delete({ where: { id } });
  return true;
}

export async function toggleTask(
  id: string,
  userId: string,
): Promise<TaskResponse | null> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.task.update({
    where: { id },
    data: { completed: !existing.completed },
  });
}

export async function getTaskStats(userId: string) {
  const [total, completed, shortTerm, longTerm] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.task.count({ where: { userId, type: 'SHORT_TERM' } }),
    prisma.task.count({ where: { userId, type: 'LONG_TERM' } }),
  ]);

  return { total, completed, pending: total - completed, shortTerm, longTerm };
}
