import { test, expect, type Page } from '@playwright/test';

const meBody = (role: 'PUBLIC' | 'JUDGE' | 'ADMIN') =>
  JSON.stringify({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'tester@voxscore.test',
    displayName: 'Tester',
    photoUrl: null,
    role,
    disabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  });

async function installApiMocks(page: Page, role: 'PUBLIC' | 'JUDGE' | 'ADMIN') {
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
      body: meBody(role),
    });
  });
}

test.describe('Autenticação e rotas protegidas', () => {
  test('login chama /users/me e a UI mostra o papel do utilizador', async ({
    page,
  }) => {
    let meCalls = 0;
    await page.route('**/api/v1/auth/oauth/mock', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'playwright-test-token' }),
      });
    });
    await page.route('**/api/v1/users/me', async (route) => {
      meCalls += 1;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: meBody('PUBLIC'),
      });
    });

    await page.goto('/login');
    await page.getByTestId('dev-login-submit').click();
    await expect(page).toHaveURL(/\/votacao$/);
    expect(meCalls).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId('user-role')).toContainText('público');
  });

  test('utilizador PUBLIC é bloqueado em /admin', async ({ page }) => {
    await installApiMocks(page, 'PUBLIC');
    await page.goto('/login');
    await page.getByTestId('dev-login-submit').click();
    await expect(page).toHaveURL(/\/votacao$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/acesso-negado$/);
  });

  test('logout remove o token; área privada exige novo login', async ({
    page,
  }) => {
    await installApiMocks(page, 'PUBLIC');
    await page.goto('/login');
    await page.getByTestId('dev-login-submit').click();
    await expect(page).toHaveURL(/\/votacao$/);

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL(/\/login$/);

    const token = await page.evaluate(() =>
      sessionStorage.getItem('voxscore_access_token'),
    );
    expect(token).toBeNull();

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/votacao');
    await expect(page).toHaveURL(/\/login$/);
  });
});
