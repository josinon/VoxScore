import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

describeOrSkip('Users / auth (e2e) — Fase 2 (T2.2, T2.3)', () => {
  let app: INestApplication<App>;
  let publicUserEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const ds = app.get(DataSource);
    publicUserEmail = `public-e2e-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicUserEmail,
      displayName: 'Public E2E',
      photoUrl: null,
      role: UserRole.PUBLIC,
      disabled: false,
    });
  });

  it('T2.3 — GET /users/me sem Authorization retorna 401', () => {
    return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('T2.2 — com JWT de PUBLIC, GET /users/me retorna role PUBLIC', async () => {
    const tokenRes = await request(app.getHttpServer())
      .post('/api/v1/auth/dev/token')
      .send({ email: publicUserEmail })
      .expect(200);

    const accessToken = (tokenRes.body as { accessToken?: string }).accessToken;
    expect(accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = me.body as { role?: string; email?: string };
    expect(body.role).toBe(UserRole.PUBLIC);
    expect(body.email).toBe(publicUserEmail);
  });

  afterAll(async () => {
    await app.close();
  });
});
