import { test, expect, type Page } from '@playwright/test';
import {
  rateAllCriteria,
  setCriterionScore,
  VOTING_CRITERION_IDS,
} from './helpers/criteria-voting';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CANDIDATE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const meBody = () =>
  JSON.stringify({
    id: USER_ID,
    email: 'tester@voxscore.test',
    displayName: 'Tester',
    photoUrl: null,
    role: 'PUBLIC',
    disabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  });

function candidateListBody() {
  return JSON.stringify([
    {
      id: CANDIDATE_ID,
      name: 'Artista Playwright',
      musicTitle: 'Canção Teste',
      genre: 'Pop',
      bio: 'Biografia de teste.',
      photoUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      instagramUrl: null,
      youtubeUrl: null,
      votingOpen: true,
      displayOrder: 1,
      active: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]);
}

async function installAuthMocks(page: Page) {
  await page.route('**/api/v1/auth/oauth/mock', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'playwright-test-token' }),
    });
  });
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: meBody(),
    });
  });
}

async function installCandidatesMock(page: Page) {
  await page.route('**/api/v1/candidates', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: candidateListBody(),
    });
  });
}

async function loginAsPublic(page: Page) {
  await page.goto('/login');
  await page.getByTestId('dev-login-submit').click();
  await expect(page).toHaveURL(/\/votacao$/);
}

test.describe('Jornada do eleitor (API mock)', () => {
  test('permite nota com passo de 0,5 (ex.: 8,5)', async ({ page }) => {
    await installAuthMocks(page);
    await installCandidatesMock(page);
    await page.route(`**/api/v1/candidates/${CANDIDATE_ID}/votes`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      const body = route.request().postDataJSON() as {
        criteriaScores?: Record<string, number>;
      };
      expect(body.criteriaScores?.scriptDevelopment).toBe(8.5);
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          candidateId: CANDIDATE_ID,
          criteriaScores: body.criteriaScores ?? {},
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });
    });

    await loginAsPublic(page);
    await page
      .getByTestId(`artist-card-${CANDIDATE_ID}`)
      .getByRole('button', { name: 'Avaliar' })
      .click();

    await setCriterionScore(page, 'scriptDevelopment', 8.5);
    for (const id of VOTING_CRITERION_IDS) {
      if (id === 'scriptDevelopment') {
        continue;
      }
      await setCriterionScore(page, id, 10);
    }
    await page.getByRole('button', { name: 'Confirmar Avaliação' }).click();
    await expect(page.getByTestId('vote-confirmation')).toBeVisible();
  });

  test('lista, detalhe, voto e confirmação', async ({ page }) => {
    await installAuthMocks(page);
    await installCandidatesMock(page);
    await page.route(`**/api/v1/candidates/${CANDIDATE_ID}/votes`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          candidateId: CANDIDATE_ID,
          criteriaScores: {},
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });
    });

    await loginAsPublic(page);

    await expect(page.getByTestId(`artist-card-${CANDIDATE_ID}`)).toContainText(
      'Artista Playwright',
    );

    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Ver Detalhes' }).click();
    await expect(page.getByTestId('artist-details-modal')).toBeVisible();
    await expect(page.getByTestId('artist-details-modal')).toContainText(
      'Artista Playwright',
    );
    await page.getByTestId('close-artist-details').click();

    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Avaliar' }).click();
    await rateAllCriteria(page);
    await page.getByRole('button', { name: 'Confirmar Avaliação' }).click();

    await expect(page.getByTestId('vote-confirmation')).toBeVisible();
    await expect(page.getByTestId('vote-confirmation')).toContainText(
      'Artista Playwright',
    );
  });

  test('segundo envio de voto mostra mensagem de conflito', async ({ page }) => {
    let postCount = 0;
    await installAuthMocks(page);
    await installCandidatesMock(page);
    await page.route(`**/api/v1/candidates/${CANDIDATE_ID}/votes`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      postCount += 1;
      if (postCount === 1) {
        await route.fulfill({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            candidateId: CANDIDATE_ID,
            criteriaScores: {},
            createdAt: '2024-01-01T00:00:00.000Z',
          }),
        });
        return;
      }
      await route.fulfill({
        status: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Conflict',
        }),
      });
    });

    await loginAsPublic(page);
    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Avaliar' }).click();
    await rateAllCriteria(page);
    await page.getByRole('button', { name: 'Confirmar Avaliação' }).click();
    await expect(page.getByTestId('vote-confirmation')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar ao Início' }).click();

    await page.evaluate((uid) => {
      sessionStorage.removeItem(`voxscore_voted_candidates_${uid}`);
    }, USER_ID);
    await page.reload();
    await expect(page).toHaveURL(/\/votacao$/);

    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Avaliar' }).click();
    await rateAllCriteria(page);
    await page.getByRole('button', { name: 'Confirmar Avaliação' }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Você já votou neste candidato',
    );
  });

  test('ranking oculto mostra só contagem de avaliações', async ({ page }) => {
    await installAuthMocks(page);
    await installCandidatesMock(page);
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
          resultsPublished: false,
          votingMode: 'JUDGES_AND_PUBLIC',
          judgeWeightPercent: 80,
          publicWeightPercent: 20,
          entries: [
            {
              rank: 0,
              candidateId: CANDIDATE_ID,
              candidateName: 'Artista Playwright',
              voteCount: 7,
              judgeCompositeAverage: null,
              publicCompositeAverage: null,
              finalScore: null,
              judgeCriteriaAverages: null,
              publicCriteriaAverages: null,
            },
          ],
        }),
      });
    });

    await loginAsPublic(page);
    await page.getByTestId('open-ranking-btn').click();
    await expect(page.getByTestId('ranking-awaiting-results')).toBeVisible();
    await expect(page.getByTestId(`ranking-vote-count-${CANDIDATE_ID}`)).toHaveText(
      '7',
    );
    await expect(page.getByTestId(`ranking-row-${CANDIDATE_ID}`)).not.toContainText(
      'pontos',
    );
  });

  test('ranking mostra três entradas e atualiza ao reabrir', async ({ page }) => {
    const id1 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const id2 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const id3 = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

    let rankingGets = 0;
    const rankingFirst = {
      schemaVersion: 1 as const,
      resultsPublished: true,
      votingMode: 'JUDGES_AND_PUBLIC' as const,
      judgeWeightPercent: 80,
      publicWeightPercent: 20,
      entries: [
        {
          rank: 1,
          candidateId: id1,
          candidateName: 'Alice',
          voteCount: 5,
          judgeCompositeAverage: 8,
          publicCompositeAverage: 7,
          finalScore: 7.6,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
        {
          rank: 2,
          candidateId: id2,
          candidateName: 'Bob',
          voteCount: 3,
          judgeCompositeAverage: 7,
          publicCompositeAverage: 6,
          finalScore: 6.6,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
        {
          rank: 3,
          candidateId: id3,
          candidateName: 'Carol',
          voteCount: 2,
          judgeCompositeAverage: 6,
          publicCompositeAverage: 5,
          finalScore: 5.6,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
      ],
    };
    const rankingSecond = {
      schemaVersion: 1 as const,
      resultsPublished: true,
      votingMode: 'JUDGES_AND_PUBLIC' as const,
      judgeWeightPercent: 80,
      publicWeightPercent: 20,
      entries: [
        {
          rank: 1,
          candidateId: id3,
          candidateName: 'Carol',
          voteCount: 10,
          judgeCompositeAverage: 9,
          publicCompositeAverage: 9,
          finalScore: 9,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
        {
          rank: 2,
          candidateId: id1,
          candidateName: 'Alice',
          voteCount: 5,
          judgeCompositeAverage: 8,
          publicCompositeAverage: 7,
          finalScore: 7.6,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
        {
          rank: 3,
          candidateId: id2,
          candidateName: 'Bob',
          voteCount: 3,
          judgeCompositeAverage: 7,
          publicCompositeAverage: 6,
          finalScore: 6.6,
          judgeCriteriaAverages: null,
          publicCriteriaAverages: null,
        },
      ],
    };

    await installAuthMocks(page);
    await page.route('**/api/v1/candidates', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            id: id1,
            name: 'Alice',
            musicTitle: 'M1',
            genre: 'Pop',
            bio: 'Bio',
            photoUrl:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            instagramUrl: null,
            youtubeUrl: null,
            votingOpen: false,
            displayOrder: 1,
            active: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ]),
      });
    });
    await page.route('**/api/v1/ranking', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      rankingGets += 1;
      const payload = rankingGets === 1 ? rankingFirst : rankingSecond;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    await loginAsPublic(page);
    await page.getByTestId('open-ranking-btn').click();
    await expect(page.getByRole('heading', { name: 'Ranking Geral' })).toBeVisible();
    await expect(page.getByTestId(`ranking-row-${id1}`)).toContainText('Alice');
    await expect(page.getByTestId(`ranking-row-${id2}`)).toContainText('Bob');
    await expect(page.getByTestId(`ranking-row-${id3}`)).toContainText('Carol');

    await page.getByRole('button', { name: 'Fechar' }).click();
    await page.getByTestId('open-ranking-btn').click();

    await expect(page.locator('[data-testid^="ranking-row-"]').first()).toContainText(
      'Carol',
    );
  });

  test('viewport 375px: ecrã de critérios sem overflow horizontal crítico', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await installAuthMocks(page);
    await installCandidatesMock(page);
    await page.route(`**/api/v1/candidates/${CANDIDATE_ID}/votes`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          candidateId: CANDIDATE_ID,
          criteriaScores: {},
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });
    });

    await loginAsPublic(page);
    await page.getByTestId(`artist-card-${CANDIDATE_ID}`).getByRole('button', { name: 'Avaliar' }).click();
    await rateAllCriteria(page);

    const extraWidth = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(extraWidth).toBeLessThanOrEqual(12);
  });
});
