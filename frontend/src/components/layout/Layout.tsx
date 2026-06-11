import { NavLink, Outlet } from "react-router-dom";
import { UserMenu } from "./UserMenu";

const navItems = [
  { to: "/", label: "Accueil", icon: "🏠" },
  { to: "/tree", label: "Arbre", icon: "🌳" },
  { to: "/albums", label: "Albums", icon: "📸" },
  { to: "/quiz", label: "Quiz", icon: "🧠" },
  { to: "/secret-santa", label: "Santa", icon: "🎁" },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-arbey-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <span className="text-2xl">🌳</span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-arbey-900">
                FamilyHub
              </p>
              <p className="text-xs text-arbey-500">Famille Arbey</p>
            </div>
          </NavLink>

          <nav className="hidden sm:flex flex-1 items-center justify-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                // classname to uppercase
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-arbey-100 text-arbey-800"
                      : "text-arbey-600 hover:bg-arbey-50 hover:text-arbey-800"
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="shrink-0">
            <UserMenu />
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
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                  isActive ? "text-arbey-800 font-medium" : "text-arbey-500"
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
