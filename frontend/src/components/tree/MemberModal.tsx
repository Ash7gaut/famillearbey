import { Link } from 'react-router-dom';
import { MemberAvatar } from '../profile/MemberAvatar';
import { sanitizeMemberBio } from '../profile/memberUtils';
import type { FamilyMember } from '../../types';

interface MemberModalProps {
  member: FamilyMember;
  onClose: () => void;
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function MemberModal({ member, onClose }: MemberModalProps) {
  const bio = sanitizeMemberBio(member.bio);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-arbey-950/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <MemberAvatar member={member} size="xl" className="font-display" />
          <div>
            <h2 className="font-display text-xl font-semibold text-arbey-900">
              {member.first_name} {member.last_name}
            </h2>
            {member.birth_date && (
              <p className="text-sm text-arbey-500">
                Né(e) le {formatDate(member.birth_date)}
              </p>
            )}
          </div>
        </div>

        {bio && (
          <p className="mt-4 text-sm leading-relaxed text-arbey-700">{bio}</p>
        )}

        <div className="mt-6 flex gap-2">
          <Link
            to={`/profil/${member.id}`}
            onClick={onClose}
            className="btn-primary flex-1"
          >
            Voir le profil
          </Link>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
