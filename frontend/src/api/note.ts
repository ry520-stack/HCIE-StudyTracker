import { api } from './client';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  nextReviewAt: string | null;
  reviewCount: number;
  userId: string;
}

export interface NoteHealth {
  retentionRate: number;
  daysSinceLastReview: number;
}

export function createNote(data: { title: string; content: string; tags?: string[] }) {
  return api<NoteItem>('POST', '/api/notes', data);
}

export function listNotes(tag?: string) {
  const qs = tag ? `?tag=${encodeURIComponent(tag)}` : '';
  return api<NoteItem[]>('GET', `/api/notes${qs}`);
}

export function getNoteById(id: string) {
  return api<NoteItem>('GET', `/api/notes/${id}`);
}

export function updateNote(id: string, data: Partial<NoteItem>) {
  return api<NoteItem>('PUT', `/api/notes/${id}`, data);
}

export function deleteNote(id: string) {
  return api<void>('DELETE', `/api/notes/${id}`);
}

export function reviewNote(id: string) {
  return api<NoteItem>('POST', `/api/notes/${id}/review`);
}

export function getDueNotes() {
  return api<NoteItem[]>('GET', '/api/notes/due');
}

export function getNoteHealth(id: string) {
  return api<NoteHealth>('GET', `/api/notes/${id}/health`);
}
