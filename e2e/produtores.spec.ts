import { expect, test } from './_apoio/teste';
import { vigiarConsole } from './_apoio/console';

test.describe('página /produtores (§12)', () => {
  test('status 200, título, h1, texto, produtor e menu destacado', async ({ page }) => {
    const problemas = vigiarConsole(page);
    const resposta = await page.goto('/produtores');
    expect(resposta?.status()).toBe(200);
    await expect(page).toHaveTitle('Nossos produtores — Ateliê do Queijo');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Quem faz o queijo importa.' }),
    ).toBeVisible();
    await expect(page.getByText('Conhecemos cada produtor, provamos cada lote')).toBeVisible();
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(1);
    await expect(page.getByText('Serra da Canastra, MG')).toBeVisible();
    await expect(
      page
        .getByRole('banner')
        .getByRole('link', { name: 'Nossos produtores', exact: true })
        .first(),
    ).toHaveAttribute('aria-current', 'page');
    expect(problemas).toEqual([]);
  });

  test('o link do produtor leva ao queijo dele', async ({ page }) => {
    await page.goto('/produtores');
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Canastra curado', exact: true })
      .click();
    await expect(page).toHaveURL('/queijos/canastra-curado');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Canastra curado');
  });

  for (const rotulo of ['Sobre', 'Nossos produtores']) {
    test(`o link "${rotulo}" do rodapé leva a /produtores`, async ({ page }) => {
      await page.goto('/');
      await page
        .getByRole('navigation', { name: 'Rodapé' })
        .getByRole('link', { name: rotulo, exact: true })
        .click();
      await expect(page).toHaveURL('/produtores');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Quem faz o queijo importa.' }),
      ).toBeVisible();
    });
  }
});
