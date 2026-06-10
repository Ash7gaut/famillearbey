import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

export function UserMenu() {
  const { member, session, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!session || !member) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-arbey-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-arbey-900 active:scale-[0.98]"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Compte
          <svg
            className={`h-4 w-4 text-white/70 transition ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-arbey-100 bg-white py-1 shadow-lg"
          >
            <Link
              to="/login"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-arbey-900 transition hover:bg-arbey-50"
            >
              Connexion
            </Link>
            <Link
              to="/demande-acces"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-arbey-600 transition hover:bg-arbey-50"
            >
              Demander l'accès
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-arbey-950 py-1.5 pl-1.5 pr-3 text-sm font-medium text-white shadow-sm transition hover:bg-arbey-900 active:scale-[0.98]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
          {getInitials(member.first_name, member.last_name)}
        </span>
        <span className="max-w-[100px] truncate">{member.first_name}</span>
        <svg
          className={`h-4 w-4 text-white/70 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-arbey-100 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-arbey-50 px-4 py-3">
            <p className="font-medium text-arbey-900">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-arbey-500">Famille Arbey</p>
          </div>

          {member.is_admin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-arbey-700 transition hover:bg-arbey-50"
            >
              <span>⚙️</span> Administration
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <span>↪</span> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
