const key = (userId: string) => `voxscore_voted_candidates_${userId}`;

export function readVotedCandidateIds(userId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key(userId));
    if (!raw) {
      return new Set();
    }
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      return new Set();
    }
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export function persistVotedCandidateIds(userId: string, ids: Set<string>): void {
  try {
    sessionStorage.setItem(key(userId), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function addVotedCandidateId(userId: string, candidateId: string): void {
  const next = readVotedCandidateIds(userId);
  next.add(candidateId);
  persistVotedCandidateIds(userId, next);
}
