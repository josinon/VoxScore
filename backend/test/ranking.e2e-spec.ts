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

describeOrSkip('Ranking (e2e) — Fase 6 (T6.3)', () => {
  let app: INestApplication;
  let server: Server;
  let publicToken: string;

  beforeAll(async () => {
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
    const publicEmail = `rank-pub-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicEmail,
      displayName: 'Ranking Public',
      role: UserRole.PUBLIC,
      disabled: false,
      photoUrl: null,
    });

    const pubRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicEmail })
      .expect(200);
    publicToken = (pubRes.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/ranking sem auth → 401', () => {
    return request(server).get('/api/v1/ranking').expect(401);
  });

  it('GET /api/v1/ranking com PUBLIC → 200 e contrato mínimo', async () => {
    const res = await request(server)
      .get('/api/v1/ranking')
      .set('Authorization', `Bearer ${publicToken}`)
      .expect(200);

    const body = res.body as {
      schemaVersion: number;
      entries: unknown[];
    };
    expect(body.schemaVersion).toBe(1);
    expect(Array.isArray(body.entries)).toBe(true);
  });
});
