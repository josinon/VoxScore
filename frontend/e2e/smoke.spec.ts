import { test, expect, type Page } from '@playwright/test';

/** T10.1 — smoke ponta a ponta com API mockada (README / demo). */

const ADMIN_EMAIL = 'smoke-admin@voxscore.test';
const PUBLIC_EMAIL = 'smoke-public@voxscore.test';
const TOK_ADMIN = 'smoke-playwright-token-admin';
const TOK_PUBLIC = 'smoke-playwright-token-public';
const ADMIN_ID = '51111111-1111-1111-1111-111111111111';
const CANDIDATE_ID = '5ccccccc-cccc-cccc-cccc-cccccccccccc';

const PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';

type SmokeState = { votingOpen: boolean };

function candidateRow(state: SmokeState) {
  return {
    id: CANDIDATE_ID,
    name: 'Artista Smoke',
    musicTitle: 'Tema Smoke',
    genre: 'Pop',
    bio: 'Bio smoke.',
    photoUrl: PHOTO,
    instagramUrl: null,
    youtubeUrl: null,
    votingOpen: state.votingOpen,
    displayOrder: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function authHeaderToken(route: import('@playwright/test').Route): string | null {
  const h = route.request().headers()['authorization'];
  if (!h?.startsWith('Bearer ')) {
    return null;
  }
  return h.slice(7).trim();
}

function isAdminToken(token: string | null): boolean {
  return token === TOK_ADMIN;
}

async function installSmokeApiMocks(page: Page, state: SmokeState) {
  await page.route('**/api/v1/auth/oauth/mock', async (route) => {
    const post = route.request().postDataJSON() as { email?: string };
    const email = post.email ?? '';
    const accessToken =
      email === ADMIN_EMAIL
        ? TOK_ADMIN
        : email === PUBLIC_EMAIL
          ? TOK_PUBLIC
          : `smoke-other-${email.replace(/[^a-zA-Z0-9@-]/g, '_')}`;
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
    if (token === TOK_ADMIN) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ADMIN_ID,
          email: ADMIN_EMAIL,
          displayName: 'Admin Smoke',
          photoUrl: null,
          role: 'ADMIN',
          disabled: false,
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });
      return;
    }
    if (token === TOK_PUBLIC) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '52222222-2222-2222-2222-222222222222',
          email: PUBLIC_EMAIL,
          displayName: 'Público Smoke',
          photoUrl: null,
          role: 'PUBLIC',
          disabled: false,
          createdAt: '2024-01-02T00:00:00.000Z',
        }),
      });
      return;
    }
    await route.fulfill({ status: 401, body: '{}' });
  });

  await page.route(
    (url) => new URL(url).pathname === `/api/v1/candidates/${CANDIDATE_ID}`,
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateRow(state)),
      });
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
    if (id !== CANDIDATE_ID) {
      await route.fulfill({ status: 404, body: '{}' });
      return;
    }
    const body = route.request().postDataJSON() as { open?: boolean };
    state.votingOpen = Boolean(body.open);
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateRow(state)),
    });
  });

  await page.route(
    (url) => new URL(url).pathname === '/api/v1/candidates',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([candidateRow(state)]),
      });
    },
  );

  await page.route(
    (url) =>
      new URL(url).pathname === `/api/v1/candidates/${CANDIDATE_ID}/votes`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '5ddddddd-dddd-dddd-dddd-dddddddddddd',
          candidateId: CANDIDATE_ID,
          criteriaScores: {},
          createdAt: '2024-01-03T00:00:00.000Z',
        }),
      });
    },
  );

  await page.route('**/api/v1/ranking', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            candidateId: CANDIDATE_ID,
            candidateName: 'Artista Smoke',
            rank: 1,
            finalScore: 8.5,
            judgeCompositeAverage: null,
            publicCompositeAverage: 8.5,
            judgeCriteriaAverages: null,
            publicCriteriaAverages: {
              entertainment: 8,
              emotion: 8,
              likedTheMusic: 9,
              wouldListenAgain: 9,
            },
          },
        ],
      }),
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

async function rateAllPublicCriteria(page: Page) {
  const ids = [
    'entertainment',
    'emotion',
    'likedTheMusic',
    'wouldListenAgain',
  ] as const;
  for (const id of ids) {
    await page
      .getByTestId(`criterion-row-${id}`)
      .locator('button')
      .nth(9)
      .click();
  }
}

test.describe('Smoke MVP (mocks API) — T10.1', () => {
  test('admin abre votação → público vota → ranking', async ({ page }) => {
    const state: SmokeState = { votingOpen: false };
    await installSmokeApiMocks(page, state);

    await devLogin(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole('button', { name: 'Votação', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir Votação' }).click();

    await logoutFromHeader(page);
    await devLogin(page, PUBLIC_EMAIL);
    await expect(page).toHaveURL(/\/votacao$/);

    await page
      .getByTestId(`artist-card-${CANDIDATE_ID}`)
      .getByRole('button', { name: 'Avaliar' })
      .click();
    await rateAllPublicCriteria(page);
    await page.getByRole('button', { name: 'Confirmar Avaliação' }).click();
    await expect(page.getByTestId('vote-confirmation')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar ao Início' }).click();
    await expect(page.getByTestId('vote-confirmation')).not.toBeVisible();

    await page.getByRole('button', { name: /^Ranking$/ }).click();
    await expect(page.getByRole('heading', { name: 'Ranking Geral' })).toBeVisible();
    await expect(page.getByText('Artista Smoke')).toBeVisible();
  });
});
