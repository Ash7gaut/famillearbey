import { useState } from 'react';
import type { SecretSantaAssignment } from '../../types/secretSanta';
import { isRevealStored, storeReveal } from '../../lib/secretSantaRevealStorage';
import { DrawParticipantsPanel } from './DrawParticipantsPanel';
import { LockedAssignment } from './LockedAssignment';
import { ReceiverWishlist } from './ReceiverWishlist';
import { RouletteWheel } from './RouletteWheel';

type Phase = 'ready' | 'spinning' | 'locked';

interface AssignmentRevealProps {
  assignment: SecretSantaAssignment;
  storageKey: string;
  onConfirmReveal: () => Promise<void>;
  /** Ex. `/secret-santa/<id>` ou `/secret-santa/invite/<token>` : sert à charger la liste de souhaits du tiré. */
  basePath: string;
}

function isAlreadyRevealed(assignment: SecretSantaAssignment, storageKey: string): boolean {
  return assignment.revealed === true || isRevealStored(storageKey);
}

export function AssignmentReveal({
  assignment,
  storageKey,
  onConfirmReveal,
  basePath,
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
      <div className="space-y-6" data-testid="assignment-locked">
        <LockedAssignment name={assignment.receiver_display_name} />
        <ReceiverWishlist basePath={basePath} receiverName={assignment.receiver_display_name} />
        <DrawParticipantsPanel participants={participants} />
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="space-y-6" data-testid="assignment-ready">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="page-title" data-testid="assignment-title">Ta roulette</h1>
            <p className="page-subtitle">
              Prêt ? La roue ne tourne qu&apos;une seule fois.
            </p>
          </div>
          <button type="button" onClick={() => setPhase('spinning')} className="btn-primary px-8" data-testid="assignment-spin-button">
            🎰 Lancer la roulette
          </button>
        </div>
        <DrawParticipantsPanel participants={participants} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="assignment-spinning">
      <RouletteWheel
        names={assignment.participant_names}
        targetName={assignment.receiver_display_name}
        onComplete={handleSpinComplete}
      />
      <DrawParticipantsPanel participants={participants} />
    </div>
  );
}
