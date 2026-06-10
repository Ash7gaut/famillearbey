import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { AppError } from './errorHandler.js';
import type { FamilyMember } from '../types/index.js';

export interface AuthRequest extends Request {
  authUserId?: string;
  authEmail?: string;
  member?: FamilyMember;
}

/** Vérifie le JWT Supabase (optionnel — ne bloque pas si absent) */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return next();

    req.authUserId = data.user.id;
    req.authEmail = data.user.email ?? undefined;

    const { data: member } = await supabase
      .from('family_members')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (member) req.member = member;
  } catch {
    // Token invalide — on continue sans auth
  }

  next();
}

/** Exige un utilisateur connecté avec un profil famille lié */
export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError(401, 'Connexion requise', 'UNAUTHORIZED');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new AppError(401, 'Session invalide', 'UNAUTHORIZED');

    req.authUserId = data.user.id;
    req.authEmail = data.user.email ?? undefined;

    const { data: member } = await supabase
      .from('family_members')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (!member) {
      throw new AppError(403, 'Compte non lié à un membre de la famille', 'NOT_LINKED');
    }

    req.member = member;
    next();
  } catch (err) {
    next(err);
  }
}

/** Exige un admin famille */
export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.member?.is_admin) {
      throw new AppError(403, 'Accès administrateur requis', 'FORBIDDEN');
    }
    next();
  } catch (err) {
    next(err);
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
