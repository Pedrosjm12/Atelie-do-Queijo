import { expect, test } from '@playwright/test';
import { vigiarConsole } from './_apoio/console';

const CHAVE = 'atelie:sacola:v1';

test.describe('sacola salva', () => {
  test('sobrevive a recarregar e a abrir a página', async ({ page }) => {
    const problemas = vigiarConsole(page);
    const salva = JSON.stringify({
      v: 1,
      itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade: 2 }],
      presente: false,
    });
    await page.addInitScript(
      ([chave, valor]) => {
        if (!sessionStorage.getItem('semeado')) {
          localStorage.setItem(chave!, valor!);
          sessionStorage.setItem('semeado', '1');
        }
      },
      [CHAVE, salva],
    );
    await page.goto('/');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sacola 2 itens' }).first()).toBeVisible();
    expect(await page.evaluate((c) => localStorage.getItem(c), CHAVE)).toBe(salva);
    expect(problemas).toEqual([]);
  });

  const ruins = [
    [
      'constructor como slug',
      '{"v":1,"itens":[{"slug":"constructor","formatoId":"x","quantidade":1}]}',
    ],
    [
      '__proto__ como slug',
      '{"v":1,"itens":[{"slug":"__proto__","formatoId":"x","quantidade":1}]}',
    ],
    ['__proto__ como chave do item', '{"v":1,"itens":[{"__proto__":{"quantidade":9},"slug":"x"}]}'],
  ] as const;
  for (const [nome, ruim] of ruins) {
    test(`${nome} abre sem erro e com console limpo`, async ({ page }) => {
      const problemas = vigiarConsole(page);
      await page.addInitScript(
        ([chave, valor]) => localStorage.setItem(chave!, valor!),
        [CHAVE, ruim],
      );
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sacola 0 itens' }).first()).toBeVisible();
      expect(problemas).toEqual([]);
    });
  }

  test('duas abas: a segunda reflete a primeira', async ({ context }) => {
    const a = await context.newPage();
    const b = await context.newPage();
    await a.goto('/queijos');
    await b.goto('/queijos');
    await expect(b.getByRole('link', { name: 'Sacola 0 itens' }).first()).toBeVisible();
    await a.getByRole('button', { name: 'Adicionar Canastra curado à sacola' }).click();
    await expect(a.getByRole('link', { name: 'Sacola 1 item' }).first()).toBeVisible();
    await expect(b.getByRole('link', { name: 'Sacola 1 item' }).first()).toBeVisible();
  });
});
