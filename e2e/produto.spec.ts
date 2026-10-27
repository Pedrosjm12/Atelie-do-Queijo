import { expect, test } from '@playwright/test';

const larguras = [360, 390, 768, 1440, 1920];
const rotas = ['/queijos/canastra-curado', '/queijos/brie-frances'];

test.describe('página de produto', () => {
  test('slug inexistente responde 404', async ({ page }) => {
    const resposta = await page.goto('/queijos/nao-existe');
    expect(resposta?.status()).toBe(404);
  });

  test('título, h1, trilha e textos do Canastra curado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');

    await expect(page).toHaveTitle('Canastra curado — Ateliê do Queijo');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Intenso, amanteigado, final picante.',
    );
    await expect(page.getByRole('heading', { level: 1, name: 'Canastra curado' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Você está em' })).toContainText(
      'Início/Queijos/Brasil/Canastra curado',
    );
    await expect(page.getByText('Queijaria [NOME DO PRODUTOR]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intensidade: 4 de 5' })).toBeVisible();
  });

  test('o formato muda o preço e o Pix; as abas respondem ao teclado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');

    await expect(page.getByText('ou R$ 129,20 no Pix (5% off)')).toBeVisible();
    await page
      .locator('label')
      .filter({ has: page.getByRole('radio', { name: /Meia peça/ }) })
      .click();
    await expect(page.getByText('ou R$ 74,10 no Pix (5% off)')).toBeVisible();

    await page.getByRole('tab', { name: 'A história' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Harmonização' })).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText('ACOMPANHAMENTOS');
  });

  test('queijo sem detalhe mostra as lacunas [A DEFINIR]', async ({ page }) => {
    await page.goto('/queijos/manchego');
    await expect(page.getByRole('heading', { level: 1, name: 'Manchego DOP' })).toBeVisible();
    await expect(page.getByText('[A DEFINIR]').first()).toBeVisible();
  });

  test('390 px: barra fixa no rodapé e botão de atendimento 100 px acima do fundo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/queijos/canastra-curado');

    const barra = page.locator('[data-barra-compra]');
    await expect(barra).toBeVisible();
    await expect(barra).toHaveCSS('position', 'fixed');
    await expect(barra).toContainText('R$');
    await expect(barra).toContainText('5% off no Pix');
    await expect(barra.getByRole('button', { name: 'Adicionar à sacola' })).toBeVisible();

    const caixaDaBarra = await barra.boundingBox();
    const fab = page.getByRole('button', { name: 'Abrir atendimento' });
    await expect(fab).toBeVisible();
    const caixaDoFab = await fab.boundingBox();
    if (!caixaDaBarra || !caixaDoFab) throw new Error('sem caixa');

    expect(caixaDaBarra.y + caixaDaBarra.height).toBeCloseTo(844, 0);
    expect(844 - (caixaDoFab.y + caixaDoFab.height)).toBeCloseTo(100, 0);
    expect(caixaDoFab.y + caixaDoFab.height).toBeLessThanOrEqual(caixaDaBarra.y);

    // O preço inline e a quantidade saem do fluxo no celular (P12).
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeHidden();
  });

  test('1440 px: sem barra fixa e FAB a 28 px do fundo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');
    await expect(page.locator('[data-barra-compra]')).toBeHidden();
    const caixa = await page.getByRole('button', { name: 'Abrir atendimento' }).boundingBox();
    if (!caixa) throw new Error('sem caixa');
    expect(900 - (caixa.y + caixa.height)).toBeCloseTo(28, 0);
  });

  test('390 px: a barra não cobre o rodapé ao fim da rolagem', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/queijos/canastra-curado');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const rodape = await page.locator('footer').boundingBox();
    const barra = await page.locator('[data-barra-compra]').boundingBox();
    if (!rodape || !barra) throw new Error('sem caixa');
    expect(rodape.y + rodape.height).toBeLessThanOrEqual(barra.y);
  });

  for (const largura of [390, 1440]) {
    test(`Aproximar alterna o zoom e não gera rolagem horizontal a ${largura} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/queijos/canastra-curado');
      const aproximar = page.getByRole('button', { name: 'Aproximar' });
      await expect(aproximar).toHaveAttribute('aria-pressed', 'false');

      await aproximar.click();
      await expect(aproximar).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(400); // fim da transição de 0,3 s
      const cabe = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(cabe).toBe(true);

      await aproximar.click();
      await expect(aproximar).toHaveAttribute('aria-pressed', 'false');
    });
  }

  test('1440 px: perfil sensorial ~487 px e abas ~657 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');
    const perfil = await page
      .locator('section[aria-labelledby="titulo-perfil-sensorial"]')
      .boundingBox();
    const abas = await page.getByRole('tablist', { name: 'Detalhes do queijo' }).boundingBox();
    if (!perfil || !abas) throw new Error('sem caixa');
    expect(perfil.width).toBeCloseTo(487, -1);
    expect(abas.width).toBeCloseTo(657, -1);
  });

  for (const largura of larguras) {
    test(`sem rolagem horizontal a ${largura} px`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      for (const rota of rotas) {
        await page.goto(rota);
        const cabe = await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        );
        expect(cabe, rota).toBe(true);
      }
    });
  }
});
