import { test, expect } from '@playwright/test';
import { API_URL, STORAGE_FILE, createConversation, readUsers } from './helpers';

const users = readUsers();
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Renvoie seulement le statut HTTP (apiCall lève sur les erreurs). */
async function httpStatus(token: string, method: string, route: string, body?: unknown): Promise<number> {
  const res = await fetch(`${API_URL}${route}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}

test.describe('Messagerie (UI, durcissement)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('a. rechargement direct de /messagerie reste sur /messagerie', async ({ page }) => {
    await page.goto('/messagerie');
    await expect(page.getByTestId('messaging-new-group-button')).toBeVisible();
    await expect(page).toHaveURL(/\/messagerie$/);
  });
});

test.describe('Messagerie (API, durcissement)', () => {
  test('d. un non-membre reçoit 403 sur GET et POST des messages', async () => {
    const conv = await createConversation(users.admin.token, `E2E privé ${stamp()}`, []);
    expect(await httpStatus(users.member.token, 'GET', `/conversations/${conv.id}/messages`)).toBe(403);
    expect(
      await httpStatus(users.member.token, 'POST', `/conversations/${conv.id}/messages`, { content: 'intrus' }),
    ).toBe(403);
  });

  test('f. un membre peut renommer, un non-membre reçoit 403 ; aucun retrait possible', async () => {
    const conv = await createConversation(users.admin.token, `E2E conf ${stamp()}`, [users.member.memberId]);
    expect(await httpStatus(users.member.token, 'PATCH', `/conversations/${conv.id}`, { title: 'Nouveau nom' })).toBe(200);
    expect(await httpStatus(users.admin.token, 'PATCH', `/conversations/${conv.id}`, { title: 'x'.repeat(101) })).toBe(400);

    const priv = await createConversation(users.admin.token, `E2E privé ${stamp()}`, []);
    expect(await httpStatus(users.member.token, 'PATCH', `/conversations/${priv.id}`, { title: 'intrus' })).toBe(403);
    expect(await httpStatus(users.member.token, 'PUT', `/conversations/${priv.id}/members/${users.member.memberId}`)).toBe(403);

    // Plus de route de retrait, même pour soi-même.
    expect(await httpStatus(users.member.token, 'DELETE', `/conversations/${conv.id}/members/${users.member.memberId}`)).toBeGreaterThanOrEqual(400);
    const list = await fetch(`${API_URL}/conversations`, { headers: { Authorization: `Bearer ${users.member.token}` } });
    const { data } = (await list.json()) as { data: { id: string }[] };
    expect(data.some((c) => c.id === conv.id)).toBe(true);
  });

  test('e. un message de plus de 4000 caractères est refusé (400)', async () => {
    const conv = await createConversation(users.admin.token, `E2E taille ${stamp()}`, [users.member.memberId]);
    expect(
      await httpStatus(users.admin.token, 'POST', `/conversations/${conv.id}/messages`, { content: 'x'.repeat(4001) }),
    ).toBe(400);
  });
});
