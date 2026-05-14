import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureNestWs } from './configure-nest-ws';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

describeOrSkip('Health (e2e) — T1.1', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureNestWs(app);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('GET /api/v1/health retorna 200 quando o banco responde', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status?: string;
          info?: { database?: { status?: string } };
        };
        expect(body.status).toBe('ok');
        expect(body.info?.database?.status).toBe('up');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
