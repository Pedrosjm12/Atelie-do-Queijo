import { expect, test } from '@playwright/test';

const larguras = [360, 390, 768, 1440, 1920];

test.describe('componentes globais', () => {
  for (const largura of larguras) {
    test(`sem rolagem horizontal a ${largura} px`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/');
      const cabe = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(cabe).toBe(true);
    });
  }

  test('faixa de aviso com o texto exato da spec', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText(
        'Entrega refrigerada para todo o Brasil · Frete grátis acima de R$ 180 · 5% de desconto no Pix',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('"Pular para o conteúdo" é o primeiro item focável', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  });

  test('menu mobile abre e fecha só com o teclado a 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const botao = page.getByRole('button', { name: 'Menu' });
    await expect(botao).toBeVisible();
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeHidden();

    await botao.focus();
    await page.keyboard.press('Enter');
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveText([
      'Queijos',
      'Presentes',
      'Aprenda',
      'Nossos produtores',
    ]);

    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link', { name: 'Queijos' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();
    await expect(nav).toBeHidden();
  });

  test('desktop mostra o menu principal e esconde o botão Menu', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Sacola, 0 itens' })).toBeVisible();
  });

  test('cabeçalho só tem borda inferior fora da Home', async ({ page }) => {
    const larguraDaBorda = () =>
      page.locator('header').evaluate((el) => getComputedStyle(el).borderBottomWidth);

    await page.goto('/');
    expect(await larguraDaBorda()).toBe('0px');
    await page.goto('/queijos');
    expect(await larguraDaBorda()).toBe('1px');
  });

  test('botão flutuante tem 54 px a 390 px e 60 px no desktop', async ({ page }) => {
    const botao = page.getByRole('button', { name: 'Abrir atendimento' });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    expect((await botao.boundingBox())?.width).toBe(54);

    await page.setViewportSize({ width: 1440, height: 900 });
    expect((await botao.boundingBox())?.width).toBe(60);
  });

  // Pendente: /queijos ainda não existe (404 recarrega o documento). Ativar na etapa 3.
  test.fixme('navegar pelo menu mobile leva o foco para #conteudo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Queijos' })
      .click();
    await expect(page.locator('#conteudo')).toBeFocused();
  });
});
