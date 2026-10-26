import { expect, test, type Page } from '@playwright/test';

const cartoes = (page: Page) => page.locator('main ul > li article');
const chip = (page: Page, nome: string) => page.getByRole('button', { name: nome });

test.describe('catálogo', () => {
  test('mostra título, textos da §6 e 10 cartões por padrão', async ({ page }) => {
    await page.goto('/queijos');
    await expect(page).toHaveTitle('Queijos — Ateliê do Queijo');
    await expect(page.getByText('CATÁLOGO DE LANÇAMENTO', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'A cave' })).toBeVisible();
    await expect(
      page.getByText(
        '10 queijos escolhidos um a um. Filtre por origem ou deixe o queijista sugerir.',
      ),
    ).toBeVisible();
    await expect(cartoes(page)).toHaveCount(10);
    await expect(chip(page, 'Todos (10)')).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Não sabe qual escolher?' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pedir ajuda' })).toBeVisible();
  });

  test('o filtro troca os cartões e a URL (10 / 7 / 3)', async ({ page }) => {
    await page.goto('/queijos');

    await chip(page, 'Brasil (7)').click();
    await expect(page).toHaveURL(/\/queijos\?origem=brasil$/);
    await expect(cartoes(page)).toHaveCount(7);
    await expect(chip(page, 'Brasil (7)')).toHaveAttribute('aria-pressed', 'true');

    await chip(page, 'Mundo (3)').click();
    await expect(page).toHaveURL(/\/queijos\?origem=mundo$/);
    await expect(cartoes(page)).toHaveCount(3);

    await chip(page, 'Todos (10)').click();
    await expect(page).toHaveURL(/\/queijos$/);
    await expect(cartoes(page)).toHaveCount(10);
  });

  test('a URL com ?origem= já chega filtrada; origem inválida vale Todos', async ({ page }) => {
    await page.goto('/queijos?origem=mundo');
    await expect(cartoes(page)).toHaveCount(3);
    await expect(chip(page, 'Mundo (3)')).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/queijos?origem=marte');
    await expect(cartoes(page)).toHaveCount(10);
    await expect(chip(page, 'Todos (10)')).toHaveAttribute('aria-pressed', 'true');
  });

  test('voltar e avançar do navegador mantêm o filtro coerente com a URL', async ({ page }) => {
    await page.goto('/queijos');
    // O chip usa replace: o filtro substitui a entrada do histórico. O goto cria a próxima entrada,
    // a que o Voltar e o Avançar percorrem.
    await chip(page, 'Brasil (7)').click();
    await expect(cartoes(page)).toHaveCount(7);
    await expect(chip(page, 'Brasil (7)')).toBeFocused();
    await page.goto('/queijos?origem=mundo');
    await expect(cartoes(page)).toHaveCount(3);

    await page.goBack();
    await expect(page).toHaveURL(/\/queijos\?origem=brasil$/);
    await expect(cartoes(page)).toHaveCount(7);
    await expect(chip(page, 'Brasil (7)')).toHaveAttribute('aria-pressed', 'true');

    await page.goForward();
    await expect(page).toHaveURL(/\/queijos\?origem=mundo$/);
    await expect(cartoes(page)).toHaveCount(3);
    await expect(chip(page, 'Mundo (3)')).toHaveAttribute('aria-pressed', 'true');
  });

  test('o nome do queijo leva a /queijos/[slug]', async ({ page }) => {
    await page.goto('/queijos');
    await expect(page.getByRole('link', { name: 'Canastra curado' })).toHaveAttribute(
      'href',
      '/queijos/canastra-curado',
    );
  });

  test('cabeçalho com borda e contêiner de x=120 a 1320 a 1440 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos');
    expect(
      await page.getByRole('banner').evaluate((el) => getComputedStyle(el).borderBottomWidth),
    ).toBe('1px');

    const titulo = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(titulo?.x).toBe(120);
    const grade = await page.locator('main ul').first().boundingBox();
    expect(grade?.x).toBe(120);
    expect((grade?.x ?? 0) + (grade?.width ?? 0)).toBe(1320);
  });
});
