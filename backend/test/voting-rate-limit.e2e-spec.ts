import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

const publicScores = () => ({
  entertainment: 8,
  emotion: 7,
  likedTheMusic: 9,
  wouldListenAgain: 8,
});

describeOrSkip('Rate limit on votes (e2e) — T10.3', () => {
  let app: INestApplication;
  let server: Server;
  let publicToken: string;
  const candidateIds: string[] = [];
  let prevVotesLimit: string | undefined;

  beforeAll(async () => {
    prevVotesLimit = process.env.THROTTLE_VOTES_LIMIT;
    process.env.THROTTLE_VOTES_LIMIT = '2';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureNestWs(app);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;

    const ds = app.get(DataSource);
    const adminEmail =
      process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@voxscore.local';

    const ta = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: adminEmail })
      .expect(200);
    const adminToken = (ta.body as { accessToken: string }).accessToken;

    const publicEmail = `rate-vote-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicEmail,
      displayName: 'Rate voter',
      role: UserRole.PUBLIC,
      disabled: false,
      photoUrl: null,
    });

    const tp = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicEmail })
      .expect(200);
    publicToken = (tp.body as { accessToken: string }).accessToken;

    for (let i = 0; i < 3; i++) {
      const cr = await request(server)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `RateCand${i}`,
          musicTitle: 'S',
          genre: 'Pop',
          bio: 'B',
          photoUrl: 'https://example.com/p.jpg',
          instagramUrl: null,
          youtubeUrl: null,
          votingOpen: true,
          displayOrder: i,
          active: true,
        })
        .expect(201);
      candidateIds.push((cr.body as { id: string }).id);
    }
  });

  afterAll(async () => {
    if (prevVotesLimit === undefined) {
      delete process.env.THROTTLE_VOTES_LIMIT;
    } else {
      process.env.THROTTLE_VOTES_LIMIT = prevVotesLimit;
    }
    await app.close();
  });

  it('returns 429 after exceeding vote rate limit (same IP)', async () => {
    const [a, b, c] = candidateIds;
    expect(a && b && c).toBeTruthy();

    await request(server)
      .post(`/api/v1/candidates/${a}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(201);

    await request(server)
      .post(`/api/v1/candidates/${b}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(201);

    await request(server)
      .post(`/api/v1/candidates/${c}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(429);
  });
});
