import { Request, Response } from 'express';
import * as focusService from '../services/focus.service';

function paramId(req: Request): string {
  return (req.params as Record<string, string>).id;
}

export async function create(req: Request, res: Response) {
  const session = await focusService.createSession({
    duration: req.body.duration,
    userId: req.userId!,
  });
  res.status(201).json(session);
}

export async function list(req: Request, res: Response) {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const sessions = await focusService.listSessions(req.userId!, limit, offset);
  res.json(sessions);
}

export async function getById(req: Request, res: Response) {
  const session = await focusService.getSessionById(paramId(req), req.userId!);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
}

export async function update(req: Request, res: Response) {
  const session = await focusService.updateSession(paramId(req), req.userId!, req.body);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
}

export async function remove(req: Request, res: Response) {
  const deleted = await focusService.deleteSession(paramId(req), req.userId!);
  if (!deleted) return res.status(404).json({ error: 'Session not found' });
  res.status(204).send();
}

export async function todayStats(req: Request, res: Response) {
  const stats = await focusService.getTodayStats(req.userId!);
  res.json(stats);
}
