import { Request, Response } from 'express';
import { familyMemberService } from '../services/familyMemberService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { requireParam } from '../utils/params.js';
import type { ApiResponse, FamilyMember, MemberProfile, UpdateOwnProfileInput } from '../types/index.js';

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

  async remove(req: Request, res: Response) {
    await familyMemberService.delete(requireParam(req.params.id, 'id'));
    res.status(204).send();
  },

  async getDirectory(_req: Request, res: Response<ApiResponse<MemberProfile[]>>) {
    const data = await familyMemberService.listDirectory();
    res.json({ data });
  },

  async getProfile(req: Request, res: Response<ApiResponse<MemberProfile>>) {
    const data = await familyMemberService.getProfile(requireParam(req.params.id, 'id'));
    res.json({ data });
  },

  async updateMe(req: AuthRequest, res: Response<ApiResponse<FamilyMember>>) {
    const input = req.body as UpdateOwnProfileInput;
    const data = await familyMemberService.updateOwnProfile(req.member!.id, input);
    res.json({ data });
  },

  async uploadMyPhoto(req: AuthRequest, res: Response<ApiResponse<FamilyMember>>) {
    if (!req.file) throw new AppError(400, 'Image requise', 'VALIDATION_ERROR');
    const data = await familyMemberService.uploadProfilePhoto(req.member!.id, req.file);
    res.json({ data });
  },
};
