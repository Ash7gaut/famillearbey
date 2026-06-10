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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-arbey-100 to-warm-100 font-display text-xl font-semibold text-arbey-700">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.first_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              `${member.first_name[0]}${member.last_name[0]}`
            )}
          </div>
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

        {member.bio && (
          <p className="mt-4 text-sm leading-relaxed text-arbey-700">{member.bio}</p>
        )}

        <button type="button" onClick={onClose} className="btn-secondary mt-6 w-full">
          Fermer
        </button>
      </div>
    </div>
  );
}
