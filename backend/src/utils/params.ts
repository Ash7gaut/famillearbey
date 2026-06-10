import { AppError } from '../middleware/errorHandler.js';

export function getParam(value: string | string[]): string {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function requireParam(value: string | string[], name: string): string {
  const param = getParam(value);
  if (!param) throw new AppError(400, `Paramètre manquant : ${name}`, 'MISSING_PARAM');
  return param;
}
