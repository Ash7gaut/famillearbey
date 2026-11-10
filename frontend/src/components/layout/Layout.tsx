import { NavLink, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Gift, Images, Users, TreePine, BrainCircuit } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { InstallPromptModal } from '../ui/InstallPromptModal';

const navItems: { to: string; label: string; icon: LucideIcon; testId: string }[] = [
  { to: '/groupes', label: 'Groupes', icon: Users, testId: 'groups' },
  { to: '/tree', label: 'Arbre', icon: TreePine, testId: 'tree' },
  { to: '/albums', label: 'Albums', icon: Images, testId: 'albums' },
  { to: '/calendrier', label: 'Calendrier', icon: Calendar, testId: 'calendar' },
  { to: '/quiz', label: 'Quiz', icon: BrainCircuit, testId: 'quiz' },
  { to: '/secret-santa', label: 'Santa', icon: Gift, testId: 'secret-santa' },
];

function NavItem({ to, label, icon: Icon, testId }: { to: string; label: string; icon: LucideIcon; testId: string }) {
  return (
    <NavLink
      to={to}
      data-testid={`nav-${testId}-link`}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen" data-testid="layout">
      {/* Sidebar desktop — fixe, toujours visible */}
      <aside data-testid="nav-sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-cream-300/60 bg-cream-50/95 backdrop-blur-md lg:flex">
        <div className="flex h-full flex-col px-4 py-6">
          <NavLink to="/groupes" data-testid="nav-logo-link" className="focus-ring mb-8 block shrink-0 rounded-xl px-2 py-1 focus-visible:ring-offset-cream-50">
            <p className="font-display text-xl font-semibold leading-tight text-ink-800">
              Famille Arbey
            </p>
            <p className="mt-0.5 text-xs text-ink-400">Notre coin à nous</p>
          </NavLink>

          <nav data-testid="nav-desktop" className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="mt-4 shrink-0 border-t border-cream-300/60 pt-4 space-y-1">
            <ThemeToggle variant="sidebar" />
            <UserMenu variant="sidebar" />
          </div>
        </div>
      </aside>

      {/* Contenu principal — décalé pour la sidebar sur desktop */}
      <div className="flex min-h-screen flex-col lg:ml-60">
        <header data-testid="mobile-header" className="pt-safe sticky top-0 z-30 border-b border-cream-300/60 bg-cream-50/90 backdrop-blur-md lg:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <NavLink to="/groupes" data-testid="mobile-logo-link" className="focus-ring min-w-0 rounded-lg px-1 py-0.5">
              <p className="truncate font-display text-lg font-semibold text-ink-800">Famille Arbey</p>
            </NavLink>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <UserMenu variant="header" />
            </div>
          </div>
        </header>

        <main data-testid="layout-main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pt-4 sm:px-6 sm:py-8 lg:py-10 lg:pt-10">
          <Outlet />
        </main>

        <nav data-testid="nav-mobile" className="sticky bottom-0 z-30 border-t border-cream-300/60 bg-cream-50/95 backdrop-blur-md lg:hidden">
          <div className="flex justify-around px-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-testid={`mobile-nav-${item.testId}-link`}
                  className={({ isActive }) =>
                    `focus-ring flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                      isActive ? 'text-warm-700' : 'text-ink-400'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
      <InstallPromptModal />
    </div>
  );
}
