import { test, expect } from '@playwright/test';
import { STORAGE_FILE } from './helpers';

/**
 * La page Famille a été retirée : plus de route /famille, plus d'entrée de nav,
 * plus de raccourci « Voir toute la famille » sur Mon profil.
 */

test.describe('Navigation sans page Famille (desktop)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('1. la sidebar garde ses liens et n\'a plus de lien vers /famille', async ({ page }) => {
    await page.goto('/messagerie');
    const sidebar = page.getByTestId('nav-sidebar');
    await expect(sidebar.getByTestId('nav-tree-link')).toBeVisible();
    await expect(sidebar.getByTestId('nav-albums-link')).toBeVisible();
    await expect(sidebar.locator('a[href="/famille"]')).toHaveCount(0);
  });

  test('2. /famille ne montre plus l\'ancienne page et renvoie vers la messagerie', async ({ page }) => {
    await page.goto('/famille');
    await expect(page).toHaveURL(/\/messagerie$/);
    await expect(page.getByTestId('nav-sidebar')).toBeVisible();
  });
});

test.describe('Navigation sans page Famille (mobile 390px)', () => {
  test.use({ storageState: STORAGE_FILE.admin, viewport: { width: 390, height: 844 } });

  test('3. la barre mobile garde ses liens et n\'a plus de lien vers /famille', async ({ page }) => {
    await page.goto('/messagerie');
    const mobileNav = page.getByTestId('nav-mobile');
    await expect(mobileNav.getByTestId('mobile-nav-tree-link')).toBeVisible();
    await expect(mobileNav.locator('a[href="/famille"]')).toHaveCount(0);
  });
});

test.describe('Mon profil : raccourcis', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('4. la carte Raccourcis propose arbre et albums, sans « Voir toute la famille »', async ({ page }) => {
    await page.goto('/profil');
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByTestId('profile-shortcut-tree-link')).toHaveText("Voir l'arbre généalogique");
    await expect(page.getByTestId('profile-shortcut-albums-link')).toHaveText('Parcourir les albums');
    await expect(page.locator('[data-testid^="profile-shortcut-"]')).toHaveCount(2);
  });
});
