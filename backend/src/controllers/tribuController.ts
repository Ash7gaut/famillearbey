import { Response } from 'express';
import { tribuService } from '../services/tribuService.js';
import { requireParam } from '../utils/params.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type { TribuWithMembers } from '../types/tribu.js';

export const tribuController = {
  async listAll(_req: AuthRequest, res: Response<ApiResponse<TribuWithMembers[]>>) {
    const data = await tribuService.getAll();
    res.json({ data });
  },

  async getMine(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers | null>>) {
    const data = await tribuService.getMine(req.member!);
    res.json({ data });
  },

  async getById(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers>>) {
    const data = await tribuService.getById(requireParam(req.params.id, 'id'), req.member);
    res.json({ data });
  },

  async create(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers>>) {
    const { label } = req.body;
    const data = await tribuService.create({ label }, req.member!);
    res.status(201).json({ data });
  },

  async update(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers>>) {
    const { label } = req.body;
    const data = await tribuService.update(requireParam(req.params.id, 'id'), { label }, req.member!);
    res.json({ data });
  },

  async deleteTribu(req: AuthRequest, res: Response) {
    await tribuService.delete(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },

  async addMember(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers>>) {
    const { memberId } = req.body;
    if (!memberId) throw new AppError(400, 'memberId requis', 'MISSING_FIELDS');

    const data = await tribuService.addMember(requireParam(req.params.id, 'id'), memberId, req.member!);
    res.json({ data });
  },

  async removeMember(req: AuthRequest, res: Response<ApiResponse<TribuWithMembers>>) {
    const data = await tribuService.removeMember(
      requireParam(req.params.id, 'id'),
      requireParam(req.params.memberId, 'memberId'),
      req.member!,
    );
    res.json({ data });
  },
};
