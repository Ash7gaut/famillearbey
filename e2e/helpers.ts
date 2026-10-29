import fs from 'node:fs';
import path from 'node:path';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
export const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? 'http://localhost:8000';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1';

export const ADMIN = { email: 'admin@admin', password: 'admin' };
export const MEMBER = { email: 'e2e-membre@test.local', password: 'E2e-membre-1234!' };

export const AUTH_DIR = path.join(__dirname, '.auth');
export const USERS_FILE = path.join(AUTH_DIR, 'users.json');
export const STORAGE_FILE = {
  admin: path.join(AUTH_DIR, 'admin.json'),
  member: path.join(AUTH_DIR, 'member.json'),
};

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: { id: string; email: string };
}

export interface UserInfo {
  authId: string;
  memberId: string;
  token: string;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name} (passer --env-file .env)`);
  return v;
}

const anonKey = () => env('ANON_KEY');
const serviceKey = () => env('SERVICE_ROLE_KEY');

async function check(res: Response, what: string): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) throw new Error(`${what} -> HTTP ${res.status} : ${text}`);
  return text ? JSON.parse(text) : null;
}

/** Crée le compte auth (ignore 422 = déjà existant). */
export async function ensureAuthUser(email: string, password: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (res.status !== 422) await check(res, `create auth user ${email}`);
}

export async function passwordLogin(email: string, password: string): Promise<Session> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await check(res, `login ${email}`)) as Session;
}

/** Renvoie l'id family_members lié à un auth user, ou le crée si absent. */
export async function ensureFamilyMember(authId: string, first: string, last: string, isAdmin: boolean): Promise<string> {
  const headers = { apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}` };
  const found = (await check(
    await fetch(`${SUPABASE_URL}/rest/v1/family_members?auth_user_id=eq.${authId}&select=id`, { headers }),
    'select family_members',
  )) as { id: string }[];
  if (found.length > 0) return found[0].id;

  const created = (await check(
    await fetch(`${SUPABASE_URL}/rest/v1/family_members`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ auth_user_id: authId, first_name: first, last_name: last, is_admin: isAdmin }),
    }),
    'insert family_members',
  )) as { id: string }[];
  return created[0].id;
}

/** Fichier de session compatible supabase-js (clé localStorage sb-<host>-auth-token). */
export function toStorageState(session: Session): object {
  const host = new URL(SUPABASE_URL).hostname.split('.')[0];
  return {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [{ name: `sb-${host}-auth-token`, value: JSON.stringify(session) }],
      },
    ],
  };
}

export function readUsers(): { admin: UserInfo; member: UserInfo } {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

export async function apiCall<T>(token: string, method: string, route: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${route}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await check(res, `${method} ${route}`)) as { data?: T } | null;
  return (json?.data ?? json) as T;
}

export function createConversation(token: string, title: string, memberIds: string[]) {
  return apiCall<{ id: string; title: string | null }>(token, 'POST', '/conversations', { title, memberIds });
}

export function sendMessageApi(token: string, conversationId: string, content: string) {
  return apiCall<{ id: string }>(token, 'POST', `/conversations/${conversationId}/messages`, { content });
}
