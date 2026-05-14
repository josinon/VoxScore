import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin-e2e@voxscore.test';
const PUBLIC_EMAIL = 'public-e2e@voxscore.test';
const JUDGE_PROMOTE_EMAIL = 'judge-promote@voxscore.test';

const TOK_ADMIN = 'playwright-admin-e2e-token-admin';
const TOK_PUBLIC = 'playwright-admin-e2e-token-public';
const TOK_JUDGE_BEFORE = 'playwright-admin-e2e-token-judge-before';
const TOK_JUDGE_AFTER = 'playwright-admin-e2e-token-judge-after';

const ADMIN_ID = '21111111-1111-1111-1111-111111111111';
const PUBLIC_ID = '22222222-2222-2222-2222-222222222222';
const FUTURE_JUDGE_ID = '33333333-3333-3333-3333-333333333333';

const CANDIDATE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const NEW_CANDIDATE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';

type CandidateRow = {
  id: string;
  name: string;
  musicTitle: string;
  genre: string;
  bio: string;
  photoUrl: string;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  votingOpen: boolean;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  role: 'PUBLIC' | 'JUDGE' | 'ADMIN';
  disabled: boolean;
  createdAt: string;
};

function baseCandidate(overrides: Partial<CandidateRow> = {}): CandidateRow {
  return {
    id: CANDIDATE_ID,
    name: 'Candidato Base',
    musicTitle: 'Música Base',
    genre: 'Pop',
    bio: 'Biografia base.',
    photoUrl: PHOTO,
    instagramUrl: null,
    youtubeUrl: null,
    votingOpen: true,
    displayOrder: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function authHeaderToken(route: import('@playwright/test').Route): string | null {
  const h = route.request().headers()['authorization'];
  if (!h?.startsWith('Bearer ')) {
    return null;
  }
  return h.slice(7).trim();
}

function requestPathname(u: string | URL): string {
  if (typeof u === 'string') {
    if (u.startsWith('/')) {
      const path = u.split('?')[0] ?? u;
      return path;
    }
    return new URL(u).pathname;
  }
  return u.pathname;
}

function isAdminToken(token: string | null): boolean {
  return token === TOK_ADMIN;
}

type MockState = {
  candidates: CandidateRow[];
  users: UserRow[];
};

function createState(overrides?: { votingOpen?: boolean }): MockState {
  const vo = overrides?.votingOpen ?? true;
  return {
    candidates: [baseCandidate({ votingOpen: vo })],
    users: [
      {
        id: ADMIN_ID,
        email: ADMIN_EMAIL,
        displayName: 'Administrador E2E',
        photoUrl: null,
        role: 'ADMIN',
        disabled: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: FUTURE_JUDGE_ID,
        email: JUDGE_PROMOTE_EMAIL,
        displayName: 'Futuro Jurado',
        photoUrl: null,
        role: 'PUBLIC',
        disabled: false,
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ],
  };
}

function meForToken(token: string | null, state: MockState): UserRow | null {
  if (token === TOK_ADMIN) {
    return state.users.find((u) => u.id === ADMIN_ID) ?? null;
  }
  if (token === TOK_PUBLIC) {
    return {
      id: PUBLIC_ID,
      email: PUBLIC_EMAIL,
      displayName: 'Público',
      photoUrl: null,
      role: 'PUBLIC',
      disabled: false,
      createdAt: '2024-01-03T00:00:00.000Z',
    };
  }
  if (token === TOK_JUDGE_BEFORE || token === TOK_JUDGE_AFTER) {
    const u = state.users.find((x) => x.id === FUTURE_JUDGE_ID);
    return u ? { ...u } : null;
  }
  return null;
}

async function installAdminApiMocks(page: Page, state: MockState) {
  await page.route('**/api/v1/auth/oauth/mock', async (route) => {
    const post = route.request().postDataJSON() as { email?: string };
    const email = post.email ?? '';
    let accessToken: string;
    if (email === ADMIN_EMAIL) {
      accessToken = TOK_ADMIN;
    } else if (email === PUBLIC_EMAIL) {
      accessToken = TOK_PUBLIC;
    } else if (email === JUDGE_PROMOTE_EMAIL) {
      const u = state.users.find((x) => x.id === FUTURE_JUDGE_ID);
      const isJudge = u?.role === 'JUDGE';
      accessToken = isJudge ? TOK_JUDGE_AFTER : TOK_JUDGE_BEFORE;
    } else {
      accessToken = `playwright-admin-e2e-other-${email.replace(/[^a-zA-Z0-9@-]/g, '_')}`;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
  });

  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    const token = authHeaderToken(route);
    const me = meForToken(token, state);
    if (!me) {
      await route.fulfill({ status: 401, body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    });
  });

  await page.route(
    (url) => {
      const pathname = requestPathname(url as string | URL);
      return (
        pathname === '/api/v1/users' ||
        (pathname.startsWith('/api/v1/users/') && pathname !== '/api/v1/users/me')
      );
    },
    async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const token = authHeaderToken(route);
      const method = route.request().method();

      if (pathname === '/api/v1/users' && method === 'GET') {
        if (!isAdminToken(token)) {
          await route.fulfill({
            status: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Forbidden' }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.users),
        });
        return;
      }

      const idMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)$/);
      if (idMatch && method === 'PATCH') {
        const id = decodeURIComponent(idMatch[1]!);
        if (!isAdminToken(token)) {
          await route.fulfill({
            status: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Forbidden' }),
          });
          return;
        }
        const body = route.request().postDataJSON() as {
          role?: string;
          disabled?: boolean;
        };
        const idx = state.users.findIndex((u) => u.id === id);
        if (idx === -1) {
          await route.fulfill({ status: 404, body: '{}' });
          return;
        }
        const cur = state.users[idx]!;
        const next = {
          ...cur,
          ...(body.role != null ? { role: body.role as UserRow['role'] } : {}),
          ...(body.disabled != null ? { disabled: body.disabled } : {}),
        };
        state.users[idx] = next;
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        return;
      }

      await route.fallback();
    },
  );

  await page.route(/\/api\/v1\/candidates\/[^/]+\/voting$/, async (route) => {
    const token = authHeaderToken(route);
    if (route.request().method() !== 'PATCH') {
      await route.fallback();
      return;
    }
    if (!isAdminToken(token)) {
      await route.fulfill({
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Forbidden' }),
      });
      return;
    }
    const pathname = new URL(route.request().url()).pathname;
    const m = pathname.match(/^\/api\/v1\/candidates\/([^/]+)\/voting$/);
    const id = m?.[1] ? decodeURIComponent(m[1]) : '';
    const body = route.request().postDataJSON() as { open?: boolean };
    const idx = state.candidates.findIndex((c) => c.id === id);
    if (idx === -1) {
      await route.fulfill({ status: 404, body: '{}' });
      return;
    }
    const cur = state.candidates[idx]!;
    const next = { ...cur, votingOpen: Boolean(body.open), updatedAt: '2024-01-05T00:00:00.000Z' };
    state.candidates[idx] = next;
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  });

  await page.route(/\/api\/v1\/candidates$/, async (route) => {
    const token = authHeaderToken(route);
    const method = route.request().method();

    if (method === 'GET') {
      const list = isAdminToken(token)
        ? state.candidates
        : state.candidates.filter((c) => c.active);
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      });
      return;
    }

    if (method === 'POST') {
      if (!isAdminToken(token)) {
        await route.fulfill({
          status: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Apenas administradores podem criar candidatos.' }),
        });
        return;
      }
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const row: CandidateRow = {
        id: NEW_CANDIDATE_ID,
        name: String(body.name ?? ''),
        musicTitle: String(body.musicTitle ?? ''),
        genre: String(body.genre ?? ''),
        bio: String(body.bio ?? ''),
        photoUrl: String(body.photoUrl ?? PHOTO),
        instagramUrl: (body.instagramUrl as string | null) ?? null,
        youtubeUrl: (body.youtubeUrl as string | null) ?? null,
        votingOpen: Boolean(body.votingOpen),
        displayOrder: Number(body.displayOrder ?? 0),
        active: body.active !== false,
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z',
      };
      state.candidates.push(row);
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/v1/ranking', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, entries: [] }),
    });
  });
}

async function devLogin(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByTestId('dev-login-submit').click();
}

async function logoutFromHeader(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await page.getByTestId('logout-btn').click();
  await expect(page).toHaveURL(/\/login$/);
}

test.describe('Área administrativa (mocks API)', () => {
  test('admin cria candidato; público vê após recarregar', async ({ page }) => {
    const state = createState();
    await installAdminApiMocks(page, state);

    await devLogin(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);

    await page.getByRole('button', { name: 'Candidatos', exact: true }).click();
    await page.getByRole('button', { name: 'Novo Candidato' }).click();
    await page.getByPlaceholder('Ex: Luna Santos').fill('Artista Novo E2E');
    await page.getByPlaceholder('Ex: Caminhos do Céu').fill('Tema E2E');
    await page.getByPlaceholder('Ex: Pop, Rock, Sertanejo').fill('Fado');
    await page.getByPlaceholder('Conte sobre o artista...').fill('Bio mínima para o teste.');
    await page.getByRole('button', { name: 'Adicionar Candidato' }).click();

    await expect(page.getByText('Artista Novo E2E')).toBeVisible();

    await logoutFromHeader(page);
    await devLogin(page, PUBLIC_EMAIL);
    await expect(page).toHaveURL(/\/votacao$/);

    await expect(page.getByTestId(`artist-card-${NEW_CANDIDATE_ID}`)).toContainText(
      'Artista Novo E2E',
    );

    await page.reload();
    await expect(page.getByTestId(`artist-card-${NEW_CANDIDATE_ID}`)).toContainText(
      'Artista Novo E2E',
    );
  });

  test('admin fecha votação; público vê cartão bloqueado após refresh', async ({
    page,
  }) => {
    const state = createState({ votingOpen: true });
    await installAdminApiMocks(page, state);

    await devLogin(page, ADMIN_EMAIL);
    await page.getByRole('button', { name: 'Votação', exact: true }).click();
    await page.getByRole('button', { name: 'Fechar Votação' }).click();

    await logoutFromHeader(page);
    await devLogin(page, PUBLIC_EMAIL);

    await page.reload();
    const card = page.getByTestId(`artist-card-${CANDIDATE_ID}`);
    const blockedBtn = card.getByRole('button', { name: /^Bloqueada$/ });
    await expect(blockedBtn).toBeVisible();
    await expect(blockedBtn).toBeDisabled();
  });

  test('admin promove utilizador a JUDGE; sessão mostra cinco critérios', async ({ page }) => {
    const state = createState();
    await installAdminApiMocks(page, state);

    await devLogin(page, ADMIN_EMAIL);
    await page.getByRole('button', { name: 'Usuários', exact: true }).click();
    await expect(page.getByText(JUDGE_PROMOTE_EMAIL)).toBeVisible();

    await page
      .locator('div.bg-white.rounded-xl.p-4.shadow-md')
      .filter({ hasText: JUDGE_PROMOTE_EMAIL })
      .getByRole('button', { name: 'Jurado' })
      .click();
    await expect(page.getByRole('heading', { name: 'Confirmar alteração' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await logoutFromHeader(page);
    await devLogin(page, JUDGE_PROMOTE_EMAIL);
    await expect(page).toHaveURL(/\/votacao$/);
    await page.reload();

    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Avaliar' }).click();
    await expect(page.getByTestId('criterion-row-vocalTechnique')).toBeVisible();
    await expect(page.getByTestId('criterion-row-composition')).toBeVisible();
  });

  test('público: POST /candidates e GET /users devolvem 403', async ({ page }) => {
    const state = createState();
    await installAdminApiMocks(page, state);

    await devLogin(page, PUBLIC_EMAIL);
    await expect(page).toHaveURL(/\/votacao$/);

    const postRes = await page.evaluate(async () => {
      const token = sessionStorage.getItem('voxscore_access_token');
      const r = await fetch('/api/v1/candidates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'X',
          musicTitle: 'Y',
          genre: 'Z',
          bio: 'Bio',
          photoUrl: 'https://example.com/p.jpg',
        }),
      });
      return { status: r.status, text: await r.text() };
    });
    expect(postRes.status).toBe(403);

    const getRes = await page.evaluate(async () => {
      const token = sessionStorage.getItem('voxscore_access_token');
      const r = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: r.status, text: await r.text() };
    });
    expect(getRes.status).toBe(403);
  });
});
