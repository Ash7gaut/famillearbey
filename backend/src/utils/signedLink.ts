import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/** Durée de validité d'un lien vCard signé. */
export const VCARD_LINK_TTL_MS = 2 * 60 * 1000;

// Clé dérivée de la clé service-role : pas de nouvelle variable d'environnement.
const signingKey = createHmac('sha256', env.supabaseServiceKey).update('vcard-link').digest();

function computeSignature(memberId: string, exp: number): string {
  return createHmac('sha256', signingKey).update(`vcard:${memberId}:${exp}`).digest('hex');
}

export function signVCardLink(memberId: string, exp: number): string {
  return computeSignature(memberId, exp);
}

export function verifyVCardLink(memberId: string, expRaw: unknown, sigRaw: unknown): boolean {
  if (typeof expRaw !== 'string' || typeof sigRaw !== 'string') return false;
  if (!/^\d{1,15}$/.test(expRaw)) return false;
  const exp = Number(expRaw);
  if (exp < Date.now()) return false;

  const expected = Buffer.from(computeSignature(memberId, exp), 'hex');
  const provided = Buffer.from(sigRaw, 'hex');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}
