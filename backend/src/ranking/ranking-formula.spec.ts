import { UserRole } from '../common/user-role.enum';
import {
  buildLeaderboard,
  RANKING_JUDGE_WEIGHT,
  RANKING_PUBLIC_WEIGHT,
  roundScore4,
} from './ranking-formula';

const allCriteria = (n: number) => ({
  scriptDevelopment: n,
  creativity: n,
  synchronism: n,
  originalityAndMusicality: n,
});

describe('ranking-formula (Fase 6)', () => {
  describe('T6.1 — fixture dourada 80/20', () => {
    it('N votos públicos e M jurados: score final = 0.8*j + 0.2*p', () => {
      const candidate = { id: 'c-golden', name: 'Golden' };
      const votes = [
        {
          candidateId: candidate.id,
          userRole: UserRole.JUDGE,
          criteriaScores: allCriteria(10),
        },
        {
          candidateId: candidate.id,
          userRole: UserRole.JUDGE,
          criteriaScores: allCriteria(4),
        },
        {
          candidateId: candidate.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(8),
        },
        {
          candidateId: candidate.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(8),
        },
        {
          candidateId: candidate.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(8),
        },
      ];

      const [row] = buildLeaderboard([candidate], votes);
      expect(row.judgeCompositeAverage).toBe(7);
      expect(row.publicCompositeAverage).toBe(8);
      const expected =
        RANKING_JUDGE_WEIGHT * 7 + RANKING_PUBLIC_WEIGHT * 8;
      expect(row.finalScore).toBe(roundScore4(expected));
      expect(row.finalScore).toBeCloseTo(7.2, 10);
    });
  });

  describe('T6.2 — candidato sem votos de um grupo', () => {
    it('só público: final = média do público (sem tratar jurados como zero)', () => {
      const c = { id: 'c-pub', name: 'A' };
      const votes = [
        {
          candidateId: c.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(6),
        },
        {
          candidateId: c.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(6),
        },
      ];
      const [row] = buildLeaderboard([c], votes);
      expect(row.judgeCompositeAverage).toBeNull();
      expect(row.publicCompositeAverage).toBe(6);
      expect(row.finalScore).toBe(6);
    });

    it('só jurados: final = média dos jurados', () => {
      const c = { id: 'c-judge', name: 'B' };
      const votes = [
        {
          candidateId: c.id,
          userRole: UserRole.JUDGE,
          criteriaScores: allCriteria(5),
        },
        {
          candidateId: c.id,
          userRole: UserRole.JUDGE,
          criteriaScores: allCriteria(5),
        },
      ];
      const [row] = buildLeaderboard([c], votes);
      expect(row.publicCompositeAverage).toBeNull();
      expect(row.judgeCompositeAverage).toBe(5);
      expect(row.finalScore).toBe(5);
    });

    it('sem votos: final = 0', () => {
      const c = { id: 'c-empty', name: 'C' };
      const [row] = buildLeaderboard([c], []);
      expect(row.finalScore).toBe(0);
      expect(row.judgeCompositeAverage).toBeNull();
      expect(row.publicCompositeAverage).toBeNull();
    });
  });

  describe('penalidade administrativa', () => {
    it('subtrai scorePenalty de computedScore no finalScore', () => {
      const c = { id: 'c-pen', name: 'Penalized', scorePenalty: 0.5 };
      const votes = [
        {
          candidateId: c.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(8),
        },
      ];
      const [row] = buildLeaderboard([c], votes);
      expect(row.computedScore).toBe(8);
      expect(row.scorePenalty).toBe(0.5);
      expect(row.finalScore).toBe(7.5);
    });

    it('finalScore não fica negativo', () => {
      const c = { id: 'c-floor', name: 'Floor', scorePenalty: 2 };
      const votes = [
        {
          candidateId: c.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(1),
        },
      ];
      const [row] = buildLeaderboard([c], votes);
      expect(row.computedScore).toBe(1);
      expect(row.finalScore).toBe(0);
    });

    it('penalidade altera ordem no pódio', () => {
      const a = { id: 'a', name: 'A', scorePenalty: 0.5 };
      const b = { id: 'b', name: 'B', scorePenalty: 0 };
      const votes = [
        {
          candidateId: a.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(9),
        },
        {
          candidateId: b.id,
          userRole: UserRole.PUBLIC,
          criteriaScores: allCriteria(8.6),
        },
      ];
      const rows = buildLeaderboard([a, b], votes);
      expect(rows[0].candidateId).toBe(b.id);
      expect(rows[1].candidateId).toBe(a.id);
    });
  });

  it('ordenação: maior score primeiro; empate no mesmo rank', () => {
    const a = { id: 'id-a', name: 'Zebra' };
    const b = { id: 'id-b', name: 'Anna' };
    const c = { id: 'id-c', name: 'Mio' };
    const votes = [
      {
        candidateId: a.id,
        userRole: UserRole.PUBLIC,
        criteriaScores: allCriteria(5),
      },
      {
        candidateId: b.id,
        userRole: UserRole.PUBLIC,
        criteriaScores: allCriteria(9),
      },
      {
        candidateId: c.id,
        userRole: UserRole.PUBLIC,
        criteriaScores: allCriteria(9),
      },
    ];
    const rows = buildLeaderboard([a, b, c], votes);
    expect(rows.map((r) => r.candidateId)).toEqual([b.id, c.id, a.id]);
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(1);
    expect(rows[2].rank).toBe(3);
  });
});
