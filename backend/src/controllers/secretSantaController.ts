import { Response } from 'express';
import { secretSantaService } from '../services/secretSantaService.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type {
  GuestInviteInfo,
  InviteEmailResult,
  InviteMemberResult,
  SecretSantaAssignment,
  SecretSantaGroupDetail,
  SecretSantaGroupSummary,
  SecretSantaParticipantView,
} from '../types/secretSanta.js';

export const secretSantaController = {
  async create(req: AuthRequest, res: Response<ApiResponse<SecretSantaGroupDetail>>) {
    const data = await secretSantaService.createGroup(req.member!, req.body);
    res.status(201).json({ data });
  },

  async list(req: AuthRequest, res: Response<ApiResponse<SecretSantaGroupSummary[]>>) {
    const data = await secretSantaService.listMyGroups(req.member!);
    res.json({ data });
  },

  async getById(req: AuthRequest, res: Response<ApiResponse<SecretSantaGroupDetail>>) {
    const data = await secretSantaService.getGroupDetail(
      requireParam(req.params.id, 'id'),
      req.member!,
    );
    res.json({ data });
  },

  async inviteMember(req: AuthRequest, res: Response<ApiResponse<InviteMemberResult>>) {
    const data = await secretSantaService.inviteMember(
      requireParam(req.params.id, 'id'),
      req.member!,
      req.body.memberId,
    );
    res.status(201).json({ data });
  },

  async inviteEmail(req: AuthRequest, res: Response<ApiResponse<InviteEmailResult>>) {
    const data = await secretSantaService.inviteEmail(
      requireParam(req.params.id, 'id'),
      req.member!,
      req.body,
    );
    res.status(201).json({ data });
  },

  async respond(req: AuthRequest, res: Response<ApiResponse<SecretSantaParticipantView>>) {
    const data = await secretSantaService.respond(
      requireParam(req.params.id, 'id'),
      req.member!,
      req.body.status,
    );
    res.json({ data });
  },

  async draw(req: AuthRequest, res: Response<ApiResponse<SecretSantaGroupDetail>>) {
    const data = await secretSantaService.draw(requireParam(req.params.id, 'id'), req.member!);
    res.json({ data });
  },

  async myAssignment(req: AuthRequest, res: Response<ApiResponse<SecretSantaAssignment>>) {
    const data = await secretSantaService.getMyAssignment(
      requireParam(req.params.id, 'id'),
      req.member!,
    );
    res.json({ data });
  },

  async confirmReveal(req: AuthRequest, res: Response<ApiResponse<SecretSantaAssignment>>) {
    const data = await secretSantaService.confirmReveal(
      requireParam(req.params.id, 'id'),
      req.member!,
    );
    res.json({ data });
  },

  async inviteLink(req: AuthRequest, res: Response<ApiResponse<{ invite_link: string }>>) {
    const data = await secretSantaService.getInviteLinkForParticipant(
      requireParam(req.params.id, 'id'),
      req.member!,
      requireParam(req.params.participantId, 'participantId'),
    );
    res.json({ data });
  },

  async getGuestInvite(req: AuthRequest, res: Response<ApiResponse<GuestInviteInfo>>) {
    const data = await secretSantaService.getGuestInvite(requireParam(req.params.token, 'token'));
    res.json({ data });
  },

  async guestAccept(req: AuthRequest, res: Response<ApiResponse<GuestInviteInfo>>) {
    const data = await secretSantaService.guestAccept(requireParam(req.params.token, 'token'));
    res.json({ data });
  },

  async guestDecline(req: AuthRequest, res: Response<ApiResponse<GuestInviteInfo>>) {
    const data = await secretSantaService.guestDecline(requireParam(req.params.token, 'token'));
    res.json({ data });
  },

  async guestAssignment(req: AuthRequest, res: Response<ApiResponse<SecretSantaAssignment>>) {
    const data = await secretSantaService.getGuestAssignment(
      requireParam(req.params.token, 'token'),
    );
    res.json({ data });
  },

  async confirmGuestReveal(req: AuthRequest, res: Response<ApiResponse<SecretSantaAssignment>>) {
    const data = await secretSantaService.confirmGuestReveal(
      requireParam(req.params.token, 'token'),
    );
    res.json({ data });
  },

  async removeParticipant(req: AuthRequest, res: Response<ApiResponse<SecretSantaGroupDetail>>) {
    const data = await secretSantaService.removeParticipant(
      requireParam(req.params.id, 'id'),
      req.member!,
      requireParam(req.params.participantId, 'participantId'),
    );
    res.json({ data });
  },

  async deleteGroup(req: AuthRequest, res: Response) {
    await secretSantaService.deleteGroup(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },
};
