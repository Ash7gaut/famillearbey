import { test, expect } from '@playwright/test';
import {
  API_URL,
  STORAGE_FILE,
  addWishlistItem,
  apiCall,
  createDrawnSecretSanta,
  createSecretSantaGroup,
  deleteSecretSantaGroup,
  listOwnWishlist,
  listReceiverWishlist,
  mockLinkPreview,
  pickWishlistItem,
  readUsers,
  receiverOfGiver,
} from './helpers';

// Groupes créés pendant un test : supprimés en afterEach (par leur créateur).
const created: { token: string; groupId: string }[] = [];

async function newDrawnGroup(title: string): Promise<string> {
  const groupId = await createDrawnSecretSanta(title);
  created.push({ token: readUsers().admin.token, groupId });
  return groupId;
}

test.afterEach(async () => {
  for (const group of created.splice(0)) {
    await deleteSecretSantaGroup(group.token, group.groupId).catch(() => undefined);
  }
});

test.describe('Secret Santa : éditeur de liste de souhaits', () => {
  test.use({ storageState: STORAGE_FILE.member });

  test.beforeEach(async ({ page }) => {
    // Microlink en échec par défaut : les tests qui veulent un aperçu le surchargent.
    await mockLinkPreview(page, null);
  });

  test('1. ajout, modification puis retrait d\'une idée', async ({ page }) => {
    const { member } = readUsers();
    const group = await createSecretSantaGroup(member.token, 'E2E liste souhaits');
    created.push({ token: member.token, groupId: group.id });

    await page.goto(`/secret-santa/${group.id}`);
    await expect(page.getByTestId('secret-santa-detail-page')).toBeVisible();

    // Ajout
    await page.getByTestId('wishlist-add-button').click();
    await page.getByTestId('wishlist-title-input').fill('Casque audio');
    await page.getByTestId('wishlist-price-input').fill('79,90 €');
    await page.getByTestId('wishlist-submit-button').click();
    await expect(page.getByTestId('wishlist-add-modal')).toHaveCount(0);
    const [item] = await listOwnWishlist(member.token, group.id);
    await expect(page.getByTestId(`wishlist-item-title-${item.id}`)).toHaveText('Casque audio');

    // Modification
    await page.getByTestId(`wishlist-edit-button-${item.id}`).click();
    await page.getByTestId('wishlist-title-input').fill('Casque audio sans fil');
    await page.getByTestId('wishlist-submit-button').click();
    await expect(page.getByTestId(`wishlist-item-title-${item.id}`)).toHaveText('Casque audio sans fil');

    // Retrait (confirmation navigateur)
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId(`wishlist-delete-button-${item.id}`).click();
    await expect(page.getByTestId(`wishlist-item-${item.id}`)).toHaveCount(0);
    await expect(page.getByTestId('wishlist-empty')).toBeVisible();
  });

  test('2. Microlink en échec : repli sur la saisie manuelle, le lien est conservé', async ({ page }) => {
    const { member } = readUsers();
    const group = await createSecretSantaGroup(member.token, 'E2E aperçu échoué');
    created.push({ token: member.token, groupId: group.id });
    const url = 'https://boutique.example.com/produit-test';

    await mockLinkPreview(page, null);
    await page.goto(`/secret-santa/${group.id}`);
    await page.getByTestId('wishlist-add-button').click();
    await page.getByTestId('wishlist-url-input').fill(url);
    await page.getByTestId('wishlist-preview-button').click();
    await expect(page.getByTestId('wishlist-preview-failed')).toBeVisible();

    await page.getByTestId('wishlist-title-input').fill('Livre de cuisine');
    await page.getByTestId('wishlist-submit-button').click();
    await expect(page.getByTestId('wishlist-add-modal')).toHaveCount(0);

    const [item] = await listOwnWishlist(member.token, group.id);
    expect(item.title).toBe('Livre de cuisine');
    expect(item.url).toBe(url);
  });
});

// Mobile : la modale doit passer au-dessus de la barre de navigation du bas et rester atteignable.
for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 640 },
]) {
  test.describe(`Secret Santa : modale d'idée en mobile ${viewport.width}x${viewport.height}`, () => {
    test.use({ storageState: STORAGE_FILE.member, viewport });

    test('bouton de validation visible, cliquable et non recouvert', async ({ page }) => {
      const { member } = readUsers();
      const group = await createSecretSantaGroup(member.token, 'E2E modale mobile');
      created.push({ token: member.token, groupId: group.id });
      await mockLinkPreview(page, null);

      await page.goto(`/secret-santa/${group.id}`);
      await page.getByTestId('wishlist-add-button').click();
      const modal = page.getByTestId('wishlist-add-modal');
      const submit = page.getByTestId('wishlist-submit-button');
      await expect(modal).toBeVisible();
      await expect(submit).toBeVisible();

      // Rien (barre de navigation, etc.) ne recouvre le bouton en son centre
      const covered = await submit.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(top && (top === el || el.contains(top)));
      });
      expect(covered).toBe(false);

      // La modale reste dans la fenêtre (défilement interne)
      const box = await modal.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

      // Le bouton reste cliquable : l'envoi ferme la modale
      await page.getByTestId('wishlist-title-input').fill('Idée mobile');
      await submit.click();
      await expect(modal).toHaveCount(0);
      const items = await listOwnWishlist(member.token, group.id);
      expect(items).toHaveLength(1);
    });
  });
}

test.describe('Secret Santa : tirage et révélation', () => {
  test.use({ storageState: STORAGE_FILE.member });

  test('3. après le tirage, ni « Voir le profil » ni lien profil dans le roster ni dans le panneau', async ({ page }) => {
    const groupId = await newDrawnGroup('E2E roster sans lien');

    await page.goto(`/secret-santa/${groupId}`);
    await expect(page.getByTestId('draw-roster')).toBeVisible();
    await expect(page.getByText('Voir le profil')).toHaveCount(0);
    await expect(page.getByTestId('draw-participant-link')).toHaveCount(0);

    await page.goto(`/secret-santa/${groupId}/reveal`);
    await expect(page.getByTestId('draw-participants-panel')).toBeVisible();
    await expect(page.getByText('Voir le profil')).toHaveCount(0);
    await expect(page.getByTestId('draw-participant-link')).toHaveCount(0);
  });

  test('4. après révélation, le tireur voit la liste de son tiré et peut cocher / décocher', async ({ page }) => {
    const { member } = readUsers();
    const groupId = await newDrawnGroup('E2E révélation cases');
    const receiver = await receiverOfGiver(member, groupId);
    const item = await addWishlistItem(receiver.token, groupId, { title: 'Livre de cuisine' });

    await page.goto(`/secret-santa/${groupId}/reveal`);
    await page.getByTestId('assignment-spin-button').click();
    await expect(page.getByTestId('receiver-wishlist')).toBeVisible();
    await expect(page.getByTestId('wishlist-loading-spinner')).toHaveCount(0);
    await expect(page.getByTestId('wishlist-error')).toHaveCount(0);

    const checkbox = page.getByTestId(`wishlist-pick-checkbox-${item.id}`);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    expect((await listReceiverWishlist(member.token, groupId)).find((i) => i.id === item.id)?.picked).toBe(true);

    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});

test.describe('Secret Santa : confidentialité des listes (API)', () => {
  test('5. le tiré ne voit jamais les cases cochées par son tireur', async () => {
    const { member } = readUsers();
    const groupId = await newDrawnGroup('E2E confidentialité picks');
    const receiver = await receiverOfGiver(member, groupId);
    const item = await addWishlistItem(receiver.token, groupId, { title: 'Montre' });
    await pickWishlistItem(member.token, groupId, item.id);

    // Le tireur voit bien la case cochée...
    expect((await listReceiverWishlist(member.token, groupId))[0].picked).toBe(true);

    // ...mais la liste propre du tiré n'en contient aucune trace.
    const own = await listOwnWishlist(receiver.token, groupId);
    expect(own).toHaveLength(1);
    expect(JSON.stringify(own)).not.toContain('picked');
    const assignment = await apiCall<unknown>(receiver.token, 'GET', `/secret-santa/${groupId}/my-assignment`);
    expect(JSON.stringify(assignment)).not.toContain('picked');
  });

  test('6. un participant ne lit que la liste de son tiré ; un non-participant est refusé', async () => {
    const users = readUsers();
    const groupId = await newDrawnGroup('E2E périmètre listes');
    const receiver = await receiverOfGiver(users.member, groupId);
    const other = [users.admin, users.member2].find((u) => u.memberId !== receiver.memberId && u.memberId !== users.member.memberId);
    if (!other) throw new Error('Il faut trois participants pour ce test');

    const receiverItem = await addWishlistItem(receiver.token, groupId, { title: 'Idée du tiré' });
    await addWishlistItem(other.token, groupId, { title: 'Idée d\'un autre participant' });

    // Le tireur ne récupère que la liste de son tiré.
    const seen = await listReceiverWishlist(users.member.token, groupId);
    expect(seen.map((i) => i.id)).toEqual([receiverItem.id]);

    // Un compte hors groupe n'accède ni au groupe ni à une liste.
    const outsideGroup = await createSecretSantaGroup(users.admin.token, 'E2E hors groupe');
    created.push({ token: users.admin.token, groupId: outsideGroup.id });
    const outsiderStatus = await fetch(`${API_URL}/secret-santa/${outsideGroup.id}/wishlist`, {
      headers: { Authorization: `Bearer ${users.member2.token}` },
    });
    expect(outsiderStatus.status).toBe(403);
  });
});
