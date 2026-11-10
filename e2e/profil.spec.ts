import { test, expect } from '@playwright/test';
import { STORAGE_FILE } from './helpers';

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
    await expect(page.getByTestId('profile-phone')).toContainText('06 12 34 56 78');
  });

  test('2. un format invalide est refusé et reste en édition', async ({ page }) => {
    await page.getByTestId('profile-edit-button').click();
    await page.getByTestId('profile-phone-input').fill('abc');
    await page.getByTestId('profile-save-button').click();
    await expect(page.getByTestId('profile-feedback')).toHaveText('Numéro de téléphone invalide');
    await expect(page.getByTestId('profile-phone-input')).toBeVisible();
  });
});
