import { expect, test, type Page } from '@playwright/test';
import { vigiarConsole } from './_apoio/console';

const VAZIA = 'Sua tábua ainda está vazia.';

/** Põe dois queijos na sacola pelos cartões do catálogo e abre /sacola pelo link do cabeçalho. */
async function abrirSacolaComDoisQueijos(page: Page) {
  await page.goto('/queijos');
  await page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' }).click();
  await page.getByRole('button', { name: 'Adicionar Brie francês à sacola' }).click();
  await expect(page.getByRole('link', { name: 'Sacola 2 itens' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Sacola 2 itens' }).first().click();
  await expect(page).toHaveURL(/\/sacola$/);
}

const subtotal = (page: Page) =>
  page
    .getByRole('region', { name: 'Resumo do pedido' })
    .getByText('Subtotal')
    .locator('xpath=following-sibling::span');

test.describe('página da sacola', () => {
  test('lista os dois queijos; + e − mudam o subtotal; Remover tira; vazia mostra o texto', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    await abrirSacolaComDoisQueijos(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Sua sacola' })).toBeVisible();
    const itens = page.getByRole('list', { name: 'Itens da sacola' }).getByRole('listitem');
    await expect(itens).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Canastra curado' })).toHaveAttribute(
      'href',
      '/queijos/canastra-curado',
    );
    await expect(page.getByRole('link', { name: 'Brie francês' })).toHaveAttribute(
      'href',
      '/queijos/brie-frances',
    );
    await expect(page.getByText(/Faltam R\$.* para o frete grátis\./)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute(
      'href',
      '/checkout',
    );
    await expect(page.getByText(VAZIA)).toHaveCount(0);

    const antes = (await subtotal(page).textContent()) ?? '';
    const canastra = itens.filter({ hasText: 'Canastra curado' });
    await canastra.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await expect(subtotal(page)).not.toHaveText(antes);
    await expect(page.getByRole('link', { name: 'Sacola 3 itens' }).first()).toBeVisible();
    await canastra.getByRole('button', { name: 'Diminuir quantidade' }).click();
    await expect(subtotal(page)).toHaveText(antes);

    await page.getByRole('button', { name: /^Remover Canastra curado/ }).click();
    await expect(itens).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Canastra curado' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Brie francês' })).toBeFocused();

    await page.getByRole('button', { name: /^Remover Brie francês/ }).click();
    await expect(page.getByText(VAZIA)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Sua sacola' })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );
    await expect(page.getByRole('link', { name: 'Sacola 0 itens' }).first()).toBeVisible();

    expect(problemas).toEqual([]);
  });

  test('a sacola vazia (primeira visita) mostra o texto e o link', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.goto('/queijos');
    await page.getByRole('link', { name: 'Sacola 0 itens' }).first().click();
    await expect(page).toHaveURL(/\/sacola$/);
    await expect(page.getByText(VAZIA)).toBeVisible();
    await page.getByRole('link', { name: 'Explorar a cave' }).click();
    await expect(page).toHaveURL(/\/queijos$/);
    expect(problemas).toEqual([]);
  });

  test('a sacola salva sobrevive a recarregar a página', async ({ page }) => {
    await abrirSacolaComDoisQueijos(page);
    await page.reload();
    await expect(page.getByRole('link', { name: 'Canastra curado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Brie francês' })).toBeVisible();
  });

  test('não é indexada (noindex)', async ({ page }) => {
    await page.goto('/sacola');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page).toHaveTitle('Sacola — Ateliê do Queijo');
  });

  for (const largura of [360, 390, 768, 1440, 1920]) {
    test(`sem rolagem horizontal a ${largura} px (vazia e com itens)`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      const cabe = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        );

      await page.goto('/sacola');
      await expect(page.getByText(VAZIA)).toBeVisible();
      expect(await cabe()).toBe(true);

      await abrirSacolaComDoisQueijos(page);
      await expect(page.getByRole('link', { name: 'Finalizar compra' })).toBeVisible();
      expect(await cabe()).toBe(true);
    });
  }
});
