import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { decode } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

describeOrSkip('Auth OAuth / JWT (e2e) — Fase 3 (T3.1–T3.3)', () => {
  let app: INestApplication<App>;

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
  });

  it('T3.1 — mock OAuth devolve JWT com sub coerente com GET /users/me', async () => {
    const email = `t31-oauth-${Date.now()}@voxscore.test`;
    const tokenRes = await request(app.getHttpServer())
      .post('/api/v1/auth/oauth/mock')
      .send({ email, displayName: 'OAuth Mock User' })
      .expect(200);

    const accessToken = (tokenRes.body as { accessToken?: string }).accessToken;
    expect(accessToken).toBeDefined();
    const payload = decode(accessToken) as { sub?: string };
    expect(payload.sub).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((me.body as { id?: string }).id).toBe(payload.sub);
    expect((me.body as { email?: string }).email).toBe(email);
  });

  it('T3.2 — primeiro login (mock) persiste utilizador com role PUBLIC', async () => {
    const email = `t32-oauth-${Date.now()}@voxscore.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/oauth/mock')
      .send({ email })
      .expect(200);

    const ds = app.get(DataSource);
    const row = await ds.getRepository(User).findOne({ where: { email } });
    expect(row).toBeDefined();
    expect(row!.role).toBe(UserRole.PUBLIC);
  });

  it('T3.3 — token inválido em rota protegida → 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
