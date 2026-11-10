import { test, expect, type Page } from '@playwright/test';
import {
  STORAGE_FILE,
  apiCall,
  apiRaw,
  createTribu,
  createWhatsappGroup,
  fakeInviteLink,
  listWhatsappGroups,
  readUsers,
  type WhatsAppGroupDto,
} from './helpers';

const users = readUsers();
const stamp = () => `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

async function openGroups(page: Page) {
  await page.goto('/groupes');
  await expect(page.getByTestId('groups-page')).toBeVisible();
}

async function findByName(token: string, name: string): Promise<WhatsAppGroupDto> {
  const group = (await listWhatsappGroups(token)).find((g) => g.name === name);
  if (!group) throw new Error(`Groupe introuvable : ${name}`);
  return group;
}

async function fillBasics(page: Page, name: string, link: string) {
  await page.getByTestId('groups-add-button').click();
  await expect(page.getByTestId('group-form-modal')).toBeVisible();
  await page.getByTestId('group-form-name-input').fill(name);
  await page.getByTestId('group-form-link-input').fill(link);
}

test.describe('Groupes WhatsApp : création et formulaire (admin)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('1. création : la carte apparaît avec le bouton Rejoindre vers le lien', async ({ page }) => {
    const name = `E2E Groupe ${stamp()}`;
    const link = fakeInviteLink(`create${stamp()}`);
    await openGroups(page);
    await fillBasics(page, name, link);
    await page.getByTestId('group-form-description-input').fill('Un groupe de test');
    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();

    const group = await findByName(users.admin.token, name);
    const card = page.getByTestId(`group-card-${group.id}`);
    await expect(card).toBeVisible();
    await expect(card.getByTestId(`group-name-${group.id}`)).toHaveText(name);
    await expect(card.getByTestId(`group-member-count-${group.id}`)).toContainText('Personne');
    const join = card.getByTestId(`group-join-button-${group.id}`);
    await expect(join).toHaveAttribute('href', link);
    await expect(join).toHaveAttribute('target', '_blank');
  });

  test("2. un lien d'invitation qui ne commence pas par https://chat.whatsapp.com/ est refusé", async ({ page }) => {
    await openGroups(page);
    await fillBasics(page, `E2E Lien ${stamp()}`, 'https://exemple.com/abc');
    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-link-error')).toBeVisible();
    await expect(page.getByTestId('group-form-modal')).toBeVisible();

    // Même contrôle côté backend.
    const res = await apiRaw(users.admin.token, 'POST', '/whatsapp-groups', { name: 'X', invite_link: 'https://exemple.com/abc' });
    expect(res.status).toBe(400);
  });

  test('3. le tuto « Besoin d\'aide ? » s\'ouvre (iPhone et Android, sans onglets) avec la section lien compromis', async ({ page }) => {
    await openGroups(page);
    await page.getByTestId('groups-add-button').click();
    await page.getByTestId('group-form-help-button').click();
    const help = page.getByTestId('group-help-modal');
    await expect(help).toBeVisible();
    await expect(page.getByTestId('group-help-illustration')).toBeVisible();

    await expect(page.getByTestId('group-help-title')).toBeVisible();
    await expect(page.getByTestId('group-help-steps')).toContainText('Copier le lien');
    await expect(page.getByTestId('group-help-steps')).toContainText('Inviter via un lien ou un code QR');
    await expect(page.locator('[data-testid^="group-help-tab-"]')).toHaveCount(0);
    await expect(page.getByTestId('group-help-step-4')).toContainText('colle le lien');
    await expect(page.getByTestId('group-help-reset-section')).toContainText('Réinitialiser le lien');

    await page.getByTestId('group-help-close-button').click();
    await expect(help).toBeHidden();
    // Le formulaire reste ouvert derrière le tuto.
    await expect(page.getByTestId('group-form-modal')).toBeVisible();
  });
});

test.describe('Groupes WhatsApp : accès limité (admin crée)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('4. accès limité par personne : seule la personne ajoutée voit le groupe', async ({ page }) => {
    const name = `E2E Perso ${stamp()}`;
    const link = fakeInviteLink(`perso${stamp()}`);
    await openGroups(page);
    await fillBasics(page, name, link);
    await page.getByTestId('group-access-mode-limited').click();
    await expect(page.getByTestId('group-access-summary')).toHaveText('1 personne a accès');

    await page.getByTestId('group-access-search-input').fill('E2E Membre');
    await page.getByTestId(`group-access-member-option-${users.member.memberId}`).click();
    await expect(page.getByTestId(`group-access-chip-${users.member.memberId}`)).toBeVisible();
    await expect(page.getByTestId('group-access-summary')).toHaveText('2 personnes ont accès');
    // Une personne ajoutée disparaît de la liste (pas de doublon).
    await expect(page.getByTestId(`group-access-member-option-${users.member.memberId}`)).toHaveCount(0);

    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();
    const card = page.locator('[data-testid^="group-card-"]', { hasText: name });
    await expect(card.getByTestId(/^group-restricted-badge-/)).toBeVisible();

    const mine = await findByName(users.member.token, name);
    expect(mine.invite_link).toBe(link);
    expect((await listWhatsappGroups(users.member2.token)).some((g) => g.name === name)).toBe(false);
  });

  test('5. accès limité par tribu : un tap ajoute tous les membres de la tribu', async ({ page }) => {
    const tribuName = `Tribu E2E ${stamp()}`;
    const tribuId = await createTribu(users.admin.token, tribuName, [users.member.memberId, users.member2.memberId]);
    const name = `E2E Tribu ${stamp()}`;

    await openGroups(page);
    await fillBasics(page, name, fakeInviteLink(`tribu${stamp()}`));
    await page.getByTestId('group-access-mode-limited').click();

    const option = page.getByTestId(`group-access-tribe-option-${tribuId}`);
    await expect(page.getByTestId(`group-access-tribe-count-${tribuId}`)).toHaveText('+2');
    await option.click();
    await expect(page.getByTestId(`group-access-chip-${users.member.memberId}`)).toBeVisible();
    await expect(page.getByTestId(`group-access-chip-${users.member2.memberId}`)).toBeVisible();
    await expect(page.getByTestId('group-access-summary')).toHaveText('3 personnes ont accès');
    await expect(option).toBeDisabled();

    // « Annuler » retire les personnes qui viennent d'être ajoutées.
    await page.getByTestId('group-access-undo-button').click();
    await expect(page.getByTestId('group-access-summary')).toHaveText('1 personne a accès');
    await option.click();
    await expect(page.getByTestId('group-access-summary')).toHaveText('3 personnes ont accès');

    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();

    const group = await findByName(users.admin.token, name);
    expect(new Set(group.access_member_ids)).toEqual(
      new Set([users.admin.memberId, users.member.memberId, users.member2.memberId]),
    );

    // Copie, pas de lien dynamique : la tribu qui change ensuite ne modifie pas l'accès.
    await apiCall(users.admin.token, 'DELETE', `/tribus/${tribuId}/members/${users.member2.memberId}`);
    const after = await findByName(users.admin.token, name);
    expect(after.access_member_ids).toContain(users.member2.memberId);
  });
});

test.describe('Groupes WhatsApp : contrôle d\'accès (API + UI)', () => {
  test('6. un groupe sans accès est invisible et son lien ne fuit jamais', async ({ browser }) => {
    const name = `E2E Secret ${stamp()}`;
    const link = fakeInviteLink(`secret${stamp()}`);
    const group = await createWhatsappGroup(users.admin.token, {
      name,
      invite_link: link,
      restricted: true,
      memberIds: [users.member.memberId],
    });

    // member2 : absent de la réponse API, lien compris.
    const list = await apiRaw(users.member2.token, 'GET', '/whatsapp-groups');
    expect(list.status).toBe(200);
    expect(list.text).not.toContain(group.id);
    expect(list.text).not.toContain(link);

    // Toute action sur ce groupe donne 404 (on ne révèle même pas son existence).
    const id = group.id;
    for (const [method, route, body] of [
      ['PATCH', `/whatsapp-groups/${id}`, { name: 'Piraté' }],
      ['POST', `/whatsapp-groups/${id}/access`, { memberIds: [users.member2.memberId] }],
      ['PUT', `/whatsapp-groups/${id}/joined`, { joined: true }],
      ['POST', `/whatsapp-groups/${id}/report-link`, undefined],
      ['DELETE', `/whatsapp-groups/${id}`, undefined],
    ] as const) {
      const res = await apiRaw(users.member2.token, method, route, body);
      expect(res.status, `${method} ${route}`).toBe(404);
      expect(res.text).not.toContain(link);
    }

    // Côté UI : la carte n'existe pas pour member2, elle existe pour member.
    const ctx2 = await browser.newContext({ storageState: STORAGE_FILE.member2 });
    const page2 = await ctx2.newPage();
    await openGroups(page2);
    await expect(page2.getByTestId(`group-card-${id}`)).toHaveCount(0);
    await ctx2.close();

    const ctx1 = await browser.newContext({ storageState: STORAGE_FILE.member });
    const page1 = await ctx1.newPage();
    await openGroups(page1);
    await expect(page1.getByTestId(`group-card-${id}`)).toBeVisible();
    await ctx1.close();
  });

  test('7. un membre ayant accès modifie la fiche, ajoute et peut retirer des personnes (UI)', async ({ browser }) => {
    const group = await createWhatsappGroup(users.admin.token, {
      name: `E2E Modif ${stamp()}`,
      invite_link: fakeInviteLink(`modif${stamp()}`),
      restricted: true,
      memberIds: [users.member.memberId],
    });
    const newName = `Renommé ${stamp()}`;

    const ctx = await browser.newContext({ storageState: STORAGE_FILE.member });
    const page = await ctx.newPage();
    await openGroups(page);
    await page.getByTestId(`group-edit-button-${group.id}`).click();
    await expect(page.getByTestId('group-form-modal')).toBeVisible();

    // Seul le créateur n'a pas de bouton de retrait (il garde toujours accès) ; plus aucun cadenas.
    await expect(page.getByTestId(`group-access-chip-${users.admin.memberId}`)).toBeVisible();
    await expect(page.getByTestId(`group-access-creator-${users.admin.memberId}`)).toBeVisible();
    await expect(page.getByTestId(`group-access-remove-${users.admin.memberId}`)).toHaveCount(0);
    await expect(page.getByTestId(`group-access-remove-${users.member.memberId}`)).toBeVisible();
    await expect(page.locator('[data-testid^="group-access-locked-"]')).toHaveCount(0);
    // Le mode d'accès est modifiable ; l'épinglage et la suppression restent réservés au créateur / admin.
    await expect(page.getByTestId('group-access-mode-family')).toBeEnabled();
    await expect(page.getByTestId('group-form-pinned-input')).toHaveCount(0);
    await expect(page.getByTestId('group-form-delete-button')).toHaveCount(0);

    await page.getByTestId('group-form-name-input').fill(newName);
    await page.getByTestId('group-access-search-input').fill('E2E Ami');
    await page.getByTestId(`group-access-member-option-${users.member2.memberId}`).click();
    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();
    await expect(page.getByTestId(`group-name-${group.id}`)).toHaveText(newName);

    // Réouverture : le membre retire la personne qu'il vient d'ajouter.
    await page.getByTestId(`group-edit-button-${group.id}`).click();
    await page.getByTestId(`group-access-remove-${users.member2.memberId}`).click();
    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();
    await ctx.close();

    const updated = await findByName(users.admin.token, newName);
    expect(updated.access_member_ids).not.toContain(users.member2.memberId);
    expect((await listWhatsappGroups(users.member2.token)).some((g) => g.id === group.id)).toBe(false);
  });

  test('8. un membre ayant accès peut retirer quelqu\'un et changer le mode d\'accès ; le créateur garde accès', async () => {
    const group = await createWhatsappGroup(users.admin.token, {
      name: `E2E Retrait ${stamp()}`,
      invite_link: fakeInviteLink(`retrait${stamp()}`),
      restricted: true,
      memberIds: [users.member.memberId, users.member2.memberId],
    });
    const route = (memberId: string) => `/whatsapp-groups/${group.id}/access/${memberId}`;

    // Un non-créateur ayant accès retire une autre personne.
    const removed = await apiRaw(users.member.token, 'DELETE', route(users.member2.memberId));
    expect(removed.status).toBe(204);
    expect((await listWhatsappGroups(users.member2.token)).some((g) => g.id === group.id)).toBe(false);
    expect((await listWhatsappGroups(users.member.token)).some((g) => g.id === group.id)).toBe(true);

    // Personne (ni le créateur, ni un autre) ne peut retirer le créateur : le groupe garde toujours quelqu'un.
    expect((await apiRaw(users.member.token, 'DELETE', route(users.admin.memberId))).status).toBe(400);
    expect((await apiRaw(users.admin.token, 'DELETE', route(users.admin.memberId))).status).toBe(400);

    // Le non-créateur change le mode d'accès (famille) : tout le monde voit alors le groupe.
    const mode = await apiRaw(users.member.token, 'PATCH', `/whatsapp-groups/${group.id}`, { restricted: false });
    expect(mode.status).toBe(200);
    expect((await listWhatsappGroups(users.member2.token)).some((g) => g.id === group.id)).toBe(true);

    // Épinglage et suppression restent réservés au créateur / admin.
    expect((await apiRaw(users.member.token, 'PATCH', `/whatsapp-groups/${group.id}`, { pinned: true })).status).toBe(403);
    expect((await apiRaw(users.member.token, 'DELETE', `/whatsapp-groups/${group.id}`)).status).toBe(403);
  });

  test('9. un admin voit et modifie tous les groupes, y compris à accès limité dont il n\'est pas membre', async ({ browser }) => {
    // Créé par « member », limité à member2 : l'admin n'est ni créateur ni dans la liste d'accès.
    const link = fakeInviteLink(`adminvoit${stamp()}`);
    const group = await createWhatsappGroup(users.member.token, {
      name: `E2E AdminVoit ${stamp()}`,
      invite_link: link,
      restricted: true,
      memberIds: [users.member2.memberId],
    });
    expect(group.access_member_ids).not.toContain(users.admin.memberId);

    const seen = (await listWhatsappGroups(users.admin.token)).find((g) => g.id === group.id);
    expect(seen?.invite_link).toBe(link);

    const ctx = await browser.newContext({ storageState: STORAGE_FILE.admin });
    const page = await ctx.newPage();
    await openGroups(page);
    await expect(page.getByTestId(`group-card-${group.id}`)).toBeVisible();
    await expect(page.getByTestId(`group-join-button-${group.id}`)).toHaveAttribute('href', link);
    await page.getByTestId(`group-edit-button-${group.id}`).click();
    const newName = `Admin a modifié ${stamp()}`;
    await page.getByTestId('group-form-name-input').fill(newName);
    await page.getByTestId('group-form-submit-button').click();
    await expect(page.getByTestId('group-form-modal')).toBeHidden();
    await expect(page.getByTestId(`group-name-${group.id}`)).toHaveText(newName);
    await ctx.close();

    expect((await findByName(users.member.token, newName)).id).toBe(group.id);
  });
});

test.describe('Groupes WhatsApp : « J\'y suis déjà » et signalement (membre)', () => {
  test.use({ storageState: STORAGE_FILE.member });

  test('10. « J\'y suis déjà » bascule en « Vous y êtes » et met à jour le compteur', async ({ page }) => {
    const group = await createWhatsappGroup(users.admin.token, {
      name: `E2E Present ${stamp()}`,
      invite_link: fakeInviteLink(`present${stamp()}`),
    });
    await openGroups(page);
    const button = page.getByTestId(`group-joined-button-${group.id}`);
    const count = page.getByTestId(`group-member-count-${group.id}`);
    await expect(button).toHaveText("J'y suis déjà");
    await expect(count).toContainText('Personne');

    await button.click();
    await expect(button).toHaveText('Vous y êtes');
    await expect(count).toHaveText("1 membre de l'arbre y est");

    await page.reload();
    await expect(page.getByTestId(`group-joined-button-${group.id}`)).toHaveText('Vous y êtes');

    await page.getByTestId(`group-joined-button-${group.id}`).click();
    await expect(page.getByTestId(`group-joined-button-${group.id}`)).toHaveText("J'y suis déjà");
  });

  test('11. signaler un lien cassé prévient le créateur ; modifier le lien efface les signalements', async ({ page, browser }) => {
    const group = await createWhatsappGroup(users.admin.token, {
      name: `E2E Cassé ${stamp()}`,
      invite_link: fakeInviteLink(`casse${stamp()}`),
    });
    await openGroups(page);
    // Le créateur est seul à voir l'alerte : pas pour le membre.
    await page.getByTestId(`group-report-button-${group.id}`).click();
    await expect(page.getByTestId(`group-reported-by-me-${group.id}`)).toBeVisible();
    await expect(page.getByTestId(`group-reported-alert-${group.id}`)).toHaveCount(0);

    expect((await findByName(users.member.token, group.name)).report_count).toBe(0);
    expect((await findByName(users.admin.token, group.name)).report_count).toBe(1);

    const ctx = await browser.newContext({ storageState: STORAGE_FILE.admin });
    const adminPage = await ctx.newPage();
    await openGroups(adminPage);
    await expect(adminPage.getByTestId(`group-reported-alert-${group.id}`)).toContainText('1 personne signale');
    await ctx.close();

    await apiCall(users.admin.token, 'PATCH', `/whatsapp-groups/${group.id}`, { invite_link: fakeInviteLink(`nouveau${stamp()}`) });
    expect((await findByName(users.admin.token, group.name)).report_count).toBe(0);
  });
});

test.describe('Groupes WhatsApp : mobile 390px', () => {
  test.use({ storageState: STORAGE_FILE.admin, viewport: { width: 390, height: 844 } });

  test('12. la page, le formulaire et le sélecteur tiennent à l\'écran sans défilement horizontal', async ({ page }) => {
    await openGroups(page);
    await expect(page.getByTestId('mobile-nav-groups-link')).toBeVisible();
    await page.getByTestId('groups-add-button').click();
    await page.getByTestId('group-access-mode-limited').click();
    await expect(page.getByTestId('group-access-picker')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const modalBox = await page.getByTestId('group-form-modal').boundingBox();
    expect(modalBox!.width).toBeLessThanOrEqual(390);
  });
});
