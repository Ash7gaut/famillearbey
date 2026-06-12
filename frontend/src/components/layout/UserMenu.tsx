import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, User, UserRound } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { MemberAvatar } from '../profile/MemberAvatar';

interface UserMenuProps {
  variant?: 'header' | 'sidebar' | 'floating';
}

const floatingTriggerGuest =
  'focus-ring inline-flex items-center gap-2 rounded-full bg-[#c66434] px-5 py-2.5 text-base font-semibold text-white shadow-[0_4px_16px_-2px_rgba(198,100,52,0.45)] ring-2 ring-white/80 transition hover:bg-[#a54f2d] active:scale-[0.98] focus-visible:ring-white/90 focus-visible:ring-offset-[#c66434]';

const floatingTriggerUser =
  'focus-ring inline-flex items-center gap-2.5 rounded-full border-2 border-[#f2d8bd] bg-white py-1.5 pl-1.5 pr-4 text-base font-semibold text-[#2C2419] shadow-[0_4px_20px_-4px_rgba(44,36,25,0.15)] ring-1 ring-white transition hover:border-[#de9860] hover:shadow-[0_6px_24px_-4px_rgba(44,36,25,0.2)] active:scale-[0.98]';

const menuItemClass =
  'focus-ring flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm transition focus-visible:ring-inset focus-visible:ring-offset-0';

export function UserMenu({ variant = 'header' }: UserMenuProps) {
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

  const isFloating = variant === 'floating';

  const isSidebar = variant === 'sidebar';

  const menuPositionClass = isSidebar
    ? 'bottom-full left-0 right-0 mb-2'
    : 'right-0 top-full mt-2';

  const sidebarTriggerGuest =
    'focus-ring flex w-full items-center gap-2 rounded-xl bg-[#c66434] px-4 py-2.5 text-base font-semibold text-white shadow-[0_4px_16px_-2px_rgba(198,100,52,0.35)] transition hover:bg-[#a54f2d] active:scale-[0.98] focus-visible:ring-white/90 focus-visible:ring-offset-[#c66434]';

  const triggerClassGuest = isFloating
    ? floatingTriggerGuest
    : isSidebar
      ? sidebarTriggerGuest
      : 'focus-ring inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5 text-sm font-medium text-cream-50 shadow-[0_4px_20px_-4px_rgba(44,36,25,0.2)] transition hover:bg-ink-700 focus-visible:ring-offset-ink-800';

  if (!session || !member) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={triggerClassGuest}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <UserRound className={isFloating || isSidebar ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.75} />
          <span className={isSidebar ? 'flex-1 text-left' : undefined}>Compte</span>
          <ChevronDown
            className={`${isFloating || isSidebar ? 'h-5 w-5' : 'h-4 w-4'} opacity-80 transition ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className={`absolute z-50 overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 py-1 shadow-[0_8px_30px_-6px_rgba(44,36,25,0.15)] ${isSidebar ? 'w-full' : 'w-52'} ${menuPositionClass}`}
          >
            <Link
              to="/login"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${menuItemClass} font-medium text-ink-800 hover:bg-cream-200/60`}
            >
              Connexion
            </Link>
            <Link
              to="/demande-acces"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${menuItemClass} text-ink-600 hover:bg-cream-200/60`}
            >
              Demander l'accès
            </Link>
          </div>
        )}
      </div>
    );
  }

  const sidebarTriggerUser =
    'focus-ring flex w-full items-center gap-2.5 rounded-xl border-2 border-[#f2d8bd] bg-white px-2 py-2 text-base font-semibold text-[#2C2419] shadow-[0_4px_16px_-4px_rgba(44,36,25,0.12)] transition hover:border-[#de9860] active:scale-[0.98]';

  const triggerClassUser = isFloating
    ? floatingTriggerUser
    : isSidebar
      ? sidebarTriggerUser
      : 'focus-ring inline-flex items-center gap-2 rounded-full bg-ink-800 py-1 pl-1 pr-2.5 text-sm font-medium text-cream-50 shadow-[0_4px_20px_-4px_rgba(44,36,25,0.2)] transition hover:bg-ink-700 focus-visible:ring-offset-ink-800';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassUser}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MemberAvatar
          member={member}
          size={isFloating || isSidebar ? 'lg' : 'xs'}
          className="ring-2 ring-white"
        />
        <span
          className={
            isSidebar || isFloating
              ? 'flex-1 truncate text-left'
              : 'max-w-[80px] truncate'
          }
        >
          {member.first_name}
        </span>
        <ChevronDown
          className={`shrink-0 opacity-60 transition ${isFloating || isSidebar ? 'h-5 w-5' : 'h-4 w-4'} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 py-1 shadow-[0_8px_30px_-6px_rgba(44,36,25,0.15)] ${isSidebar ? 'w-full' : 'w-56'} ${menuPositionClass}`}
        >
          <div className="flex items-center gap-3 border-b border-cream-300/60 px-4 py-3">
            <MemberAvatar member={member} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800">
                {member.first_name} {member.last_name}
              </p>
              <p className="text-xs text-ink-400">Membre de la famille</p>
            </div>
          </div>

          <Link
            to="/profil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`${menuItemClass} text-ink-700 hover:bg-cream-200/60`}
          >
            <User className="h-4 w-4" strokeWidth={1.75} />
            Mon profil
          </Link>

          {member.is_admin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${menuItemClass} text-ink-700 hover:bg-cream-200/60`}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Administration
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`${menuItemClass} text-red-600 hover:bg-red-50`}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
