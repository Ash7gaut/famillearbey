import { test, expect, type Page } from '@playwright/test';
import { STORAGE_FILE, createConversation, readUsers, sendMessageApi } from './helpers';

const users = readUsers();
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Un chargement direct de /messagerie* renvoie vers /accueil (RequireAuth voit la session
 * avant le member) : on passe donc par la navigation de l'app.
 */
async function openMessagerie(page: Page, convId?: string) {
  await page.goto('/accueil');
  await page.getByTestId('nav-messages-link').click();
  if (convId) await page.getByTestId(`conversation-item-${convId}`).click();
}

test.describe('Messagerie (admin)', () => {
  test.use({ storageState: STORAGE_FILE.admin });

  test('1. admin crée un groupe et il apparaît dans la liste', async ({ page }) => {
    const title = `E2E ${stamp()}`;
    await openMessagerie(page);
    await page.getByTestId('messaging-new-group-button').click();
    await page.getByTestId('new-conversation-title-input').fill(title);
    await page.getByTestId('new-conversation-member-select-trigger').click();
    await page.getByTestId('new-conversation-member-select-search-input').fill('E2E');
    await page.getByTestId(`member-option-${users.member.memberId}`).click();
    await page.getByTestId('new-conversation-submit-button').click();
    await expect(page.getByTestId(/^conversation-title-/).filter({ hasText: title })).toBeVisible();
  });

  test("2. un message envoyé ne s'affiche qu'une fois", async ({ page }) => {
    const conv = await createConversation(users.admin.token, `E2E msg ${stamp()}`, [users.member.memberId]);
    const content = `Bonjour ${stamp()}`;
    await openMessagerie(page, conv.id);
    const input = page.getByTestId('conversation-message-input');
    await input.fill(content);
    await page.getByTestId('conversation-send-button').click();
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('message-list').getByText(content, { exact: true })).toHaveCount(1);
  });

  test('3. le bouton cloche bascule le mode silencieux (persistant)', async ({ page }) => {
    const conv = await createConversation(users.admin.token, `E2E cloche ${stamp()}`, [users.member.memberId]);
    await openMessagerie(page, conv.id);
    const mute = page.getByTestId('conversation-mute-button');
    await mute.click();
    await expect(mute).toHaveAccessibleName(/activer les notifications/);
    await openMessagerie(page, conv.id);
    await expect(page.getByTestId('conversation-mute-button')).toHaveAccessibleName(/activer les notifications/);
  });
});

/** Résout quand le canal Realtime est abonné (phx_reply ok contenant postgres_changes). */
function waitRealtimeSubscribed(page: Page): Promise<void> {
  return new Promise((resolve) => {
    page.on('websocket', (ws) => {
      ws.on('framereceived', ({ payload }) => {
        const s = String(payload);
        if (s.includes('postgres_changes') && s.includes('"status":"ok"')) resolve();
      });
    });
  });
}

test.describe('Messagerie (membre, autre contexte)', () => {
  test('4a. le membre reçoit le message en temps réel dans la conversation ouverte', async ({ browser }) => {
    const conv = await createConversation(users.admin.token, `E2E rt ${stamp()}`, [users.member.memberId]);
    const ctx = await browser.newContext({ storageState: STORAGE_FILE.member });
    const memberPage = await ctx.newPage();
    const subscribed = waitRealtimeSubscribed(memberPage);

    await openMessagerie(memberPage, conv.id);
    await subscribed;

    const content = `Temps réel ${stamp()}`;
    await sendMessageApi(users.admin.token, conv.id, content);
    await expect(memberPage.getByTestId('message-list').getByText(content, { exact: true })).toHaveCount(1);
    await ctx.close();
  });

  test('4b. le membre voit le compteur de non-lus dans la liste sans recharger', async ({ browser }) => {
    const conv = await createConversation(users.admin.token, `E2E unread ${stamp()}`, [users.member.memberId]);
    const ctx = await browser.newContext({ storageState: STORAGE_FILE.member });
    const memberPage = await ctx.newPage();
    await openMessagerie(memberPage);
    await expect(memberPage.getByTestId(`conversation-item-${conv.id}`)).toBeVisible();

    await sendMessageApi(users.admin.token, conv.id, `Non lu ${stamp()}`);
    await expect(memberPage.getByTestId(`conversation-unread-badge-${conv.id}`)).toHaveText('1');
    await ctx.close();
  });
});
