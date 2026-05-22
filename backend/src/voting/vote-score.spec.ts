import {
  isValidVoteScore,
  VOTE_SCORE_MAX,
  VOTE_SCORE_MIN,
} from './vote-score';

describe('isValidVoteScore', () => {
  it('accepts 1 to 10 in steps of 0.5', () => {
    for (let v = VOTE_SCORE_MIN; v <= VOTE_SCORE_MAX; v += 0.5) {
      expect(isValidVoteScore(v)).toBe(true);
    }
  });

  it('rejects values outside range or wrong step', () => {
    expect(isValidVoteScore(0)).toBe(false);
    expect(isValidVoteScore(10.5)).toBe(false);
    expect(isValidVoteScore(7.3)).toBe(false);
    expect(isValidVoteScore(8.25)).toBe(false);
    expect(isValidVoteScore(Number.NaN)).toBe(false);
  });
});
