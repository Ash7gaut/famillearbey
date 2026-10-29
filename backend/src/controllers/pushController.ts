import { Response } from 'express';
import { pushService } from '../services/pushService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, PushSubscriptionInput } from '../types/index.js';

function currentMemberId(req: AuthRequest): string {
  if (!req.member) throw new AppError(401, 'Connexion requise', 'UNAUTHORIZED');
  return req.member.id;
}

export const pushController = {
  async publicKey(_req: AuthRequest, res: Response<ApiResponse<{ publicKey: string; configured: boolean }>>) {
    res.json({ data: { publicKey: pushService.publicKey(), configured: pushService.isConfigured() } });
  },

  async subscribe(req: AuthRequest, res: Response) {
    await pushService.subscribe(currentMemberId(req), req.body as PushSubscriptionInput);
    res.status(204).send();
  },

  async unsubscribe(req: AuthRequest, res: Response) {
    const { endpoint } = req.body as { endpoint: string };
    await pushService.unsubscribe(currentMemberId(req), endpoint);
    res.status(204).send();
  },
};
