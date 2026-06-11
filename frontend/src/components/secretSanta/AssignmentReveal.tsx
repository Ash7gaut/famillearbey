import { useState } from 'react';
import type { SecretSantaAssignment } from '../../types/secretSanta';
import { isRevealStored, storeReveal } from '../../lib/secretSantaRevealStorage';
import { LockedAssignment } from './LockedAssignment';
import { RouletteWheel } from './RouletteWheel';

type Phase = 'ready' | 'spinning' | 'locked';

interface AssignmentRevealProps {
  assignment: SecretSantaAssignment;
  storageKey: string;
  onConfirmReveal: () => Promise<void>;
}

function isAlreadyRevealed(assignment: SecretSantaAssignment, storageKey: string): boolean {
  return assignment.revealed === true || isRevealStored(storageKey);
}

export function AssignmentReveal({ assignment, storageKey, onConfirmReveal }: AssignmentRevealProps) {
  const [phase, setPhase] = useState<Phase>(() =>
    isAlreadyRevealed(assignment, storageKey) ? 'locked' : 'ready',
  );

  async function handleSpinComplete() {
    storeReveal(storageKey);
    try {
      await onConfirmReveal();
    } catch {
      // localStorage garde le verrou même si l'API échoue (migration pas encore faite)
    }
    setPhase('locked');
  }

  if (phase === 'locked') {
    return <LockedAssignment name={assignment.receiver_display_name} />;
  }

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-arbey-900">Ta roulette</h1>
          <p className="mt-2 text-sm text-arbey-600">
            Prêt ? La roue ne tourne qu&apos;une seule fois.
          </p>
        </div>
        <button type="button" onClick={() => setPhase('spinning')} className="btn-primary px-8">
          🎰 Lancer la roulette
        </button>
      </div>
    );
  }

  return (
    <RouletteWheel
      names={assignment.participant_names}
      targetName={assignment.receiver_display_name}
      onComplete={handleSpinComplete}
    />
  );
}
