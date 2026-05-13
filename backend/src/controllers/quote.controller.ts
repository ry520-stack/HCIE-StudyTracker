import { Request, Response } from 'express';
import * as quoteService from '../services/quote.service';

export async function getDaily(req: Request, res: Response) {
  const quote = await quoteService.getDailyQuote();
  res.json(quote);
}

export async function create(req: Request, res: Response) {
  if (!req.body.content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const quote = await quoteService.createQuote(req.body.content, req.body.author);
  res.status(201).json(quote);
}

export async function remove(req: Request, res: Response) {
  const id = (req.params as Record<string, string>).id;
  const deleted = await quoteService.deleteQuote(id);
  if (!deleted) return res.status(404).json({ error: 'Quote not found' });
  res.status(204).send();
}

export async function list(req: Request, res: Response) {
  const quotes = await quoteService.listQuotes();
  res.json(quotes);
}
