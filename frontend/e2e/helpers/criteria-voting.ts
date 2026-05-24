import { expect, type Page } from '@playwright/test';

export const VOTING_CRITERION_IDS = [
  'scriptDevelopment',
  'creativity',
  'synchronism',
  'originalityAndMusicality',
] as const;

function formatScoreDisplay(score: number): string {
  return Number.isInteger(score)
    ? String(score)
    : score.toFixed(1).replace('.', ',');
}

/** Define nota via botões + visíveis (alinha com a UI actual do slider). */
export async function setCriterionScore(
  page: Page,
  criterionId: string,
  targetScore: number,
): Promise<void> {
  const row = page.getByTestId(`criterion-row-${criterionId}`);
  await row.scrollIntoViewIfNeeded();
  const increase = page.getByTestId(`score-increase-${criterionId}`);

  const stepsFromMin = Math.round((targetScore - 1) / 0.5);
  await increase.click();
  for (let i = 0; i < stepsFromMin; i++) {
    await increase.click();
  }
  await expect(row).toContainText(formatScoreDisplay(targetScore));
}

export async function rateAllCriteria(
  page: Page,
  score = 10,
): Promise<void> {
  for (const id of VOTING_CRITERION_IDS) {
    await setCriterionScore(page, id, score);
  }
}
