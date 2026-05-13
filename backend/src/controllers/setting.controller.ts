import { Request, Response } from 'express';
import * as settingService from '../services/setting.service';

export async function getDashboard(req: Request, res: Response) {
  const data = await settingService.getDashboardSummary(req.userId!);
  res.json(data);
}

export async function getSettings(req: Request, res: Response) {
  const settings = await settingService.getUserSettings(req.userId!);
  res.json(settings);
}

export async function updateSettings(req: Request, res: Response) {
  const settings = await settingService.updateUserSettings(req.userId!, req.body);
  res.json(settings);
}

export async function getAchievements(req: Request, res: Response) {
  const data = await settingService.checkAndUnlock(req.userId!);
  res.json(data);
}

export async function getDailyGoal(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const goal = await settingService.getDailyGoal(req.userId!, date);
  res.json(goal || { targetMinutes: 120 });
}

export async function updateDailyGoal(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const { targetMinutes } = req.body;
  if (!targetMinutes || targetMinutes < 1) return res.status(400).json({ error: 'targetMinutes required' });
  const goal = await settingService.upsertDailyGoal(req.userId!, date, targetMinutes);
  res.json(goal);
}

export async function getDailyJournal(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const journal = await settingService.getDailyJournal(req.userId!, date);
  res.json(journal || { content: '' });
}

export async function updateDailyJournal(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const { content } = req.body;
  const journal = await settingService.upsertDailyJournal(req.userId!, date, content || '');
  res.json(journal);
}
