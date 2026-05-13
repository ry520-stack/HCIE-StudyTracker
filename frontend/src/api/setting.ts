import { api } from './client';

export function getDashboard() {
  return api<any>('GET', '/api/setting/dashboard');
}

export function getSettings() {
  return api<any>('GET', '/api/setting/settings');
}

export function updateSettings(settings: Record<string, any>) {
  return api<any>('PUT', '/api/setting/settings', settings);
}

export function getAchievements() {
  return api<any>('GET', '/api/setting/achievements');
}

export function getDailyGoal(date?: string) {
  const q = date ? `?date=${date}` : '';
  return api<any>('GET', `/api/setting/goal${q}`);
}

export function updateDailyGoal(targetMinutes: number, date?: string) {
  const q = date ? `?date=${date}` : '';
  return api<any>('PUT', `/api/setting/goal${q}`, { targetMinutes });
}

export function getDailyJournal(date?: string) {
  const q = date ? `?date=${date}` : '';
  return api<any>('GET', `/api/setting/journal${q}`);
}

export function updateDailyJournal(content: string, date?: string) {
  const q = date ? `?date=${date}` : '';
  return api<any>('PUT', `/api/setting/journal${q}`, { content });
}
