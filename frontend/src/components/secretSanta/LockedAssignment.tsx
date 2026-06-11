interface LockedAssignmentProps {
  name: string;
}

export function LockedAssignment({ name }: LockedAssignmentProps) {
  return (
    <div className="card mx-auto max-w-sm py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-warm-600">Ton Secret Santa</p>
      <p className="mt-4 font-display text-3xl font-semibold text-ink-800 sm:text-4xl">{name}</p>
      <p className="mt-6 text-sm text-ink-500">Garde le secret jusqu&apos;au jour J</p>
    </div>
  );
}
