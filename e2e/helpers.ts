import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
export const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? 'http://localhost:8000';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1';

export const ADMIN = { email: 'admin@admin', password: 'admin' };
export const MEMBER = { email: 'e2e-membre@test.local', password: 'E2e-membre-1234!' };
export const MEMBER2 = { email: 'e2e-membre2@test.local', password: 'E2e-membre2-1234!' };

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

export function readUsers(): { admin: UserInfo; member: UserInfo; member2: UserInfo } {
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

// ── Secret Santa ─────────────────────────────────────────────────────

export interface WishlistItemDto {
  id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price: string | null;
  note: string | null;
  picked?: boolean;
}

export function createSecretSantaGroup(token: string, title: string) {
  return apiCall<{ id: string }>(token, 'POST', '/secret-santa', { title });
}

export function deleteSecretSantaGroup(token: string, groupId: string) {
  return apiCall<null>(token, 'DELETE', `/secret-santa/${groupId}`);
}

/** Groupe tiré avec les trois comptes de test (admin créateur, membre, membre2), tous acceptés. */
export async function createDrawnSecretSanta(title: string): Promise<string> {
  const users = readUsers();
  const group = await createSecretSantaGroup(users.admin.token, title);
  for (const guest of [users.member, users.member2]) {
    await apiCall(users.admin.token, 'POST', `/secret-santa/${group.id}/invite-member`, { memberId: guest.memberId });
    await apiCall(guest.token, 'PATCH', `/secret-santa/${group.id}/respond`, { status: 'accepted' });
  }
  await apiCall(users.admin.token, 'POST', `/secret-santa/${group.id}/draw`);
  return group.id;
}

/** Compte famille à qui `giver` doit offrir un cadeau (résolu via my-assignment). */
export async function receiverOfGiver(giver: UserInfo, groupId: string): Promise<UserInfo> {
  const assignment = await apiCall<{
    receiver_display_name: string;
    participants: { member_id: string | null; display_name: string }[];
  }>(giver.token, 'GET', `/secret-santa/${groupId}/my-assignment`);
  const receiverId = assignment.participants.find(
    (p) => p.display_name === assignment.receiver_display_name,
  )?.member_id;
  const user = Object.values(readUsers()).find((u) => u.memberId === receiverId);
  if (!user) throw new Error(`Tiré introuvable parmi les comptes de test (${receiverId})`);
  return user;
}

export function addWishlistItem(token: string, groupId: string, input: { title: string; url?: string; price?: string }) {
  return apiCall<WishlistItemDto>(token, 'POST', `/secret-santa/${groupId}/wishlist`, input);
}

export function listOwnWishlist(token: string, groupId: string) {
  return apiCall<WishlistItemDto[]>(token, 'GET', `/secret-santa/${groupId}/wishlist`);
}

export function listReceiverWishlist(token: string, groupId: string) {
  return apiCall<WishlistItemDto[]>(token, 'GET', `/secret-santa/${groupId}/receiver-wishlist`);
}

export function pickWishlistItem(token: string, groupId: string, itemId: string) {
  return apiCall<null>(token, 'PUT', `/secret-santa/${groupId}/receiver-wishlist/${itemId}/pick`);
}

/**
 * Intercepte l'aperçu Microlink (appelé depuis le navigateur).
 * `null` = service en échec (le front doit proposer la saisie manuelle).
 */
export async function mockLinkPreview(
  page: Page,
  preview: { title: string; imageUrl?: string } | null,
): Promise<void> {
  await page.route('https://api.microlink.io/**', (route) => {
    if (!preview) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"fail"}' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        status: 'success',
        data: { title: preview.title, image: preview.imageUrl ? { url: preview.imageUrl } : undefined },
      }),
    });
  });
}
