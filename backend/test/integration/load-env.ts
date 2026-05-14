import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env'), quiet: true });

/** Valores mínimos para testes (e2e / integração) quando não existem em `.env`. */
process.env.JWT_SECRET ??=
  'test-jwt-secret-minimum-32-characters-long-for-jest!!';
process.env.AUTH_DEV_TOKEN_ENABLED ??= 'true';
process.env.AUTH_GOOGLE_MOCK_ENABLED ??= 'true';
