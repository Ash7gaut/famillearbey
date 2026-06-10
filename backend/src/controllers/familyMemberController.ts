import { Request, Response } from 'express';
import { familyMemberService } from '../services/familyMemberService.js';
import { requireParam } from '../utils/params.js';
import type { ApiResponse, FamilyMember } from '../types/index.js';

export const familyMemberController = {
  async getAll(_req: Request, res: Response<ApiResponse<FamilyMember[]>>) {
    const data = await familyMemberService.getAll();
    res.json({ data });
  },

  async getById(req: Request, res: Response<ApiResponse<FamilyMember>>) {
    const data = await familyMemberService.getById(requireParam(req.params.id, 'id'));
    res.json({ data });
  },

  async create(req: Request, res: Response<ApiResponse<FamilyMember>>) {
    const data = await familyMemberService.create(req.body);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response<ApiResponse<FamilyMember>>) {
    const data = await familyMemberService.update(requireParam(req.params.id, 'id'), req.body);
    res.json({ data });
  },
};
