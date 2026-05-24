import dataSource from '../../src/database/data-source';
import { Candidate } from '../../src/entities/candidate.entity';
import { User } from '../../src/entities/user.entity';
import { Vote } from '../../src/entities/vote.entity';
import { ensureVotesUserCandidateUnique } from '../helpers/ensure-votes-unique-constraint';

const shouldRun = Boolean(process.env.DATABASE_URL);
const describeOrSkip = shouldRun ? describe : describe.skip;

describeOrSkip('Migrações e constraints de persistência (integração)', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) return;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await ensureVotesUserCandidateUnique(dataSource);
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

  it('T1.4a — constraint UQ_votes_user_candidate existe em votes', async () => {
    const rows: { conname: string }[] = await dataSource.query(
      `SELECT c.conname
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'votes'
         AND c.conname = 'UQ_votes_user_candidate'
         AND c.contype = 'u'`,
    );
    expect(rows).toHaveLength(1);
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
      criteriaScores: { scriptDevelopment: 8, creativity: 8, synchronism: 8, originalityAndMusicality: 8 },
    });

    await expect(
      votes.save({
        user,
        candidate,
        criteriaScores: { scriptDevelopment: 9, creativity: 9, synchronism: 9, originalityAndMusicality: 9 },
      }),
    ).rejects.toThrow();
  });

  it('T1.4b — INSERT com stubs user/candidate (caminho do voto) respeita UQ', async () => {
    const users = dataSource.getRepository(User);
    const candidates = dataSource.getRepository(Candidate);
    const votes = dataSource.getRepository(Vote);

    const suffix = Date.now();
    const user = await users.save({
      email: `t14b-u-${suffix}@voxscore.test`,
      displayName: 'Stub voter',
      role: 'PUBLIC',
      disabled: false,
    });
    const candidate = await candidates.save({
      name: 'Stub artist',
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

    const scores = {
      scriptDevelopment: 8,
      creativity: 8,
      synchronism: 8,
      originalityAndMusicality: 8,
    };

    await votes.save({
      user: { id: user.id } as User,
      candidate: { id: candidate.id } as Candidate,
      criteriaScores: scores,
    });

    await expect(
      votes.save({
        user: { id: user.id } as User,
        candidate: { id: candidate.id } as Candidate,
        criteriaScores: {
          scriptDevelopment: 9,
          creativity: 9,
          synchronism: 9,
          originalityAndMusicality: 9,
        },
      }),
    ).rejects.toThrow();
  });
});
