import { AlertTriangle, Check, Link2, Lock, Pencil, Pin, Users } from 'lucide-react';
import type { WhatsAppGroup } from '../../types';

interface GroupCardProps {
  group: WhatsAppGroup;
  busy: boolean;
  onEdit: (group: WhatsAppGroup) => void;
  onToggleJoined: (group: WhatsAppGroup) => void;
  onReportLink: (group: WhatsAppGroup) => void;
}

function initials(name: string): string {
  const all = name.trim().split(/\s+/).filter(Boolean);
  // On ignore les petits mots (« la », « & », « de »…) quand il reste au moins deux mots.
  const significant = all.filter((w) => /[\p{L}\p{N}]/u.test(w) && w.length > 2);
  const words = significant.length > 1 ? significant : all;
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
}

function memberCountLabel(n: number): string {
  if (n === 0) return "Personne n'a encore dit y être";
  if (n === 1) return "1 membre de l'arbre y est";
  return `${n} membres de l'arbre y sont`;
}

export function GroupCard({ group, busy, onEdit, onToggleJoined, onReportLink }: GroupCardProps) {
  const id = group.id;

  return (
    <article className="card flex flex-col gap-3.5" data-testid={`group-card-${id}`}>
      <div className="flex items-start gap-3.5">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            data-testid={`group-image-${id}`}
          />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-warm-100 font-display text-lg font-semibold text-warm-800"
            aria-hidden
            data-testid={`group-initials-${id}`}
          >
            {initials(group.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink-800 [overflow-wrap:anywhere]" data-testid={`group-name-${id}`}>
            {group.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {group.pinned && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-xs font-semibold text-warm-800"
                data-testid={`group-pinned-badge-${id}`}
              >
                <Pin className="h-3 w-3" aria-hidden /> Épinglé
              </span>
            )}
            {group.restricted && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold text-ink-600"
                data-testid={`group-restricted-badge-${id}`}
              >
                <Lock className="h-3 w-3" aria-hidden /> Accès limité
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(group)}
          aria-label={`Modifier ${group.name}`}
          data-testid={`group-edit-button-${id}`}
          className="focus-ring -mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-400 transition hover:bg-cream-200 hover:text-ink-800"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {group.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-600 [overflow-wrap:anywhere]" data-testid={`group-description-${id}`}>
          {group.description}
        </p>
      )}

      <p className="flex items-center gap-2 text-sm text-ink-500" data-testid={`group-member-count-${id}`}>
        <Users className="h-4 w-4 shrink-0" aria-hidden />
        {memberCountLabel(group.joined_count)}
      </p>

      {group.is_creator && group.report_count > 0 && (
        <div
          className="flex items-start gap-2 rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm text-warm-900"
          role="alert"
          data-testid={`group-reported-alert-${id}`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {group.report_count > 1 ? `${group.report_count} personnes signalent` : '1 personne signale'} que le lien ne marche plus.
            Vérifie-le puis mets-le à jour dans la fiche.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <a
          href={group.invite_link}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`group-join-button-${id}`}
          className="btn-primary min-h-[44px] flex-1 basis-36"
        >
          <Link2 className="h-4 w-4" aria-hidden />
          Rejoindre
        </a>
        <button
          type="button"
          onClick={() => onToggleJoined(group)}
          disabled={busy}
          aria-pressed={group.joined}
          data-testid={`group-joined-button-${id}`}
          className={`focus-ring inline-flex min-h-[44px] flex-1 basis-36 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
            group.joined
              ? 'border-arbey-300 bg-arbey-100 text-arbey-800'
              : 'border-cream-400 bg-cream-50 text-ink-700 hover:border-warm-200 hover:bg-warm-50'
          }`}
        >
          {group.joined && <Check className="h-4 w-4" aria-hidden />}
          {group.joined ? 'Vous y êtes' : "J'y suis déjà"}
        </button>
      </div>

      {group.reported_by_me ? (
        <p className="text-xs text-ink-500" data-testid={`group-reported-by-me-${id}`}>
          Lien signalé au créateur, merci.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => onReportLink(group)}
          disabled={busy}
          data-testid={`group-report-button-${id}`}
          className="focus-ring self-start rounded text-xs text-ink-500 underline hover:text-ink-800 disabled:opacity-60"
        >
          Le lien ne marche plus ?
        </button>
      )}
    </article>
  );
}
