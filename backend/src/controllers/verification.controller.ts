import { Request, Response } from 'express';
import * as verificationService from '../services/verification.service';

export async function sendCode(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: '邮箱为必填' });
  }

  const result = await verificationService.sendCode(email);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ message: result.message });
}
