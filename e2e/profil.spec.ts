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
