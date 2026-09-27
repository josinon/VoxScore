/** Modo de votação / cálculo do ranking do evento. */
export enum VotingMode {
  JUDGES_AND_PUBLIC = 'JUDGES_AND_PUBLIC',
  PUBLIC_ONLY = 'PUBLIC_ONLY',
  JUDGES_ONLY = 'JUDGES_ONLY',
}

export const VOTING_MODES = Object.values(VotingMode);

export function isVotingMode(value: unknown): value is VotingMode {
  return (
    typeof value === 'string' &&
    (VOTING_MODES as string[]).includes(value)
  );
}

/** Se o papel pode submeter votos neste modo. */
export function roleCanVoteInMode(role: string, mode: VotingMode): boolean {
  if (mode === VotingMode.PUBLIC_ONLY) {
    return role === 'PUBLIC';
  }
  if (mode === VotingMode.JUDGES_ONLY) {
    return role === 'JUDGE';
  }
  return role === 'PUBLIC' || role === 'JUDGE';
}
