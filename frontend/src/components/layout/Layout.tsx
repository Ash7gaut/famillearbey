import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/tree', label: 'Arbre', icon: '🌳' },
  { to: '/albums', label: 'Albums', icon: '📸' },
  { to: '/quiz', label: 'Quiz', icon: '🧠' },
];

export function Layout() {
  const { member, session, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-arbey-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-arbey-900">
                FamilyHub
              </p>
              <p className="text-xs text-arbey-500">Famille Arbey</p>
            </div>
          </NavLink>

          <div className="hidden sm:flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-arbey-100 text-arbey-800'
                      : 'text-arbey-600 hover:bg-arbey-50 hover:text-arbey-800'
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          {session && member ? (
            <div className="flex items-center gap-2">
              {member.is_admin && (
                <Link to="/admin" className="text-xs font-medium text-arbey-600 hover:text-arbey-800">
                  Admin
                </Link>
              )}
              <span className="text-xs text-arbey-500">{member.first_name}</span>
              <button type="button" onClick={() => logout()} className="text-xs text-arbey-500 hover:text-arbey-800">
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-arbey-700 hover:text-arbey-900">
              Connexion
            </Link>
          )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-arbey-100 bg-white/90 backdrop-blur-md sm:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                  isActive ? 'text-arbey-800 font-medium' : 'text-arbey-500'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
