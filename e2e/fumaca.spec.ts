import { expect, test } from '@playwright/test';

test.describe('fumaça', () => {
  test('home responde com lang pt-BR', async ({ page }) => {
    const resposta = await page.goto('/');
    expect(resposta?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { level: 1, name: 'Ateliê do Queijo' })).toBeVisible();
  });

  test('sem rolagem horizontal a 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const cabe = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(cabe).toBe(true);
  });
});
