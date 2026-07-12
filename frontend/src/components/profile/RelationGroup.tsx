import { Link } from 'react-router-dom';
import type { FamilyMember } from '../../types';
import { MemberAvatar } from './MemberAvatar';
import { memberFullName } from './memberUtils';

interface RelationGroupProps {
  label: string;
  members: FamilyMember[];
}

export function RelationGroup({ label, members }: RelationGroupProps) {
  if (members.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {members.map((person) => (
          <li key={person.id}>
            <Link
              to={`/profil/${person.id}`}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:border-warm-200 hover:bg-warm-50"
            >
              <MemberAvatar member={person} size="sm" />
              {memberFullName(person)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
