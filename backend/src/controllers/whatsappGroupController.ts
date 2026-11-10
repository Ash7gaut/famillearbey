import { Response } from 'express';
import { whatsappGroupService, type Actor, type GroupInput } from '../services/whatsappGroupService.js';
import { requireParam } from '../utils/params.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, WhatsAppGroup } from '../types/index.js';

function actor(req: AuthRequest): Actor {
  if (!req.member) throw new AppError(401, 'Connexion requise', 'UNAUTHORIZED');
  return { id: req.member.id, is_admin: req.member.is_admin };
}

export const whatsappGroupController = {
  async list(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup[]>>) {
    res.json({ data: await whatsappGroupService.list(actor(req)) });
  },

  async create(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    const { memberIds, ...input } = (req.body ?? {}) as GroupInput & { memberIds?: unknown };
    res.status(201).json({ data: await whatsappGroupService.create(actor(req), input, memberIds) });
  },

  async update(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    const input = (req.body ?? {}) as GroupInput;
    res.json({ data: await whatsappGroupService.update(requireParam(req.params.id, 'id'), actor(req), input) });
  },

  async uploadImage(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    if (!req.file) throw new AppError(400, 'Image requise', 'VALIDATION_ERROR');
    res.json({ data: await whatsappGroupService.uploadImage(requireParam(req.params.id, 'id'), actor(req), req.file) });
  },

  async addAccess(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    const { memberIds } = (req.body ?? {}) as { memberIds?: unknown };
    res.json({ data: await whatsappGroupService.addAccess(requireParam(req.params.id, 'id'), actor(req), memberIds) });
  },

  async removeAccess(req: AuthRequest, res: Response) {
    await whatsappGroupService.removeAccess(
      requireParam(req.params.id, 'id'),
      actor(req),
      requireParam(req.params.memberId, 'memberId'),
    );
    res.status(204).send();
  },

  async setJoined(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    const { joined } = (req.body ?? {}) as { joined?: unknown };
    if (typeof joined !== 'boolean') throw new AppError(400, 'Valeur invalide', 'VALIDATION_ERROR');
    res.json({ data: await whatsappGroupService.setJoined(requireParam(req.params.id, 'id'), actor(req), joined) });
  },

  async reportLink(req: AuthRequest, res: Response<ApiResponse<WhatsAppGroup>>) {
    res.json({ data: await whatsappGroupService.reportLink(requireParam(req.params.id, 'id'), actor(req)) });
  },

  async remove(req: AuthRequest, res: Response) {
    await whatsappGroupService.remove(requireParam(req.params.id, 'id'), actor(req));
    res.status(204).send();
  },
};
