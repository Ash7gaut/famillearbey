import { test, expect } from '@playwright/test';
import { API_URL, STORAGE_FILE, apiCall, readUsers } from './helpers';

test.describe('Mon profil : numéro de téléphone', () => {
  test.use({ storageState: STORAGE_FILE.member });

  test.beforeEach(async ({ page }) => {
    await page.goto('/profil');
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });

  test('1. un numéro valide est enregistré et affiché sur le profil', async ({ page }) => {
    await page.getByTestId('profile-edit-button').click();
    await page.getByTestId('profile-phone-input').fill('06 12 34 56 78');
    await page.getByTestId('profile-save-button').click();
    await expect(page.getByTestId('profile-feedback')).toHaveText('Profil mis à jour.');
    await expect(page.getByTestId('profile-phone')).toContainText('+33 6 12 34 56 78');
    await expect(page.getByTestId('profile-phone-link')).toHaveAttribute('href', 'tel:+33612345678');
  });

  test('2. un format invalide est refusé et reste en édition', async ({ page }) => {
    await page.getByTestId('profile-edit-button').click();
    await page.getByTestId('profile-phone-input').fill('abc');
    await expect(page.getByTestId('profile-phone-input')).toHaveValue('');
    await page.getByTestId('profile-phone-input').fill('812345678');
    await page.getByTestId('profile-save-button').click();
    await expect(page.getByTestId('profile-feedback')).toContainText('Numéro de téléphone invalide');
    await expect(page.getByTestId('profile-phone-input')).toBeVisible();
  });

  test('3. la saisie est formatée par paires et accepte +33 / 0 initial', async ({ page }) => {
    await page.getByTestId('profile-edit-button').click();
    await expect(page.getByTestId('profile-phone-input-prefix')).toContainText('+33');
    await page.getByTestId('profile-phone-input').fill('+33 6 12 34 56 78');
    await expect(page.getByTestId('profile-phone-input')).toHaveValue('6 12 34 56 78');
    await page.getByTestId('profile-phone-input').fill('0612345678');
    await expect(page.getByTestId('profile-phone-input')).toHaveValue('6 12 34 56 78');
    await expect(page.getByTestId('profile-phone-input-valid')).toBeVisible();
  });
});

test.describe('Profil d\'un membre : ajouter aux contacts', () => {
  test.use({ storageState: STORAGE_FILE.member });

  test('5. le bouton est absent sur mon profil et sur ma fiche /profil/:id', async ({ page }) => {
    const { member } = readUsers();
    await page.goto('/profil');
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByTestId('profile-add-contact-button')).toHaveCount(0);
    await page.goto(`/profil/${member.memberId}`);
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByTestId('profile-add-contact-button')).toHaveCount(0);
  });

  test('6. un clic télécharge la vCard du membre via un lien signé', async ({ page }) => {
    const { admin } = readUsers();
    await page.goto(`/profil/${admin.memberId}`);
    await expect(page.getByTestId('profile-page')).toBeVisible();
    const [vcard] = await Promise.all([
      page.waitForResponse((r) => /\/members\/[^/]+\/vcard\?/.test(r.url())),
      page.getByTestId('profile-add-contact-button').click(),
    ]);
    expect(vcard.status()).toBe(200);
    expect(vcard.headers()['content-type']).toContain('text/vcard');
    expect(vcard.headers()['cache-control']).toBe('no-store');
    // Téléchargement : le corps n'est pas lisible via Playwright, on relit le lien signé.
    const body = await (await fetch(vcard.url())).text();
    expect(body).toContain('BEGIN:VCARD');
    expect(body).toContain('FN:');
  });

  test('7. la vCard contient TEL quand le membre a un numéro', async ({ page }) => {
    const { admin } = readUsers();
    const previous = await apiCall<{ phone: string | null }>(admin.token, 'GET', `/members/${admin.memberId}`);
    await apiCall(admin.token, 'PATCH', `/members/${admin.memberId}`, { phone: '+33612345678' });
    try {
      await page.goto(`/profil/${admin.memberId}`);
      await expect(page.getByTestId('profile-page')).toBeVisible();
      const [vcard] = await Promise.all([
        page.waitForResponse((r) => /\/members\/[^/]+\/vcard\?/.test(r.url())),
        page.getByTestId('profile-add-contact-button').click(),
      ]);
      expect(await (await fetch(vcard.url())).text()).toContain('TEL;TYPE=CELL:+33612345678');
    } finally {
      await apiCall(admin.token, 'PATCH', `/members/${admin.memberId}`, { phone: previous.phone ?? null });
    }
  });
});

test.describe('API vCard : liens signés', () => {
  async function getVCardLink(): Promise<URL> {
    const { admin, member } = readUsers();
    const { url } = await apiCall<{ url: string }>(member.token, 'POST', `/members/${admin.memberId}/vcard-link`);
    return new URL(`${API_URL}${url}`);
  }

  test('8. un sig altéré est refusé (403)', async () => {
    const url = await getVCardLink();
    const sig = url.searchParams.get('sig') ?? '';
    url.searchParams.set('sig', sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0'));
    expect((await fetch(url)).status).toBe(403);
  });

  test('9. un exp dépassé (lien expiré) est refusé (403)', async () => {
    const url = await getVCardLink();
    url.searchParams.set('exp', String(Date.now() - 60_000));
    expect((await fetch(url)).status).toBe(403);
  });

  test('10. sans paramètres exp/sig, la vCard est refusée (403)', async () => {
    const { admin } = readUsers();
    expect((await fetch(`${API_URL}/members/${admin.memberId}/vcard`)).status).toBe(403);
  });

  test('11. POST vcard-link sans token renvoie 401', async () => {
    const { admin } = readUsers();
    const res = await fetch(`${API_URL}/members/${admin.memberId}/vcard-link`, { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
