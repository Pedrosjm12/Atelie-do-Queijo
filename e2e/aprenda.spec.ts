import { expect, test } from './_apoio/teste';
import { vigiarConsole } from './_apoio/console';

const ARTIGOS = [
  { slug: 'como-montar-uma-tabua-de-queijos', titulo: 'Como montar uma tábua de queijos' },
  { slug: 'queijo-e-vinho', titulo: 'Queijo e vinho: um guia sem regras chatas' },
  { slug: 'como-guardar-queijo-na-geladeira', titulo: 'Como guardar queijo na geladeira' },
];

const itemDoMenu = (page: import('@playwright/test').Page) =>
  page.getByRole('banner').getByRole('link', { name: 'Aprenda', exact: true }).first();

test.describe('página /aprenda (§12, §5.8)', () => {
  test('status 200, título, h1, parágrafo, quatro categorias e lacuna', async ({ page }) => {
    const problemas = vigiarConsole(page);
    const resposta = await page.goto('/aprenda');
    expect(resposta?.status()).toBe(200);
    await expect(page).toHaveTitle('Aprenda — Ateliê do Queijo');
    await expect(page.getByRole('heading', { level: 1, name: 'Escola do Ateliê' })).toBeVisible();
    await expect(page.getByText('O jeito certo de servir, guardar e harmonizar.')).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
      'Primeiros passos',
      'Harmonização',
      'Servir e guardar',
      'Regiões e produtores',
    ]);
    await expect(page.getByText('[A DEFINIR: artigos]')).toHaveCount(1);
    for (const { slug, titulo } of ARTIGOS) {
      await expect(page.getByRole('heading', { level: 3, name: titulo })).toBeVisible();
      await expect(page.locator(`main a[href="/aprenda/${slug}"]`)).toHaveCount(1);
    }
    await expect(itemDoMenu(page)).toHaveAttribute('aria-current', 'page');
    expect(problemas).toEqual([]);
  });
});

test.describe('artigos de /aprenda/<slug>', () => {
  for (const { slug, titulo } of ARTIGOS) {
    test(`${slug}: 200, h1, lacunas, trilha e Aprenda destacado`, async ({ page }) => {
      const problemas = vigiarConsole(page);
      const resposta = await page.goto(`/aprenda/${slug}`);
      expect(resposta?.status()).toBe(200);
      await expect(page).toHaveTitle(`${titulo} — Ateliê do Queijo`);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await expect(page.getByText('[TEXTO DO ARTIGO]')).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Queijos citados' })).toBeVisible();
      await expect(page.getByText('[A DEFINIR: queijos citados]')).toBeVisible();
      await expect(
        page.getByRole('navigation', { name: 'Você está em' }).locator('[aria-current="page"]'),
      ).toHaveText(titulo);
      await expect(itemDoMenu(page)).toHaveAttribute('aria-current', 'page');
      expect(problemas).toEqual([]);
    });

    test(`o cartão da Escola na Home leva a ${slug}`, async ({ page }) => {
      await page.goto('/');
      const link = page.locator(`main a[href="/aprenda/${slug}"]`);
      await expect(link).toHaveCount(1);
      await link.click();
      await expect(page).toHaveURL(`/aprenda/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo);
    });
  }

  test('o rodapé leva à Escola do Ateliê', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Rodapé' })
      .getByRole('link', { name: 'Escola do Ateliê' })
      .click();
    await expect(page).toHaveURL('/aprenda');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
