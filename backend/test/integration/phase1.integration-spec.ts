import dataSource from '../../src/database/data-source';
import { Candidate } from '../../src/entities/candidate.entity';
import { User } from '../../src/entities/user.entity';
import { Vote } from '../../src/entities/vote.entity';

const shouldRun = Boolean(process.env.DATABASE_URL);
const describeOrSkip = shouldRun ? describe : describe.skip;

describeOrSkip('Fase 1 — persistência e constraints (integração)', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) return;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('T1.2 — segunda execução de migrations não aplica pendências', async () => {
    const first = await dataSource.runMigrations();
    const second = await dataSource.runMigrations();
    expect(Array.isArray(first)).toBe(true);
    expect(second.length).toBe(0);
  });

  it('T1.3 — email duplicado em users viola constraint', async () => {
    const users = dataSource.getRepository(User);
    const email = `t13-${Date.now()}@voxscore.test`;
    await users.save({
      email,
      displayName: 'A',
      role: 'PUBLIC',
      disabled: false,
    });
    await expect(
      users.save({
        email,
        displayName: 'B',
        role: 'PUBLIC',
        disabled: false,
      }),
    ).rejects.toThrow();
  });

  it('T1.4 — segundo voto mesmo (user, candidate) viola constraint', async () => {
    const users = dataSource.getRepository(User);
    const candidates = dataSource.getRepository(Candidate);
    const votes = dataSource.getRepository(Vote);

    const suffix = Date.now();
    const user = await users.save({
      email: `t14-u-${suffix}@voxscore.test`,
      displayName: 'Voter',
      role: 'PUBLIC',
      disabled: false,
    });
    const candidate = await candidates.save({
      name: 'Artist',
      musicTitle: 'Song',
      genre: 'Pop',
      bio: 'Bio',
      photoUrl: 'https://example.com/p.jpg',
      instagramUrl: null,
      youtubeUrl: null,
      votingOpen: true,
      displayOrder: 0,
      active: true,
    });

    await votes.save({
      user,
      candidate,
      criteriaScores: { entertainment: 8 },
    });

    await expect(
      votes.save({
        user,
        candidate,
        criteriaScores: { entertainment: 9 },
      }),
    ).rejects.toThrow();
  });
});
