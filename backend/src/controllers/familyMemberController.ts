import { Request, Response } from 'express';
import { familyMemberService } from '../services/familyMemberService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { requireParam } from '../utils/params.js';
import { verifyVCardLink } from '../utils/signedLink.js';
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

  async getProfile(req: Request, res: Response<ApiResponse<MemberProfile>>) {
    const data = await familyMemberService.getProfile(requireParam(req.params.id, 'id'));
    res.json({ data });
  },

  async createVCardLink(req: Request, res: Response<ApiResponse<{ url: string }>>) {
    const data = await familyMemberService.createVCardLink(requireParam(req.params.id, 'id'));
    res.json({ data });
  },

  /** Route publique : l'accès est protégé par la signature du lien (exp + sig). */
  async getVCard(req: Request, res: Response) {
    const id = requireParam(req.params.id, 'id');
    if (!verifyVCardLink(id, req.query.exp, req.query.sig)) {
      throw new AppError(403, 'Lien invalide ou expiré', 'FORBIDDEN');
    }
    const { content, fileName } = await familyMemberService.getVCard(id);
    const asciiName = fileName.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ._-]/g, '_');
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(content);
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
