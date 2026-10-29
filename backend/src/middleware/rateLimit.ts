import type { NextFunction, Response } from 'express';
import { AppError } from './errorHandler.js';
import type { AuthRequest } from './auth.js';

/**
 * Limiteur en mémoire par membre (fenêtre fixe). Suffisant pour une instance
 * unique et quelques dizaines d'utilisateurs ; à remplacer par un store partagé
 * si le backend passe en plusieurs instances.
 */
export function rateLimitPerMember(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const key = req.member?.id;
    if (!key) return next();

    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      return next(new AppError(429, 'Trop de messages envoyés, réessaie dans un instant', 'RATE_LIMITED'));
    }
    next();
  };
}
