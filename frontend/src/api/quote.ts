import { api } from './client';

export interface QuoteItem {
  id: string;
  content: string;
  author: string | null;
  isDefault: boolean;
}

export function getDailyQuote() {
  return api<QuoteItem>('GET', '/api/quote');
}

export function listQuotes() {
  return api<QuoteItem[]>('GET', '/api/quote/list');
}

export function createQuote(content: string, author?: string) {
  return api<QuoteItem>('POST', '/api/quote', { content, author });
}

export function deleteQuote(id: string) {
  return api<void>('DELETE', `/api/quote/${id}`);
}
