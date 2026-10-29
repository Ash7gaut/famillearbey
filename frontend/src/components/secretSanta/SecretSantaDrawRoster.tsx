import { Link } from 'react-router-dom';
import type { FamilyMember } from '../../types';
import type { ParticipantStatus, SecretSantaParticipantView } from '../../types/secretSanta';
import { MemberAvatar } from '../profile/MemberAvatar';
import {
  avatarPersonFromDisplayName,
  memberFullName,
  sanitizeMemberBio,
} from '../profile/memberUtils';

const participationStatusLabel: Record<ParticipantStatus, string> = {
  accepted: 'Confirmé',
  invited: 'En attente',
  declined: 'Décliné',
};

const participationStatusBadge: Record<ParticipantStatus, string> = {
  accepted: 'bg-arbey-100 text-arbey-700',
  invited: 'bg-warm-100 text-warm-700',
  declined: 'bg-red-50 text-red-600',
};

interface SecretSantaDrawRosterProps {
  accepted: SecretSantaParticipantView[];
  absent: SecretSantaParticipantView[];
  memberById: Map<string, FamilyMember>;
  drawnAt?: string | null;
}

export function SecretSantaDrawRoster({
  accepted,
  absent,
  memberById,
  drawnAt,
}: SecretSantaDrawRosterProps) {
  return (
    <div className="card" data-testid="draw-roster">
      <h2 className="font-display font-semibold text-arbey-900">Participants au tirage</h2>
      <p className="mt-1 text-sm text-arbey-600">
        {accepted.length} personne{accepted.length > 1 ? 's' : ''} dans la roue
        {drawnAt &&
          ` · tirage le ${new Date(drawnAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`}
      </p>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-arbey-600">
          Ont participé ({accepted.length})
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="draw-roster-accepted-list">
          {accepted.map((participant) => (
            <DrawParticipantCard
              key={participant.id}
              participant={participant}
              member={participant.member_id ? memberById.get(participant.member_id) ?? null : null}
              variant="active"
            />
          ))}
        </div>
      </section>

      {absent.length > 0 && (
        <section className="mt-8 border-t border-cream-300/70 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            N&apos;ont pas participé ({absent.length})
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="draw-roster-absent-list">
            {absent.map((participant) => (
              <DrawParticipantCard
                key={participant.id}
                participant={participant}
                member={participant.member_id ? memberById.get(participant.member_id) ?? null : null}
                variant="inactive"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DrawParticipantCard({
  participant,
  member,
  variant,
}: {
  participant: SecretSantaParticipantView;
  member: FamilyMember | null;
  variant: 'active' | 'inactive';
}) {
  const isActive = variant === 'active';
  const bio = member ? sanitizeMemberBio(member.bio) : null;
  const avatarMember = member ?? avatarPersonFromDisplayName(participant.display_name, participant.photo_url);
  const initialsTone = isActive ? 'warm' : 'muted';

  const content = (
    <>
      <MemberAvatar member={avatarMember} size="xl" initialsTone={initialsTone} />
      <div className="min-w-0 flex-1">
        <p
          className={`font-display text-base font-semibold ${
            isActive ? 'text-ink-800' : 'text-ink-600'
          }`}
        >
          {member ? memberFullName(member) : participant.display_name}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${participationStatusBadge[participant.status]}`}
          >
            {participationStatusLabel[participant.status]}
          </span>
          {participant.is_creator && (
            <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warm-700">
              Créateur
            </span>
          )}
          {participant.is_external && (
            <span className="rounded-md bg-cream-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
              Invité externe
            </span>
          )}
        </div>
        {bio && isActive && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">{bio}</p>
        )}
        {member && isActive && (
          <p className="mt-2 text-xs font-medium text-warm-700">Voir le profil →</p>
        )}
      </div>
    </>
  );

  const className = `flex items-start gap-3 rounded-2xl border p-4 transition ${
    isActive
      ? 'border-cream-300/70 bg-cream-50/80 hover:border-warm-200 hover:bg-warm-50/40'
      : 'border-cream-300/50 bg-cream-50/60 opacity-90'
  }`;

  if (member && isActive) {
    return (
      <Link to={`/profil/${member.id}`} className={`focus-ring ${className}`} data-testid={`draw-roster-card-${participant.id}`}>
        {content}
      </Link>
    );
  }

  return <div className={className} data-testid={`draw-roster-card-${participant.id}`}>{content}</div>;
}
