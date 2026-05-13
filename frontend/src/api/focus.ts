import { api } from './client';

export interface FocusSession {
  id: string;
  startedAt: string;
  duration: number;
  elapsed: number;
  switched: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  userId: string;
}

export interface TodayStats {
  totalMinutes: number;
  completedCount: number;
  totalCount: number;
}

export function createSession(duration: number) {
  return api<FocusSession>('POST', '/api/focus-sessions', { duration });
}

export function updateSession(id: string, data: { status?: string; elapsed?: number; switched?: number }) {
  return api<FocusSession>('PATCH', `/api/focus-sessions/${id}`, data);
}

export function getTodayStats() {
  return api<TodayStats>('GET', '/api/focus-sessions/today-stats');
}

export function listSessions(limit = 20, offset = 0) {
  return api<FocusSession[]>('GET', `/api/focus-sessions?limit=${limit}&offset=${offset}`);
}
