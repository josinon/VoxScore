/**
 * Teste de carga: POST /api/v1/candidates/:id/votes
 *
 * SCENARIO=unique  → per-vu-iterations: 1 POST por VU (recomendado)
 * SCENARIO=stress  → ramping-vus em loop (pressão HTTP)
 *
 * Config: BASE_URL, CANDIDATE_ID, TOKENS_FILE, MAX_VUS, SCENARIO
 *   CRITERIA_SET=megadance|legacy  (predef.: megadance — alinhado ao backend atual)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

function pick(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

function loadConfig() {
  const fromEnv = {
    baseUrl: __ENV.BASE_URL,
    candidateId: __ENV.CANDIDATE_ID,
    tokensFile: __ENV.TOKENS_FILE,
    scenario: __ENV.SCENARIO,
    maxVus: __ENV.MAX_VUS,
    criteriaSet: __ENV.CRITERIA_SET,
  };

  let fromFile = {};
  const configPath = __ENV.CONFIG_FILE || 'load-test.config.json';
  try {
    fromFile = JSON.parse(open(configPath));
  } catch {
    /* opcional */
  }

  const baseUrl = pick(
    fromEnv.baseUrl,
    fromFile.baseUrl,
    fromFile.BASE_URL,
    'http://localhost:3000',
  ).replace(/\/$/, '');
  const candidateId = pick(
    fromEnv.candidateId,
    fromFile.candidateId,
    fromFile.CANDIDATE_ID,
  );
  const tokensFile = pick(
    fromEnv.tokensFile,
    fromFile.tokensFile,
    fromFile.TOKENS_FILE,
    'tokens.json',
  );
  const scenario = pick(fromEnv.scenario, fromFile.scenario, 'unique').toLowerCase();
  const maxVusRaw = pick(fromEnv.maxVus, fromFile.maxVus, fromFile.MAX_VUS, '300');
  const maxVus = Math.max(1, parseInt(maxVusRaw, 10) || 300);

  if (!candidateId) {
    throw new Error(
      [
        'CANDIDATE_ID em falta.',
        'Use: k6 run --env-file=load-test.env votes-load.js',
      ].join('\n'),
    );
  }

  if (scenario !== 'unique' && scenario !== 'stress') {
    throw new Error('SCENARIO deve ser "unique" ou "stress".');
  }

  const criteriaSet = pick(
    fromEnv.criteriaSet,
    fromFile.criteriaSet,
    fromFile.CRITERIA_SET,
    'megadance',
  ).toLowerCase();

  return { baseUrl, candidateId, tokensFile, scenario, maxVus, criteriaSet };
}

/** Alinhado a backend/src/voting/voting.constants.ts */
const CRITERIA_PROFILES = {
  megadance: {
    scriptDevelopment: 8,
    creativity: 7.5,
    synchronism: 9,
    originalityAndMusicality: 8,
  },
  /** API em produção antes do deploy Megadance 2026 */
  legacy: {
    entertainment: 8,
    emotion: 7.5,
    likedTheMusic: 9,
    wouldListenAgain: 8,
  },
};

const cfg = loadConfig();
const tokens = JSON.parse(open(cfg.tokensFile));
if (!Array.isArray(tokens) || tokens.length === 0) {
  throw new Error(`${cfg.tokensFile} deve ser um array JSON de JWTs.`);
}

const maxVus = Math.min(cfg.maxVus, tokens.length);

const criteriaProfile = CRITERIA_PROFILES[cfg.criteriaSet];
if (!criteriaProfile) {
  throw new Error(
    `CRITERIA_SET="${cfg.criteriaSet}" inválido. Use: megadance | legacy`,
  );
}

const voteCreated = new Rate('vote_created');
const voteAcceptable = new Rate('vote_acceptable');
const voteLatency = new Trend('vote_latency_ms', true);
const status201 = new Counter('http_status_201');
const status400 = new Counter('http_status_400');
const status401 = new Counter('http_status_401');
const status403 = new Counter('http_status_403');
const status404 = new Counter('http_status_404');
const status409 = new Counter('http_status_409');
const status429 = new Counter('http_status_429');
const status0 = new Counter('http_status_0');
const status5xx = new Counter('http_status_5xx');
const statusOther = new Counter('http_status_other');

const criteriaBody = JSON.stringify({ criteriaScores: { ...criteriaProfile } });

const stressStages = [
  { duration: '20s', target: Math.min(50, maxVus) },
  { duration: '40s', target: Math.min(150, maxVus) },
  { duration: '40s', target: maxVus },
  { duration: '20s', target: 0 },
];

const httpParams = {
  headers: { 'Content-Type': 'application/json' },
  timeout: '60s',
  tags: { name: 'submit_vote' },
};

export const options = {
  scenarios:
    cfg.scenario === 'unique'
      ? {
          vote_unique: {
            executor: 'per-vu-iterations',
            vus: maxVus,
            iterations: 1,
            maxDuration: '5m',
            gracefulStop: '30s',
          },
        }
      : {
          vote_stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: stressStages,
            gracefulRampDown: '15s',
          },
        },
  thresholds:
    cfg.scenario === 'unique'
      ? {
          vote_created: ['rate>0.90'],
          http_req_duration: ['p(95)<3000'],
          http_status_5xx: ['count<50'],
          http_status_0: ['count<10'],
        }
      : {
          http_req_duration: ['p(95)<3000'],
          http_status_5xx: ['count<100'],
        },
};

function voteUrl() {
  return `${cfg.baseUrl}/api/v1/candidates/${cfg.candidateId}/votes`;
}

function submitVote(token) {
  return http.post(voteUrl(), criteriaBody, {
    ...httpParams,
    headers: {
      ...httpParams.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

function bodySnippet(body, maxLen = 400) {
  if (!body) return '(vazio)';
  const s = String(body).replace(/\s+/g, ' ').trim();
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

function explainStatus(status, body) {
  if (status === 201) return 'Voto criado.';
  if (status === 409) return 'Utilizador já votou neste candidato.';
  if (status === 401) return 'JWT inválido/expirado ou JWT_SECRET diferente do da API.';
  if (status === 403) return 'Votação fechada, user desativado ou ADMIN.';
  if (status === 404) return 'Candidato inexistente ou inativo.';
  if (status === 400) return `Validação: ${bodySnippet(body, 200)}`;
  if (status === 429) return 'Rate limit (THROTTLE_VOTES_*).';
  if (status === 0) return 'Sem resposta HTTP (timeout de rede, TLS, Ingress saturado).';
  if (status >= 500) return `Erro servidor: ${bodySnippet(body, 200)}`;
  return `HTTP ${status}: ${bodySnippet(body, 200)}`;
}

export function setup() {
  const health = http.get(`${cfg.baseUrl}/api/v1/health`, { timeout: '30s' });
  check(health, { 'health 200': (r) => r.status === 200 });

  if (maxVus < cfg.maxVus) {
    console.warn(
      `MAX_VUS=${cfg.maxVus} reduzido para ${maxVus} (só há ${tokens.length} tokens).`,
    );
  }

  const probe = submitVote(tokens[0]);
  const probeLine = `[probe] token[0] → HTTP ${probe.status} | ${explainStatus(probe.status, probe.body)}`;
  if (probe.error) {
    console.warn(`${probeLine} | k6 error: ${probe.error}`);
  } else {
    console.log(probeLine);
  }
  if (probe.status !== 201 && probe.status !== 409) {
    console.warn(`Corpo: ${bodySnippet(probe.body)}`);
  }

  if (cfg.scenario === 'unique') {
    console.log(
      `Cenário unique: ${maxVus} VUs × 1 iteração = até ${maxVus} POST (sem loop).`,
    );
  } else {
    console.warn('Cenário stress: loop contínuo — muitos 409 após o 1.º voto por utilizador.');
  }

  return {
    tokenCount: tokens.length,
    maxVus,
    scenario: cfg.scenario,
    probeStatus: probe.status,
    probeHint: explainStatus(probe.status, probe.body),
  };
}

function recordStatus(status) {
  if (status === 201) status201.add(1);
  else if (status === 400) status400.add(1);
  else if (status === 401) status401.add(1);
  else if (status === 403) status403.add(1);
  else if (status === 404) status404.add(1);
  else if (status === 409) status409.add(1);
  else if (status === 429) status429.add(1);
  else if (status === 0) status0.add(1);
  else if (status >= 500) status5xx.add(1);
  else statusOther.add(1);
}

export default function () {
  const tokenIndex = (__VU - 1) % tokens.length;
  const token = tokens[tokenIndex];
  const res = submitVote(token);

  voteLatency.add(res.timings.duration);
  recordStatus(res.status);

  const created = res.status === 201;
  const acceptable = created || res.status === 409;

  voteCreated.add(created ? 1 : 0);
  voteAcceptable.add(acceptable ? 1 : 0);

  check(res, {
    'voto criado (201)': (r) => r.status === 201,
    'auth válida (não 401)': (r) => r.status !== 401,
    'votação permitida (não 403)': (r) => r.status !== 403,
  });

  if (cfg.scenario === 'stress') {
    sleep(0.1 + Math.random() * 0.2);
  }
}

function counter(data, name) {
  return data.metrics[name]?.values?.count ?? 0;
}

export function handleSummary(data) {
  const createdRate = data.metrics.vote_created?.values?.rate ?? 0;
  const acceptableRate = data.metrics.vote_acceptable?.values?.rate ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const iterations = data.metrics.iterations?.values?.count ?? 0;
  const httpReqs = data.metrics.http_reqs?.values?.count ?? 0;

  const n201 = counter(data, 'http_status_201');
  const n400 = counter(data, 'http_status_400');
  const n401 = counter(data, 'http_status_401');
  const n403 = counter(data, 'http_status_403');
  const n404 = counter(data, 'http_status_404');
  const n409 = counter(data, 'http_status_409');
  const n429 = counter(data, 'http_status_429');
  const n0 = counter(data, 'http_status_0');
  const n5xx = counter(data, 'http_status_5xx');
  const nOther = counter(data, 'http_status_other');
  const total = n201 + n400 + n401 + n403 + n404 + n409 + n429 + n0 + n5xx + nOther;

  const testDurationSec = data.state?.testRunDurationMs
    ? data.state.testRunDurationMs / 1000
    : 0;
  const votesPerSec =
    testDurationSec > 0 ? (n201 / testDurationSec).toFixed(2) : '—';

  const iterWarning =
    cfg.scenario === 'unique' && iterations > maxVus * 2
      ? `⚠ iteracoes (${iterations}) >> VUs — algo errado no executor.`
      : null;

  const lines = [
    '',
    '=== VoxScore — resumo do teste de votos ===',
    `Cenário: ${cfg.scenario} (MAX_VUS=${maxVus}, tokens=${tokens.length}, critérios=${cfg.criteriaSet})`,
    `URL: ${cfg.baseUrl}`,
    `Candidato: ${cfg.candidateId}`,
    '',
    '--- Votos novos ---',
    `HTTP 201 Created: ${n201} (${total > 0 ? ((100 * n201) / total).toFixed(1) : 0}% dos POST)`,
    `Taxa vote_created: ${(createdRate * 100).toFixed(1)}%`,
    `Votos novos / s: ${votesPerSec}`,
    '',
    '--- Erros e conflitos ---',
    `0 sem resposta (rede/TLS/timeout): ${n0}`,
    `400 validação:        ${n400}`,
    `401 token:            ${n401}`,
    `403 votação/user:     ${n403}`,
    `404 candidato:        ${n404}`,
    `409 já votou:         ${n409}`,
    `429 rate limit:       ${n429}`,
    `5xx servidor:         ${n5xx}`,
    `outros HTTP:          ${nOther}`,
    '',
    '--- Execução k6 ---',
    `POST HTTP (http_reqs): ${httpReqs}`,
    `Iterações k6:         ${iterations}`,
    `Pedidos/s:            ${rps.toFixed(2)}`,
    `Latência p95:         ${p95.toFixed(0)} ms`,
    `Aceitável (201+409):  ${(acceptableRate * 100).toFixed(1)}%`,
    '',
    'Veja a linha [probe] no início do log — 1º token, mesma API.',
    '',
  ];

  if (iterWarning) {
    lines.push(iterWarning, '');
  }

  if (n0 > 0) {
    lines.push('- Muitos status 0: Ingress saturado, firewall ou máquina do k6 sem portas.');
  }
  if (n401 > 0) {
    lines.push('- 401: node prepare-tokens.mjs jwt com JWT_SECRET do cluster.');
  }
  if (n409 > 0 && n201 === 0) {
    lines.push('- Só 409: candidato novo ou DELETE votes + cleanup-load-test.sql.');
  }
  if (n400 > 0) {
    lines.push('- 400: corpo criteriaScores ou papel do user (PUBLIC vs JUDGE).');
  }
  lines.push('');

  return {
    stdout: lines.join('\n'),
    'results/summary.txt': lines.join('\n'),
  };
}
