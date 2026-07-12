import { useEffect, useMemo, useRef, useState } from 'react';
import type { FamilyMember } from '../../types';
import { MemberAvatar } from '../profile/MemberAvatar';

type SelectableMember = Pick<FamilyMember, 'id' | 'first_name' | 'last_name' | 'photo_url'>;

interface MemberSelectProps {
  members: SelectableMember[];
  /** id du membre sélectionné, ou '' si aucun */
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Tri alphabétique prénom puis nom (locale FR). */
function sortMembers(members: SelectableMember[]): SelectableMember[] {
  return [...members].sort(
    (a, b) =>
      a.first_name.localeCompare(b.first_name, 'fr') ||
      a.last_name.localeCompare(b.last_name, 'fr'),
  );
}

function fullName(m: SelectableMember): string {
  return `${m.first_name} ${m.last_name}`;
}

/**
 * Dropdown de membres recherchable, toujours triée alphabétiquement.
 * Contrôlée : `value` = id sélectionné, `onChange` reçoit le nouvel id ('' si effacé).
 */
export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = 'Choisir un membre…',
  disabled = false,
  id,
  className = '',
}: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortMembers(members), [members]);
  const selected = useMemo(() => sorted.find((m) => m.id === value) ?? null, [sorted, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => fullName(m).toLowerCase().includes(q));
  }, [sorted, query]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function choose(memberId: string) {
    onChange(memberId);
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = filtered[activeIndex];
      if (m) choose(m.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input-field flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected ? '' : 'text-ink-400'}`}>
          {selected && <MemberAvatar member={selected} size="sm" />}
          <span className="truncate">{selected ? fullName(selected) : placeholder}</span>
        </span>
        <span aria-hidden className="shrink-0 text-ink-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-cream-400 bg-cream-50 shadow-[0_8px_30px_-6px_rgba(44,36,25,0.15)]">
          <div className="border-b border-cream-300 p-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher…"
              className="w-full rounded-lg border border-cream-400 bg-cream-50 px-3 py-2.5 text-base text-ink-800 placeholder:text-ink-400 focus:border-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-100 sm:py-1.5 sm:text-sm"
            />
          </div>
          <ul role="listbox" className="max-h-[50vh] overflow-y-auto overscroll-contain py-1 sm:max-h-56">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => choose('')}
                  className="flex min-h-[44px] w-full items-center px-3 py-2 text-left text-sm text-ink-400 hover:bg-cream-200/60"
                >
                  Aucun
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-ink-400">Aucun membre trouvé.</li>
            ) : (
              filtered.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={m.id === value}
                    onClick={() => choose(m.id)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      i === activeIndex ? 'bg-cream-200/80' : ''
                    } ${m.id === value ? 'font-medium text-warm-800' : 'text-ink-800'}`}
                  >
                    <MemberAvatar member={m} size="sm" />
                    <span className="truncate">{fullName(m)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
