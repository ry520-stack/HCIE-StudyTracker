import { Request, Response } from 'express';
import * as taskService from '../services/task.service';

function paramId(req: Request): string {
  return (req.params as Record<string, string>).id;
}

export async function create(req: Request, res: Response) {
  if (!req.body.title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const task = await taskService.createTask({ ...req.body, userId: req.userId! });
  res.status(201).json(task);
}

export async function list(req: Request, res: Response) {
  const filters: { type?: string; completed?: boolean } = {};
  if (req.query.type) filters.type = req.query.type as string;
  if (req.query.completed !== undefined) {
    filters.completed = req.query.completed === 'true';
  }

  const tasks = await taskService.listTasks(req.userId!, filters);
  res.json(tasks);
}

export async function getById(req: Request, res: Response) {
  const task = await taskService.getTaskById(paramId(req), req.userId!);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

export async function update(req: Request, res: Response) {
  const task = await taskService.updateTask(paramId(req), req.userId!, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

export async function remove(req: Request, res: Response) {
  const deleted = await taskService.deleteTask(paramId(req), req.userId!);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
}

export async function toggle(req: Request, res: Response) {
  const task = await taskService.toggleTask(paramId(req), req.userId!);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

export async function stats(req: Request, res: Response) {
  const s = await taskService.getTaskStats(req.userId!);
  res.json(s);
}
