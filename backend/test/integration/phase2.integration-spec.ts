import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/common/user-role.enum';
import { User } from '../../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

async function bootstrapApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const application = moduleFixture.createNestApplication();
  application.setGlobalPrefix('api/v1');
  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await application.init();
  return application;
}

async function countAdmins(app: INestApplication): Promise<number> {
  const ds = app.get(DataSource);
  return ds.getRepository(User).count({ where: { role: UserRole.ADMIN } });
}

describeOrSkip('Fase 2 — seed e ADMIN (integração T2.1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapApp();
  });

  it('T2.1 — após bootstrap existe exatamente um utilizador ADMIN', async () => {
    expect(await countAdmins(app)).toBe(1);
  });

  it('T2.1 — segundo arranque da aplicação não cria ADMIN adicional', async () => {
    const before = await countAdmins(app);
    const app2 = await bootstrapApp();
    const after = await countAdmins(app2);
    expect(after).toBe(before);
    await app2.close();
  });

  afterAll(async () => {
    await app.close();
  });
});
