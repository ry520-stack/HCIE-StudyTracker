import { api } from './client';

export interface TaskItem {
  id: string;
  title: string;
  type: 'SHORT_TERM' | 'LONG_TERM';
  description: string | null;
  priority: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  shortTerm: number;
  longTerm: number;
}

export function createTask(data: { title: string; type?: string; priority?: string; dueDate?: string }) {
  return api<TaskItem>('POST', '/api/tasks', data);
}

export function listTasks(params?: { type?: string; completed?: boolean }) {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.completed !== undefined) q.set('completed', String(params.completed));
  const qs = q.toString();
  return api<TaskItem[]>('GET', `/api/tasks${qs ? '?' + qs : ''}`);
}

export function updateTask(id: string, data: Partial<TaskItem>) {
  return api<TaskItem>('PUT', `/api/tasks/${id}`, data);
}

export function toggleTask(id: string) {
  return api<TaskItem>('PATCH', `/api/tasks/${id}/toggle`);
}

export function deleteTask(id: string) {
  return api<void>('DELETE', `/api/tasks/${id}`);
}

export function getTaskStats() {
  return api<TaskStats>('GET', '/api/tasks/stats');
}
