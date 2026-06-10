import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authService } from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type { FamilyMember } from '../types/index.js';

export const authController = {
  /** Appelé après login frontend — lie le compte au profil famille */
  async sync(req: AuthRequest, res: Response<ApiResponse<FamilyMember>>) {
    const token = req.headers.authorization?.slice(7);
    if (!token) throw new AppError(401, 'Token requis', 'UNAUTHORIZED');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) throw new AppError(401, 'Session invalide', 'UNAUTHORIZED');

    const member = await authService.syncMember(
      data.user.id,
      data.user.email,
      data.user.user_metadata,
    );

    res.json({ data: member });
  },

  async me(req: AuthRequest, res: Response<ApiResponse<FamilyMember | null>>) {
    const token = req.headers.authorization?.slice(7);
    if (!token) throw new AppError(401, 'Token requis', 'UNAUTHORIZED');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new AppError(401, 'Session invalide', 'UNAUTHORIZED');

    const member = await authService.getMe(data.user.id);
    res.json({ data: member });
  },
};
