import { Request, Response } from 'express';
import * as checkinService from '../services/checkin.service';

export async function checkin(req: Request, res: Response) {
  const result = await checkinService.checkinToday(req.userId!);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.status(201).json(result.checkin);
}

export async function makeup(req: Request, res: Response) {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const result = await checkinService.useMakeup(req.userId!, date);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.status(201).json(result.checkin);
}

export async function stats(req: Request, res: Response) {
  const data = await checkinService.getCheckinStats(req.userId!);
  res.json(data);
}

export async function monthData(req: Request, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();
  const data = await checkinService.getMonthData(req.userId!, year, month);
  res.json(data);
}
