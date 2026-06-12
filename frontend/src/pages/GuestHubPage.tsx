import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Link2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { GuestInviteInfo } from '../types/secretSanta';
import {
  getGuestInvites,
  guestInvitePath,
  guestInviteUrl,
  removeGuestInvite,
  saveGuestInvite,
  type StoredGuestInvite,
} from '../lib/guestInviteStorage';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const statusLabels: Record<string, string> = {
  'invited-open': 'En attente de ta réponse',
  'accepted-open': 'Inscrit — tirage à venir',
  'accepted-drawn': 'Tirage fait — ouvre pour voir',
  'declined-open': 'Invitation déclinée',
  'declined-drawn': 'Invitation déclinée',
  'invited-drawn': 'Tirage déjà lancé',
};

function inviteStatusLabel(invite: StoredGuestInvite) {
  return statusLabels[`${invite.status}-${invite.groupStatus}`] ?? 'Invitation';
}

function InviteCard({
  invite,
  onRemove,
}: {
  invite: StoredGuestInvite;
  onRemove: (token: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(guestInviteUrl(invite.token));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-warm-600">Secret Santa</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink-800">{invite.groupTitle}</h2>
          <p className="mt-1 text-sm text-ink-500">
            Bonjour {invite.guestDisplayName}
            {invite.budget ? ` · Budget : ${invite.budget}` : ''}
          </p>
          <span className="mt-3 inline-block rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-ink-600">
            {inviteStatusLabel(invite)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(invite.token)}
          className="focus-ring shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
          title="Retirer de cette liste"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={guestInvitePath(invite.token)} className="btn-primary">
          Ouvrir
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button type="button" onClick={() => void copyLink()} className="btn-secondary">
          <Link2 className="h-4 w-4" strokeWidth={2} />
          {copied ? 'Lien copié' : 'Copier le lien'}
        </button>
      </div>
    </article>
  );
}

export function GuestHubPage() {
  const [invites, setInvites] = useState<StoredGuestInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshInvites = useCallback(async () => {
    const stored = getGuestInvites();
    if (stored.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }

    const refreshed = await Promise.all(
      stored.map(async (invite) => {
        try {
          const info = await api.get<GuestInviteInfo>(`/secret-santa/invite/${invite.token}`);
          return saveGuestInvite(invite.token, info);
        } catch {
          return invite;
        }
      }),
    );

    setInvites(refreshed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshInvites();
  }, [refreshInvites]);

  function handleRemove(token: string) {
    removeGuestInvite(token);
    setInvites((current) => current.filter((item) => item.token !== token));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-100 text-warm-700">
          <Gift className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="page-title">Mes invitations</h1>
        <p className="page-subtitle">
          Retrouve ici les Secret Santa auxquels tu as été invité. Garde cette page en favori ou
          le lien reçu par email pour revenir plus tard.
        </p>
      </div>

      {invites.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm leading-relaxed text-ink-600">
            Aucune invitation enregistrée sur cet appareil pour l&apos;instant.
          </p>
          <p className="mt-3 text-sm text-ink-500">
            Tu as reçu un email d&apos;invitation ? Ouvre le lien dedans — il s&apos;affichera
            automatiquement ici.
          </p>
          <Link to="/" className="btn-secondary mt-6 inline-flex">
            Retour à l&apos;accueil
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <InviteCard key={invite.token} invite={invite} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
