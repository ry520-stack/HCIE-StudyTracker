import { api } from './client';

export function checkinToday() {
  return api<any>('POST', '/api/checkin');
}

export function useMakeup(date: string) {
  return api<any>('POST', '/api/checkin/makeup', { date });
}

export function getCheckinStats() {
  return api<any>('GET', '/api/checkin/stats');
}

export function getMonthData(year: number, month: number) {
  return api<any[]>('GET', `/api/checkin/month?year=${year}&month=${month}`);
}
