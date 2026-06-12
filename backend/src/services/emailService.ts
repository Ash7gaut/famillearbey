import { Resend } from 'resend';
import { env } from '../config/env.js';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!env.resendApiKey) return null;
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

function budgetLine(budget: string | null | undefined): string {
  return budget ? `<p style="margin:0 0 16px;color:#495643;">Budget : <strong>${escapeHtml(budget)}</strong></p>` : '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f6f7f4;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e8ebe3;">
    <p style="margin:0 0 8px;font-size:24px;">🎁</p>
    ${content}
    <p style="margin:24px 0 0;font-size:12px;color:#768866;">Famille Arbey</p>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY absent — email non envoyé à', to);
    return false;
  }

  const { error } = await client.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[email] Erreur Resend:', error);
    return false;
  }

  return true;
}

export const emailService = {
  isConfigured(): boolean {
    return Boolean(env.resendApiKey);
  },

  async sendSecretSantaFamilyInvite(params: {
    to: string;
    inviteeName: string;
    creatorName: string;
    groupTitle: string;
    budget?: string | null;
    appUrl: string;
  }): Promise<boolean> {
    const link = `${params.appUrl}/secret-santa`;
    const html = layout(`
      <h1 style="margin:0 0 12px;font-size:20px;color:#333c30;">Invitation Secret Santa</h1>
      <p style="margin:0 0 16px;color:#495643;">
        Bonjour ${escapeHtml(params.inviteeName)},<br><br>
        <strong>${escapeHtml(params.creatorName)}</strong> t'invite au Secret Santa
        <strong>${escapeHtml(params.groupTitle)}</strong>.
      </p>
      ${budgetLine(params.budget)}
      <p style="margin:0 0 20px;color:#495643;">
        Connecte-toi sur Famille Arbey pour accepter ou décliner l'invitation.
      </p>
      <a href="${link}" style="display:inline-block;background:#495643;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;">
        Voir l'invitation
      </a>
    `);

    return sendEmail(
      params.to,
      `🎁 ${params.creatorName} t'invite à un Secret Santa`,
      html,
    );
  },

  async sendSecretSantaExternalInvite(params: {
    to: string;
    inviteeName: string;
    creatorName: string;
    groupTitle: string;
    budget?: string | null;
    inviteLink: string;
  }): Promise<boolean> {
    const html = layout(`
      <h1 style="margin:0 0 12px;font-size:20px;color:#333c30;">Invitation Secret Santa</h1>
      <p style="margin:0 0 16px;color:#495643;">
        Bonjour ${escapeHtml(params.inviteeName)},<br><br>
        <strong>${escapeHtml(params.creatorName)}</strong> t'invite au Secret Santa
        <strong>${escapeHtml(params.groupTitle)}</strong>.
      </p>
      ${budgetLine(params.budget)}
      <p style="margin:0 0 20px;color:#495643;">
        Clique sur le bouton ci-dessous pour participer — pas besoin de compte.
        Garde ce lien pour revenir après le tirage.
      </p>
      <a href="${params.inviteLink}" style="display:inline-block;background:#495643;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;">
        Ouvrir mon invitation
      </a>
      <p style="margin:16px 0 0;font-size:13px;color:#495643;">
        Tu pourras aussi retrouver tes invitations sur
        <a href="${env.appUrl}/mes-invitations" style="color:#495643;font-weight:600;">
          Mes invitations
        </a>
        (sur le même appareil).
      </p>
      <p style="margin:20px 0 0;font-size:12px;color:#768866;word-break:break-all;">
        Lien direct : ${escapeHtml(params.inviteLink)}
      </p>
    `);

    return sendEmail(
      params.to,
      `🎁 ${params.creatorName} t'invite à un Secret Santa`,
      html,
    );
  },
};
