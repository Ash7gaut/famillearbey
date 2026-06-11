interface LockedAssignmentProps {
  name: string;
}

export function LockedAssignment({ name }: LockedAssignmentProps) {
  return (
    <div className="card mx-auto max-w-sm py-12 text-center">
      <p className="mb-3 text-4xl" aria-hidden>
        🎁
      </p>
      <p className="text-sm font-medium uppercase tracking-wide text-arbey-500">
        Ton Secret Santa
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-arbey-900 sm:text-4xl">{name}</p>
      <p className="mt-6 text-sm text-arbey-500">Garde le secret jusqu&apos;au jour J 🤫</p>
    </div>
  );
}
