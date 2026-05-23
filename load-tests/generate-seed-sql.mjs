#!/usr/bin/env node
/**
 * Gera SQL + ficheiro de UUIDs para utilizadores PUBLIC de teste de carga.
 * Uso: node generate-seed-sql.mjs 500 > seed-load-users.sql
 *      (também grava user-ids.txt no diretório atual)
 */
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const count = Math.max(1, parseInt(process.argv[2] ?? '500', 10));
const runId = Date.now().toString(36);
const ids = [];

const lines = [
  '-- Utilizadores PUBLIC só para teste de carga. Apagar após o teste.',
  'BEGIN;',
];

for (let i = 0; i < count; i += 1) {
  const id = randomUUID();
  ids.push(id);
  const email = `load-${runId}-${i}@voxscore.loadtest`;
  lines.push(
    `INSERT INTO users (id, email, "displayName", "photoUrl", role, disabled, "createdAt", "updatedAt")`,
    `VALUES ('${id}', '${email}', 'Load test ${i}', NULL, 'PUBLIC', false, now(), now())`,
    `ON CONFLICT (email) DO NOTHING;`,
  );
}

lines.push('COMMIT;');

writeFileSync('user-ids.txt', `${ids.join('\n')}\n`);
process.stdout.write(`${lines.join('\n')}\n`);
