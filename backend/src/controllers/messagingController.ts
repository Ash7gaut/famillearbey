import { Response } from 'express';
import { messagingService } from '../services/messagingService.js';
import { requireParam } from '../utils/params.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, Conversation, ConversationSummary, Message } from '../types/index.js';

function currentMemberId(req: AuthRequest): string {
  if (!req.member) throw new AppError(401, 'Connexion requise', 'UNAUTHORIZED');
  return req.member.id;
}

export const messagingController = {
  async list(req: AuthRequest, res: Response<ApiResponse<ConversationSummary[]>>) {
    const data = await messagingService.listForMember(currentMemberId(req));
    res.json({ data });
  },

  /** POST /conversations — réservé aux admins (cf. requireAdmin sur la route). */
  async create(req: AuthRequest, res: Response<ApiResponse<Conversation>>) {
    const { title, memberIds } = req.body as { title?: string; memberIds?: string[] };
    const data = await messagingService.create(currentMemberId(req), title ?? null, memberIds ?? []);
    res.status(201).json({ data });
  },

  async addMember(req: AuthRequest, res: Response) {
    await messagingService.addMember(
      requireParam(req.params.id, 'id'),
      currentMemberId(req),
      requireParam(req.params.memberId, 'memberId'),
    );
    res.status(204).send();
  },

  async removeMember(req: AuthRequest, res: Response) {
    await messagingService.removeMember(
      requireParam(req.params.id, 'id'),
      currentMemberId(req),
      requireParam(req.params.memberId, 'memberId'),
    );
    res.status(204).send();
  },

  async setMuted(req: AuthRequest, res: Response) {
    const { muted } = req.body as { muted: boolean };
    await messagingService.setMuted(requireParam(req.params.id, 'id'), currentMemberId(req), Boolean(muted));
    res.status(204).send();
  },

  async markRead(req: AuthRequest, res: Response) {
    await messagingService.markRead(requireParam(req.params.id, 'id'), currentMemberId(req));
    res.status(204).send();
  },

  async listMessages(req: AuthRequest, res: Response<ApiResponse<Message[]>>) {
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;
    const limit = Number(req.query.limit);
    const data = await messagingService.listMessages(
      requireParam(req.params.id, 'id'),
      currentMemberId(req),
      before,
      Number.isFinite(limit) && limit > 0 ? limit : undefined,
    );
    res.json({ data });
  },

  async sendMessage(req: AuthRequest, res: Response<ApiResponse<Message>>) {
    const { content } = req.body as { content: string };
    const data = await messagingService.sendMessage(
      requireParam(req.params.id, 'id'),
      currentMemberId(req),
      content ?? '',
    );
    res.status(201).json({ data });
  },
};
