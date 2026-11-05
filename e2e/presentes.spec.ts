import { expect, test } from './_apoio/teste';
import type { Page } from '@playwright/test';
import { vigiarConsole } from './_apoio/console';

// Número fictício de `data/ficticio.ts` (sem variável de ambiente no e2e).
const NUMERO = '5520900000000';
const MENSAGEM = 'Olá! Quero um orçamento de presentes para empresa.';

const bloco = (page: Page) => page.locator('#presentes-corporativos');
const linkDoRodape = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Rodapé' })
    .getByRole('link', { name: 'Presentes corporativos' });

test.describe('página /presentes (§12, §5.7)', () => {
  test('status 200, título, h1, três kits sem botão, "Em todo kit" e console limpo', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    const resposta = await page.goto('/presentes');
    expect(resposta?.status()).toBe(200);
    await expect(page).toHaveTitle('Presentes — Ateliê do Queijo');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Para quem merece uma boa tábua.' }),
    ).toBeVisible();
    await expect(page.getByText('R$ [PREÇO]')).toHaveCount(3);
    for (const nome of ['Primeira Degustação', 'Volta ao Mundo', 'Grande Cave']) {
      await expect(page.getByRole('heading', { level: 2, name: nome })).toBeVisible();
    }
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Em todo kit' })).toBeVisible();
    await expect(page.getByText('Nota fiscal sem valor visível ao presenteado.')).toBeVisible();
    await expect(page.getByText('Pedidos a partir de [n] kits com personalização.')).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Presentes', exact: true }).first(),
    ).toHaveAttribute('aria-current', 'page');

    const repetidos = await page.locator('[id]').evaluateAll((els) => {
      const ids = els.map((e) => e.id);
      return ids.length - new Set(ids).size;
    });
    expect(repetidos).toBe(0);
    expect(problemas).toEqual([]);
  });

  test('Pedir orçamento: href decodificado, nova aba e nenhum número além do da loja', async ({
    page,
  }) => {
    await page.goto('/presentes');
    const link = page.getByRole('link', { name: 'Pedir orçamento' });
    await expect(link).toHaveCount(1);
    const href = (await link.getAttribute('href')) ?? '';
    expect(decodeURIComponent(href)).toBe(`https://wa.me/${NUMERO}?text=${MENSAGEM}`);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const todos = await page
      .locator('a[href*="wa.me"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    expect(todos.length).toBeGreaterThan(0);
    for (const h of todos) expect(h).toMatch(new RegExp(`^https://wa\\.me/${NUMERO}\\?text=`));
  });

  test('Pedir orçamento é o botão dourado, com alvo de toque de 44 px ou mais', async ({
    page,
  }) => {
    await page.goto('/presentes');
    const link = page.getByRole('link', { name: 'Pedir orçamento' });
    const medidas = await link.evaluate((el) => ({
      fundo: getComputedStyle(el).backgroundColor,
      altura: el.getBoundingClientRect().height,
    }));
    const ouro = await page.evaluate(() => {
      const amostra = document.createElement('i');
      amostra.style.backgroundColor = 'var(--ouro)';
      document.body.append(amostra);
      const cor = getComputedStyle(amostra).backgroundColor;
      amostra.remove();
      return cor;
    });
    expect(medidas.fundo).toBe(ouro);
    expect(medidas.altura).toBeGreaterThanOrEqual(44);
  });

  for (const largura of [320, 360, 390, 768, 1440, 1920]) {
    test(`sem rolagem horizontal a ${largura} px`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/presentes');
      const cabe = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(cabe).toBe(true);
    });
  }

  test('os links da Home levam à página: Ver todos os presentes e Montar um presente', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver todos os presentes →' }).click();
    await expect(page).toHaveURL('/presentes');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Para quem merece uma boa tábua.',
    );
    await page.goto('/');
    await page.getByRole('link', { name: 'Montar um presente' }).click();
    await expect(page).toHaveURL('/presentes');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('âncora Presentes corporativos (foco por teclado)', () => {
  test('vindo de outra rota, o rodapé deixa o foco no bloco corporativo', async ({ page }) => {
    await page.goto('/queijos');
    await linkDoRodape(page).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/presentes#presentes-corporativos');
    await expect(bloco(page)).toBeFocused();
  });

  test('já em /presentes, o rodapé também leva o foco ao bloco; Tab chega ao Pedir orçamento', async ({
    page,
  }) => {
    await page.goto('/presentes');
    await expect(bloco(page)).not.toBeFocused();
    await linkDoRodape(page).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/presentes#presentes-corporativos');
    await expect(bloco(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pedir orçamento' })).toBeFocused();
  });

  test('de novo em /presentes, com a URL já na âncora, o foco volta ao bloco', async ({ page }) => {
    await page.goto('/presentes#presentes-corporativos');
    await linkDoRodape(page).focus();
    await expect(bloco(page)).not.toBeFocused();
    await page.keyboard.press('Enter');
    await expect(bloco(page)).toBeFocused();
  });
});
