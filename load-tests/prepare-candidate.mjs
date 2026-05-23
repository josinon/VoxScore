#!/usr/bin/env node
/**
 * Cria um candidato de teste e abre votação (ADMIN).
 * Grava o UUID em candidate-id.txt.
 *
 * Uso:
 *   ADMIN_TOKEN=eyJ... node prepare-candidate.mjs --base-url https://megadance.lab6.cloud
 */
import { writeFileSync } from 'node:fs';

function parseArgs(argv) {
  const opts = { baseUrl: '', out: 'candidate-id.txt', name: 'Load test candidate' };
  for (let i = 2; i < argv.length; i += 1) {
    const flag = argv[i];
    const val = argv[i + 1];
    if (flag === '--base-url' && val) {
      opts.baseUrl = val.replace(/\/$/, '');
      i += 1;
    } else if (flag === '--name' && val) {
      opts.name = val;
      i += 1;
    } else if (flag === '--out' && val) {
      opts.out = val;
      i += 1;
    }
  }
  return opts;
}

const adminToken = process.env.ADMIN_TOKEN?.trim();
if (!adminToken) {
  console.error('Defina ADMIN_TOKEN (JWT de um utilizador ADMIN).');
  process.exit(1);
}

const opts = parseArgs(process.argv);
if (!opts.baseUrl) {
  console.error('Uso: ADMIN_TOKEN=... node prepare-candidate.mjs --base-url https://...');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

const body = {
  name: opts.name,
  musicTitle: 'Load Test',
  genre: 'Test',
  bio: 'Candidato temporário para teste de carga. Remover após o teste.',
  photoUrl: 'https://example.com/load-test.jpg',
  instagramUrl: null,
  youtubeUrl: null,
  votingOpen: false,
  displayOrder: 9999,
  active: true,
};

const createRes = await fetch(`${opts.baseUrl}/api/v1/candidates`, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});

if (!createRes.ok) {
  console.error(await createRes.text());
  process.exit(1);
}

const candidate = await createRes.json();
const id = candidate.id;

const patchRes = await fetch(`${opts.baseUrl}/api/v1/candidates/${id}/voting`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ open: true }),
});

if (!patchRes.ok) {
  console.error(await patchRes.text());
  process.exit(1);
}

writeFileSync(opts.out, `${id}\n`);
console.error(`Candidato ${id} criado com votação aberta → ${opts.out}`);
