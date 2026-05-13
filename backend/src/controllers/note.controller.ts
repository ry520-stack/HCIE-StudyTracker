import { Request, Response } from 'express';
import * as noteService from '../services/note.service';

function paramId(req: Request): string {
  return (req.params as Record<string, string>).id;
}

export async function create(req: Request, res: Response) {
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const note = await noteService.createNote({ title, content, tags, userId: req.userId! });
  res.status(201).json(note);
}

export async function list(req: Request, res: Response) {
  const tag = req.query.tag as string | undefined;
  const notes = await noteService.listNotes(req.userId!, tag);
  res.json(notes);
}

export async function getById(req: Request, res: Response) {
  const note = await noteService.getNoteById(paramId(req), req.userId!);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
}

export async function update(req: Request, res: Response) {
  const note = await noteService.updateNote(paramId(req), req.userId!, req.body);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
}

export async function remove(req: Request, res: Response) {
  const deleted = await noteService.deleteNote(paramId(req), req.userId!);
  if (!deleted) return res.status(404).json({ error: 'Note not found' });
  res.status(204).send();
}

export async function review(req: Request, res: Response) {
  const note = await noteService.reviewNote(paramId(req), req.userId!);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
}

export async function getDue(req: Request, res: Response) {
  const notes = await noteService.getDueNotes(req.userId!);
  res.json(notes);
}

export async function getHealth(req: Request, res: Response) {
  const health = await noteService.getNoteHealth(paramId(req), req.userId!);
  if (!health) return res.status(404).json({ error: 'Note not found' });
  res.json(health);
}
