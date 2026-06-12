import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { MemberAvatar } from '../profile/MemberAvatar';
import {
  avatarPersonFromDisplayName,
  memberFullName,
  sanitizeMemberBio,
} from '../profile/memberUtils';
import type { SecretSantaDrawParticipant } from '../../types/secretSanta';

interface DrawParticipantsPanelProps {
  participants: SecretSantaDrawParticipant[];
  showProfileLinks?: boolean;
}

export function DrawParticipantsPanel({
  participants,
  showProfileLinks = true,
}: DrawParticipantsPanelProps) {
  if (participants.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-arbey-600" strokeWidth={2} />
        <h2 className="font-display font-semibold text-arbey-900">Qui joue avec toi</h2>
      </div>
      <p className="mt-1 text-xs text-arbey-500">
        {participants.length} participant{participants.length > 1 ? 's' : ''} dans ce tirage
      </p>
      <ul className="mt-4 space-y-2">
        {participants.map((participant) => (
          <DrawParticipantItem
            key={participant.id}
            participant={participant}
            showProfileLink={showProfileLinks && Boolean(participant.member_id)}
          />
        ))}
      </ul>
    </div>
  );
}

function DrawParticipantItem({
  participant,
  showProfileLink,
}: {
  participant: SecretSantaDrawParticipant;
  showProfileLink: boolean;
}) {
  const bio = sanitizeMemberBio(participant.bio);
  const nameParts = participant.display_name.trim().split(/\s+/);
  const avatarMember = avatarPersonFromDisplayName(participant.display_name, participant.photo_url);

  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-cream-300/70 bg-white/70 px-3 py-3">
      <MemberAvatar member={avatarMember} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-800">
          {nameParts.length >= 2
            ? memberFullName({
                first_name: nameParts[0],
                last_name: nameParts.slice(1).join(' '),
              })
            : participant.display_name}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
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
        {bio && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">{bio}</p>
        )}
        {showProfileLink && (
          <p className="mt-2 text-xs font-medium text-warm-700">Voir le profil →</p>
        )}
      </div>
    </div>
  );

  if (showProfileLink && participant.member_id) {
    return (
      <li>
        <Link to={`/profil/${participant.member_id}`} className="focus-ring block rounded-xl">
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}
