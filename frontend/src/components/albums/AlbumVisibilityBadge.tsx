import { Lock, Users } from 'lucide-react';
import type { AlbumVisibility } from '../../types';

interface AlbumVisibilityBadgeProps {
  visibility: AlbumVisibility;
  className?: string;
}

export function AlbumVisibilityBadge({ visibility, className = '' }: AlbumVisibilityBadgeProps) {
  if (visibility === 'family') return null;

  return (
    <span
      data-testid="album-visibility-badge"
      className={`inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-medium text-warm-800 ${className}`}
    >
      <Lock className="h-3 w-3" strokeWidth={2} />
      Petite famille
    </span>
  );
}

export function AlbumVisibilityOption({
  value,
  selected,
  onChange,
}: {
  value: AlbumVisibility;
  selected: boolean;
  onChange: (value: AlbumVisibility) => void;
}) {
  const isFamily = value === 'family';

  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
        selected
          ? 'border-warm-400 bg-warm-50/80 ring-1 ring-warm-200'
          : 'border-cream-300 bg-cream-50 hover:border-cream-400'
      }`}
    >
      <input
        type="radio"
        name="album-visibility"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        data-testid={`album-visibility-option-${value}`}
        className="mt-1 accent-warm-600"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-800">
          {isFamily ? (
            <Users className="h-4 w-4 text-ink-500" strokeWidth={2} />
          ) : (
            <Lock className="h-4 w-4 text-warm-700" strokeWidth={2} />
          )}
          {isFamily ? 'Toute la famille' : 'Petite famille uniquement'}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-500">
          {isFamily
            ? 'Visible par tous les membres Arbey connectés.'
            : 'Visible par tes parents, frères et sœurs, conjoint(e) et enfants.'}
        </span>
      </span>
    </label>
  );
}
