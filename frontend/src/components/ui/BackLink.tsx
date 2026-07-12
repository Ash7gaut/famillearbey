import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackLinkProps {
  to: string;
  label?: string;
}

export function BackLink({ to, label = 'Retour' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="focus-ring mb-4 inline-flex items-center gap-0.5 rounded-lg px-1 py-0.5 text-sm font-medium text-ink-500 no-underline transition hover:gap-1 hover:text-ink-800"
    >
      <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
      {label}
    </Link>
  );
}
