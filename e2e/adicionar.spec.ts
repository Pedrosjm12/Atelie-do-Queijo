import { expect, test, type Locator, type Page } from '@playwright/test';
import { vigiarConsole } from './_apoio/console';

const CHAVE = 'atelie:sacola:v1';
const AVISO = 'Adicionado à sacola. Boa escolha.';
const LIMITE = 'Você já tem 10 unidades deste queijo na sacola.';

type SacolaSalva = {
  itens: { slug: string; formatoId: string; quantidade: number }[];
  presente: boolean;
};

async function sacolaSalva(page: Page): Promise<SacolaSalva> {
  const bruto = await page.evaluate((c) => localStorage.getItem(c), CHAVE);
  return JSON.parse(bruto ?? '{"itens":[],"presente":false}') as SacolaSalva;
}

const aviso = (page: Page) => page.locator('[data-aviso-da-sacola]');

async function semRolagemHorizontal(page: Page) {
  const largura = await page.evaluate(() => ({
    rolagem: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth,
  }));
  expect(largura.rolagem).toBeLessThanOrEqual(largura.janela);
}

async function caixa(alvo: Locator) {
  const c = await alvo.boundingBox();
  if (!c) throw new Error('sem caixa');
  return c;
}

function sobrepoe(a: { x: number; y: number; width: number; height: number }, b: typeof a) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe('Adicionar à sacola', () => {
  test('cartão do catálogo: contador, aviso, soma e persistência', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.goto('/queijos');
    await expect(page.getByRole('link', { name: 'Sacola 0 itens' })).toBeVisible();
    await expect(aviso(page)).toBeEmpty();

    const botao = page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' });
    await botao.click();
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();
    await expect(aviso(page)).toHaveText(AVISO);
    await expect(botao).toBeFocused();

    await botao.click();
    await expect(page.getByRole('link', { name: 'Sacola 2 itens' })).toBeVisible();
    // P24: o formato do menor preço (Fração), uma linha com quantidade 2.
    expect((await sacolaSalva(page)).itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 2 },
    ]);

    await page.reload();
    await expect(page.getByRole('link', { name: 'Sacola 2 itens' })).toBeVisible();
    await semRolagemHorizontal(page);
    expect(problemas).toEqual([]);
  });

  test('o aviso some em cerca de 4 s', async ({ page }) => {
    await page.goto('/queijos');
    await page.getByRole('button', { name: 'Adicionar Manchego DOP à sacola' }).click();
    await expect(aviso(page)).toHaveText(AVISO);
    await expect(aviso(page)).toBeEmpty({ timeout: 6000 });
  });

  test('cartão da Home e quiz adicionam o formato do menor preço', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.goto('/');
    const cave = page.locator('main > section:has(h2:text-is("Na cave esta semana"))');
    await cave
      .getByRole('button', { name: /^Adicionar / })
      .first()
      .click();
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();

    const quiz = page.locator('#quiz');
    await quiz.getByRole('button', { name: 'Suaves e amanteigados' }).click();
    await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
    await quiz.getByRole('button', { name: 'Presente' }).click();
    await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
    await quiz.getByRole('button', { name: 'Vinho branco ou espumante' }).click();
    await quiz.getByRole('button', { name: 'Ver meu queijo' }).click();
    await quiz.getByRole('button', { name: 'Adicionar à sacola' }).click();
    await expect(aviso(page)).toHaveText(AVISO);
    const { itens } = await sacolaSalva(page);
    expect(itens.reduce((n, i) => n + i.quantidade, 0)).toBe(2);
    expect(itens.some((i) => i.slug === 'brie-frances')).toBe(true);
    expect(problemas).toEqual([]);
  });

  test('limite de 10 unidades: mensagem do P25 e quantidade intacta', async ({ page }) => {
    await page.goto('/queijos');
    const botao = page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' });
    for (let i = 0; i < 10; i++) await botao.click();
    await expect(page.getByRole('link', { name: 'Sacola 10 itens' })).toBeVisible();
    await expect(aviso(page)).toHaveText(AVISO);
    await botao.click();
    await expect(aviso(page)).toHaveText(LIMITE);
    await expect(page.getByRole('link', { name: 'Sacola 10 itens' })).toBeVisible();
    expect((await sacolaSalva(page)).itens[0]?.quantidade).toBe(10);
  });

  test('produto: formato e quantidade escolhidos; + para em 10', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');
    await page
      .locator('label')
      .filter({ has: page.getByRole('radio', { name: /Meia peça/ }) })
      .click();
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await page.getByRole('button', { name: 'Adicionar à sacola' }).first().click();
    await expect(page.getByRole('link', { name: 'Sacola 2 itens' })).toBeVisible();
    expect((await sacolaSalva(page)).itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 },
    ]);

    const mais = page.getByRole('button', { name: 'Aumentar quantidade' });
    for (let i = 0; i < 8; i++) await mais.click();
    await expect(page.getByRole('group', { name: 'Quantidade' }).getByRole('status')).toHaveText(
      '10',
    );
    await expect(mais).toHaveAttribute('aria-disabled', 'true');
    expect(problemas).toEqual([]);
  });

  test('Embalar para presente adiciona e marca a sacola; recarregar mantém', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/brie-frances');
    const presente = page.getByRole('button', { name: /Embalar para presente/ });
    const nota = page.getByText('Pedido marcado como presente');
    await expect(nota).toHaveCount(0);
    await presente.click();
    await expect(nota).toBeVisible();
    await expect(aviso(page)).toHaveText(AVISO);
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();
    const salva = await sacolaSalva(page);
    expect(salva.presente).toBe(true);
    expect(salva.itens).toHaveLength(1);

    await page.reload();
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();
    await expect(page.getByText('Pedido marcado como presente')).toBeVisible();
  });

  test('390 px no produto: o aviso fica acima da barra fixa e sem tocar no FAB', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/queijos/canastra-curado');
    const barra = page.locator('[data-barra-compra]');
    await barra.getByRole('button', { name: 'Adicionar à sacola' }).click();
    await expect(aviso(page)).toHaveText(AVISO);
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();

    const caixaDoAviso = await caixa(aviso(page));
    const caixaDaBarra = await caixa(barra);
    const caixaDoFab = await caixa(page.getByRole('button', { name: 'Abrir atendimento' }));
    expect(sobrepoe(caixaDoAviso, caixaDaBarra)).toBe(false);
    expect(caixaDoAviso.y + caixaDoAviso.height).toBeLessThanOrEqual(caixaDaBarra.y);
    expect(sobrepoe(caixaDoAviso, caixaDoFab)).toBe(false);
    await semRolagemHorizontal(page);
    expect(problemas).toEqual([]);
  });

  test('390 px no catálogo: o aviso não toca no FAB', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/queijos');
    await page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' }).click();
    await expect(aviso(page)).toHaveText(AVISO);
    const caixaDoAviso = await caixa(aviso(page));
    const caixaDoFab = await caixa(page.getByRole('button', { name: 'Abrir atendimento' }));
    expect(sobrepoe(caixaDoAviso, caixaDoFab)).toBe(false);
    await semRolagemHorizontal(page);
  });

  test('1440 px: o aviso fica no canto inferior esquerdo, longe do FAB', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos');
    await page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' }).click();
    await expect(aviso(page)).toHaveText(AVISO);
    const c = await caixa(aviso(page));
    expect(c.x).toBeCloseTo(28, 0);
    expect(900 - (c.y + c.height)).toBeCloseTo(28, 0);
    const estilo = await aviso(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { fundo: s.backgroundColor, raio: s.borderRadius, tamanho: s.fontSize };
    });
    expect(estilo.raio).toBe('12px');
    expect(estilo.tamanho).toBe('14px');
    expect(sobrepoe(c, await caixa(page.getByRole('button', { name: 'Abrir atendimento' })))).toBe(
      false,
    );
  });
});
