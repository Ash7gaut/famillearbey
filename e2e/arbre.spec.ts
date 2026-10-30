import { test, expect, type Page } from '@playwright/test';
import { STORAGE_FILE, readUsers } from './helpers';

const users = readUsers();
const memberId = users.member.memberId;
const MEMBER_NAME = 'E2E Membre';

/** Carte d'un membre (exclut les sous-éléments avatar-/mamie-badge-). */
const anyMemberCard = /^tree-member-(?!avatar-|mamie-)/;

/**
 * Un chargement direct de /tree renvoie vers /accueil (RequireAuth) : on passe par la navigation de l'app.
 */
async function openTree(page: Page) {
  await page.goto('/accueil');
  await page.getByTestId('nav-tree-link').click();
  await expect(page.getByTestId('tree-canvas')).toBeVisible({ timeout: 15_000 });
}

function parseRgb(css: string): number[] {
  return (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
}

test.describe('Arbre généalogique (desktop)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('1. la page se charge avec le canvas et au moins une carte', async ({ page }) => {
    await openTree(page);
    await expect(page.getByTestId(anyMemberCard).first()).toBeVisible();
  });

  test('2. les boutons + et − modifient le niveau de zoom', async ({ page }) => {
    await openTree(page);
    const viewport = page.getByTestId('tree-viewport');
    const initial = await viewport.getAttribute('data-zoom');
    await page.getByTestId('tree-zoom-in-button').click();
    await expect(viewport).not.toHaveAttribute('data-zoom', initial!);
    const zoomedIn = await viewport.getAttribute('data-zoom');
    await page.getByTestId('tree-zoom-out-button').click();
    await expect(viewport).not.toHaveAttribute('data-zoom', zoomedIn!);
  });

  test('3. un clic sur une carte ouvre la fiche, qui se ferme', async ({ page }) => {
    await openTree(page);
    // Racine = le membre : pas d'animation de recentrage (contrairement à la recherche) avant le clic.
    await page.getByTestId('tree-root-select').selectOption(memberId);
    await page.getByTestId(`tree-member-${memberId}`).click();
    await expect(page.getByTestId('member-modal-name')).toHaveText(MEMBER_NAME);
    await page.getByTestId('member-modal-close-button').click();
    await expect(page.getByTestId('member-modal')).toBeHidden();
  });

  test('4. la recherche trouve un membre et ferme la liste sur sélection', async ({ page }) => {
    await openTree(page);
    await page.getByTestId('tree-search-input').fill('E2E');
    await expect(page.getByTestId(`tree-search-result-${memberId}`)).toBeVisible();
    await page.getByTestId(`tree-search-result-${memberId}`).click();
    await expect(page.getByTestId('tree-search-results')).toBeHidden();
    await expect(page.getByTestId(`tree-member-${memberId}`)).toBeVisible();
  });

  test('5. changer de racine affiche le membre choisi', async ({ page }) => {
    await openTree(page);
    await page.getByTestId('tree-root-select').selectOption(memberId);
    await expect(page.getByTestId('tree-root-select')).toHaveValue(memberId);
    await expect(page.getByTestId(`tree-member-${memberId}`)).toBeVisible();
  });

  test('6. le mode sombre rend le canvas sombre (pas de fond blanc)', async ({ page }) => {
    await openTree(page);
    await page.getByTestId('theme-toggle-sidebar-button').click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    const bg = await page.getByTestId('tree-canvas').evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = parseRgb(bg);
    expect((r + g + b) / 3).toBeLessThan(100);
  });
});

test.describe('Arbre généalogique (mobile 390px)', () => {
  test.use({ storageState: STORAGE_FILE.admin, viewport: { width: 390, height: 844 } });

  test('7. la barre mobile ouvre l\'arbre sans scroll horizontal de la page', async ({ page }) => {
    await page.goto('/accueil');
    await page.getByTestId('mobile-nav-tree-link').click();
    await expect(page.getByTestId('tree-canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(anyMemberCard).first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBe(0);
  });
});
