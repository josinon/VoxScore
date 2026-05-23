#!/usr/bin/env node
/**
 * Gera tokens.json para o k6.
 *
 * Modos:
 *   mock — POST /api/v1/auth/oauth/mock (homologação com AUTH_GOOGLE_MOCK_ENABLED=true)
 *   jwt  — assina JWT HS256 com JWT_SECRET para IDs em user-ids.txt (produção controlada)
 *
 * Exemplos:
 *   node prepare-tokens.mjs mock --base-url https://staging.example.com --count 500
 *   node prepare-tokens.mjs jwt --secret "$JWT_SECRET" --ids user-ids.txt
 */
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

function parseArgs(argv) {
  const mode = argv[2];
  if (mode !== 'mock' && mode !== 'jwt') {
    console.error(
      'Uso: node prepare-tokens.mjs <mock|jwt> [--base-url URL] [--count N] [--secret SECRET] [--ids ficheiro] [--out tokens.json]',
    );
    process.exit(1);
  }
  const opts = { mode, baseUrl: '', count: 500, secret: '', idsFile: 'user-ids.txt', out: 'tokens.json' };
  for (let i = 3; i < argv.length; i += 1) {
    const flag = argv[i];
    const val = argv[i + 1];
    if (flag === '--base-url' && val) {
      opts.baseUrl = val.replace(/\/$/, '');
      i += 1;
    } else if (flag === '--count' && val) {
      opts.count = Math.max(1, parseInt(val, 10));
      i += 1;
    } else if (flag === '--secret' && val) {
      opts.secret = val;
      i += 1;
    } else if (flag === '--ids' && val) {
      opts.idsFile = val;
      i += 1;
    } else if (flag === '--out' && val) {
      opts.out = val;
      i += 1;
    }
  }
  return opts;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(sub, secret, expiresSec = 86400) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({ sub, iat: now, exp: now + expiresSec }),
  );
  const data = `${header}.${payload}`;
  const sig = createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

async function tokensFromMock(baseUrl, count) {
  const tokens = [];
  const runId = Date.now().toString(36);
  for (let i = 0; i < count; i += 1) {
    const email = `load-${runId}-${i}@voxscore.loadtest`;
    const res = await fetch(`${baseUrl}/api/v1/auth/oauth/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName: `Load ${i}` }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`oauth/mock ${res.status} para ${email}: ${body}`);
    }
    const json = await res.json();
    if (!json.accessToken) {
      throw new Error(`Resposta sem accessToken para ${email}`);
    }
    tokens.push(json.accessToken);
    if ((i + 1) % 50 === 0) {
      console.error(`mock: ${i + 1}/${count} tokens`);
    }
  }
  return tokens;
}

function tokensFromJwt(secret, idsFile) {
  const raw = readFileSync(idsFile, 'utf8');
  const ids = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    throw new Error(`Sem IDs em ${idsFile}`);
  }
  return ids.map((sub) => signJwt(sub, secret));
}

const opts = parseArgs(process.argv);

(async () => {
  let tokens;
  if (opts.mode === 'mock') {
    if (!opts.baseUrl) {
      console.error('mock exige --base-url');
      process.exit(1);
    }
    tokens = await tokensFromMock(opts.baseUrl, opts.count);
  } else {
    if (!opts.secret) {
      console.error('jwt exige --secret (mesmo JWT_SECRET da API)');
      process.exit(1);
    }
    tokens = tokensFromJwt(opts.secret, opts.idsFile);
  }
  writeFileSync(opts.out, `${JSON.stringify(tokens, null, 2)}\n`);
  console.error(`Gravado ${tokens.length} tokens em ${opts.out}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
