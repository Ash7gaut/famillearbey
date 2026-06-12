import type { GuestInviteInfo } from '../types/secretSanta';

export interface StoredGuestInvite {
  token: string;
  groupTitle: string;
  guestDisplayName: string;
  status: GuestInviteInfo['status'];
  groupStatus: GuestInviteInfo['group_status'];
  budget: string | null;
  savedAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'famillearbey-guest-invites';

function readAll(): StoredGuestInvite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGuestInvite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(invites: StoredGuestInvite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invites));
  } catch {
    // quota / navigation privée
  }
}

export function guestInvitePath(token: string) {
  return `/secret-santa/invite/${token}`;
}

export function guestInviteUrl(token: string) {
  return `${window.location.origin}${guestInvitePath(token)}`;
}

export function saveGuestInvite(
  token: string,
  info: GuestInviteInfo,
): StoredGuestInvite {
  const now = new Date().toISOString();
  const invites = readAll();
  const existing = invites.find((item) => item.token === token);

  const entry: StoredGuestInvite = {
    token,
    groupTitle: info.group_title,
    guestDisplayName: info.guest_display_name,
    status: info.status,
    groupStatus: info.group_status,
    budget: info.budget,
    savedAt: existing?.savedAt ?? now,
    updatedAt: now,
  };

  const next = [entry, ...invites.filter((item) => item.token !== token)].slice(0, 20);
  writeAll(next);
  return entry;
}

export function getGuestInvites(): StoredGuestInvite[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function hasGuestInvites(): boolean {
  return readAll().length > 0;
}

export function removeGuestInvite(token: string) {
  writeAll(readAll().filter((item) => item.token !== token));
}
