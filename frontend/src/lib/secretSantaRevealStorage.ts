const PREFIX = 'famillearbey-ss-revealed:';

export function isRevealStored(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
}

export function storeReveal(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, '1');
  } catch {
    // quota / mode privé
  }
}

export function revealStorageKey(groupId: string): string {
  return `group:${groupId}`;
}

export function guestRevealStorageKey(token: string): string {
  return `guest:${token}`;
}
