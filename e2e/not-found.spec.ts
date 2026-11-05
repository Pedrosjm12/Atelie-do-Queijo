import { expect, test } from '@playwright/test';

const TEXTO = 'Esta página foi maturar em outro lugar.';

for (const caminho of ['/nao-existe', '/queijos/nao-existe', '/aprenda/nao-existe']) {
  test.describe(`404 em ${caminho}`, () => {
    test('responde 404 com o texto da spec, noindex e título', async ({ page }) => {
      const resposta = await page.goto(caminho);
      expect(resposta?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1, name: TEXTO })).toBeVisible();
      await expect(page).toHaveTitle(`${TEXTO} — Ateliê do Queijo`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.getByText('could not be found')).toHaveCount(0);
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('Volta para a cave leva à Home', async ({ page }) => {
      await page.goto(caminho);
      await page.getByRole('link', { name: 'Volta para a cave' }).click();
      await expect(page).toHaveURL('/');
    });
  });
}
