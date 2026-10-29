import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface ThemeToggleProps {
  variant?: 'icon' | 'sidebar';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-cream-200/80 hover:text-ink-800"
        aria-pressed={isDark}
        data-testid="theme-toggle-sidebar-button"
      >
        {isDark ? <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />}
        <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition hover:bg-cream-200/80 hover:text-ink-800"
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      aria-pressed={isDark}
      data-testid="theme-toggle-button"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
    </button>
  );
}
