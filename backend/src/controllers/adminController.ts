import { Response } from 'express';
import { authService } from '../services/authService.js';
import { familyMemberService } from '../services/familyMemberService.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type { FamilyMember } from '../types/index.js';
import type { AccessRequest } from '../types/auth.js';

export const adminController = {
  async invite(req: AuthRequest, res: Response<ApiResponse<{ message: string }>>) {
    const { memberId, email } = req.body;
    if (!memberId || !email) {
      throw new AppError(400, 'memberId et email requis', 'MISSING_FIELDS');
    }

    const result = await authService.inviteMember(memberId, email);
    res.json({ data: result });
  },

  async listUnlinked(_req: AuthRequest, res: Response<ApiResponse<FamilyMember[]>>) {
    const all = await familyMemberService.getAll();
    const unlinked = all.filter((m) => !m.auth_user_id);
    res.json({ data: unlinked });
  },

  async listRequests(_req: AuthRequest, res: Response<ApiResponse<AccessRequest[]>>) {
    const data = await authService.listAccessRequests();
    res.json({ data });
  },

  async approveRequest(req: AuthRequest, res: Response<ApiResponse<{ message: string }>>) {
    const requestId = requireParam(req.params.id, 'id');
    const { memberId } = req.body;

    if (!memberId) throw new AppError(400, 'memberId requis', 'MISSING_FIELDS');

    const result = await authService.approveAccessRequest(
      requestId,
      memberId,
      req.member!.id,
    );

    res.json({ data: result });
  },

  async rejectRequest(req: AuthRequest, res: Response) {
    const requestId = requireParam(req.params.id, 'id');
    await authService.rejectAccessRequest(requestId, req.member!.id);
    res.status(204).send();
  },
};
