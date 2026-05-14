import type { Page } from '@playwright/test';

/**
 * Satisfaz pedidos que a shell de votação faz ao carregar (/votacao), para que
 * não passem pelo proxy Vite → :3000 (backend ausente nos e2e).
 */
export async function installMinimalVoterApiStubs(page: Page): Promise<void> {
  await page.route('**/api/v1/candidates', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({
        status: 405,
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/v1/ranking', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({
        status: 405,
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, entries: [] }),
    });
  });
}
