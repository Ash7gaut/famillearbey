import { Request, Response } from 'express';
import { tribuService } from '../services/tribuService.js';
import { requireParam } from '../utils/params.js';
import type { ApiResponse, Tribu } from '../types/index.js';

export const tribuController = {
  async getAll(_req: Request, res: Response<ApiResponse<Tribu[]>>) {
    const data = await tribuService.getAll();
    res.json({ data });
  },

  async create(req: Request, res: Response<ApiResponse<Tribu>>) {
    const data = await tribuService.create(req.body);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response<ApiResponse<Tribu>>) {
    const data = await tribuService.update(requireParam(req.params.id, 'id'), req.body);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await tribuService.delete(requireParam(req.params.id, 'id'));
    res.status(204).send();
  },

  /** PUT /tribus/:id/members/:memberId — ajoute un membre à la tribu. */
  async addMember(req: Request, res: Response) {
    await tribuService.setMemberTribu(
      requireParam(req.params.memberId, 'memberId'),
      requireParam(req.params.id, 'id'),
    );
    res.status(204).send();
  },

  /** DELETE /tribus/:id/members/:memberId — retire un membre de la tribu. */
  async removeMember(req: Request, res: Response) {
    await tribuService.removeMemberFromTribu(
      requireParam(req.params.memberId, 'memberId'),
      requireParam(req.params.id, 'id'),
    );
    res.status(204).send();
  },
};
