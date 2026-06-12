import { useState } from 'react';
import type { SecretSantaAssignment } from '../../types/secretSanta';
import { isRevealStored, storeReveal } from '../../lib/secretSantaRevealStorage';
import { DrawParticipantsPanel } from './DrawParticipantsPanel';
import { LockedAssignment } from './LockedAssignment';
import { RouletteWheel } from './RouletteWheel';

type Phase = 'ready' | 'spinning' | 'locked';

interface AssignmentRevealProps {
  assignment: SecretSantaAssignment;
  storageKey: string;
  onConfirmReveal: () => Promise<void>;
  showProfileLinks?: boolean;
}

function isAlreadyRevealed(assignment: SecretSantaAssignment, storageKey: string): boolean {
  return assignment.revealed === true || isRevealStored(storageKey);
}

export function AssignmentReveal({
  assignment,
  storageKey,
  onConfirmReveal,
  showProfileLinks = true,
}: AssignmentRevealProps) {
  const [phase, setPhase] = useState<Phase>(() =>
    isAlreadyRevealed(assignment, storageKey) ? 'locked' : 'ready',
  );
  const participants = assignment.participants ?? [];

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
    return (
      <div className="space-y-6">
        <LockedAssignment name={assignment.receiver_display_name} />
        <DrawParticipantsPanel participants={participants} showProfileLinks={showProfileLinks} />
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="page-title">Ta roulette</h1>
            <p className="page-subtitle">
              Prêt ? La roue ne tourne qu&apos;une seule fois.
            </p>
          </div>
          <button type="button" onClick={() => setPhase('spinning')} className="btn-primary px-8">
            🎰 Lancer la roulette
          </button>
        </div>
        <DrawParticipantsPanel participants={participants} showProfileLinks={showProfileLinks} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RouletteWheel
        names={assignment.participant_names}
        targetName={assignment.receiver_display_name}
        onComplete={handleSpinComplete}
      />
      <DrawParticipantsPanel participants={participants} showProfileLinks={showProfileLinks} />
    </div>
  );
}
