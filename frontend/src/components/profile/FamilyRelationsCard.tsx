import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { MemberProfile } from '../../types';
import { MemberAvatar } from './MemberAvatar';
import { memberFullName, sanitizeMemberBio } from './memberUtils';
import { RelationGroup } from './RelationGroup';

interface FamilyRelationsCardProps {
  profile: MemberProfile;
  compact?: boolean;
}

export function FamilyRelationsCard({ profile, compact = false }: FamilyRelationsCardProps) {
  const { member } = profile;
  const bio = sanitizeMemberBio(member.bio);
  const hasRelations =
    profile.parents.length > 0 ||
    profile.spouses.length > 0 ||
    profile.children.length > 0 ||
    profile.siblings.length > 0;

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/profil/${member.id}`}
          className="focus-ring flex min-w-0 items-center gap-3 rounded-xl transition hover:opacity-90"
        >
          <MemberAvatar member={member} size={compact ? 'md' : 'lg'} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-ink-800">
              {memberFullName(member)}
            </h3>
            {bio && !compact && (
              <p className="mt-1 line-clamp-2 text-sm text-ink-500">{bio}</p>
            )}
          </div>
        </Link>
        <Link
          to={`/profil/${member.id}`}
          className="focus-ring shrink-0 rounded-lg p-1 text-ink-400 transition hover:bg-cream-200/60 hover:text-warm-700"
          title="Voir le profil"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {hasRelations ? (
        <div className={`space-y-4 ${compact ? 'mt-4' : 'mt-5'}`}>
          <RelationGroup label="Parents" members={profile.parents} />
          <RelationGroup label="Conjoint(e)s" members={profile.spouses} />
          <RelationGroup label="Enfants" members={profile.children} />
          <RelationGroup label="Frères et sœurs" members={profile.siblings} />
        </div>
      ) : (
        <p className="mt-4 text-sm italic text-ink-400">
          Aucun lien de parenté renseigné pour l&apos;instant.
        </p>
      )}
    </article>
  );
}
