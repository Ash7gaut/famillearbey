const MIN_PARTICIPANTS = 3;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Cycle aléatoire : chaque participant offre à exactement une personne. */
export function drawAssignments(
  participantIds: string[],
): { giverId: string; receiverId: string }[] {
  if (participantIds.length < MIN_PARTICIPANTS) {
    throw new Error(`Au moins ${MIN_PARTICIPANTS} participants requis`);
  }

  const shuffled = shuffle(participantIds);
  return shuffled.map((giverId, index) => ({
    giverId,
    receiverId: shuffled[(index + 1) % shuffled.length],
  }));
}

export const SECRET_SANTA_MIN_PARTICIPANTS = MIN_PARTICIPANTS;
