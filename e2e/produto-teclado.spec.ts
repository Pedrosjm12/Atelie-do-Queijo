import { expect, test, type Locator, type Page } from '@playwright/test';

const rota = '/queijos/canastra-curado';

/** Avança com Tab até o alvo receber o foco (no máximo `limite` passos). Devolve os passos dados. */
async function tabAte(page: Page, alvo: Locator, limite = 80): Promise<number> {
  for (let passo = 1; passo <= limite; passo++) {
    await page.keyboard.press('Tab');
    if (await alvo.evaluate((el) => el === document.activeElement)) return passo;
  }
  throw new Error(`O foco não chegou ao alvo em ${limite} Tabs`);
}

/** O rádio fica oculto; o indicador de foco aparece no `<label>` que o envolve. */
function rotuloDoFormato(page: Page, radio: Locator): Locator {
  return page.locator('label').filter({ has: radio });
}

/** O foco precisa de um indicador visível: contorno ou sombra de foco. */
async function temIndicadorDeFoco(alvo: Locator): Promise<boolean> {
  return alvo.evaluate((el) => {
    const css = getComputedStyle(el);
    const contorno = css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0;
    const sombra = css.boxShadow !== 'none';
    return contorno || sombra;
  });
}

test.describe('página de produto só com teclado', () => {
  test('1440 px: Tab percorre formatos, quantidade e Adicionar, com foco visível', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);

    const inteira = page.getByRole('radio', { name: /Peça inteira/ });
    const diminuir = page.getByRole('button', { name: 'Diminuir quantidade' });
    const aumentar = page.getByRole('button', { name: 'Aumentar quantidade' });
    const adicionar = page.getByRole('button', { name: 'Adicionar à sacola' }).first();

    await tabAte(page, inteira);
    expect(await temIndicadorDeFoco(rotuloDoFormato(page, inteira))).toBe(true);

    // Os formatos são rádios: um só Tab para o grupo; depois, quantidade e Adicionar.
    const alvos: [string, Locator][] = [
      ['diminuir', diminuir],
      ['aumentar', aumentar],
      ['adicionar', adicionar],
    ];
    for (const [nome, alvo] of alvos) {
      await page.keyboard.press('Tab');
      await expect(alvo, `Tab deveria chegar em ${nome}`).toBeFocused();
      expect(await temIndicadorDeFoco(alvo), `foco visível em ${nome}`).toBe(true);
    }
  });

  test('setas movem a seleção do formato e atualizam o preço', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const inteira = page.getByRole('radio', { name: /Peça inteira/ });
    const meia = page.getByRole('radio', { name: /Meia peça/ });
    const fracao = page.getByRole('radio', { name: /Fração/ });
    await tabAte(page, inteira);
    await expect(inteira).toBeChecked();

    await page.keyboard.press('ArrowRight');
    await expect(meia).toBeFocused();
    await expect(meia).toBeChecked();
    await expect(page.getByText('ou R$ 74,10 no Pix (5% off)')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(fracao).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(meia).toBeChecked();
    expect(await temIndicadorDeFoco(rotuloDoFormato(page, meia))).toBe(true);
  });

  test('390 px: o nome acessível do formato é curto e sem preço', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(rota);
    const grupo = page.getByRole('group', { name: 'FORMATO' });
    for (const radio of await grupo.getByRole('radio').all()) {
      const nome =
        (await radio.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.innerText)) ?? '';
      expect(nome).not.toContain('R$');
    }
  });

  test('ordem de Tab = ordem visual: queijista depois do frete a 1440 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const cep = page.getByLabel('Calcule o frete e o prazo');
    const queijista = page.getByRole('button', { name: 'Fale com um queijista' });
    await tabAte(page, cep);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Calcular' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(queijista).toBeFocused();
  });

  test('ordem de Tab = ordem visual: queijista antes do frete a 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(rota);
    const cep = page.getByLabel('Calcule o frete e o prazo');
    const queijista = page.getByRole('button', { name: 'Fale com um queijista' });
    await tabAte(page, queijista);
    await page.keyboard.press('Tab');
    await expect(cep).toBeFocused();
  });

  test('barra do 3D: um Tab entra, setas, Home e End movem o foco', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const barra = page.getByRole('toolbar', { name: 'Controles do 3D' });
    const botoes = barra.getByRole('button');
    await tabAte(page, botoes.first());
    await expect(botoes.first()).toHaveText('Girar');
    await page.keyboard.press('Tab');
    // Saiu da barra: só um botão entra na ordem de Tab.
    expect(await barra.evaluate((el) => el.contains(document.activeElement))).toBe(false);

    await botoes.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(botoes.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(botoes.last()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(botoes.first()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(botoes.first()).toBeFocused();
  });

  test('390 px: a barra do 3D é alcançável (Girar está oculto) e Ver por dentro alterna', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(rota);
    const barra = page.getByRole('toolbar', { name: 'Controles do 3D' });
    const corte = barra.getByRole('button', { name: 'Ver por dentro' });
    await expect(corte).toHaveAttribute('aria-pressed', 'true');
    await tabAte(page, corte);
    await page.keyboard.press('Enter');
    await expect(corte).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('PEÇA INTEIRA', { exact: true })).toBeVisible();
  });

  test('"−" com aria-disabled no mínimo mantém o foco e não baixa de 1', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const diminuir = page.getByRole('button', { name: 'Diminuir quantidade' });
    const aumentar = page.getByRole('button', { name: 'Aumentar quantidade' });
    const quantidade = page.getByRole('status', { name: 'Quantidade' });

    await expect(diminuir).toHaveAttribute('aria-disabled', 'true');
    await tabAte(page, diminuir);
    await page.keyboard.press('Enter');
    await expect(diminuir).toBeFocused();
    await expect(quantidade).toHaveText('1');

    await page.keyboard.press('Tab');
    await expect(aumentar).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(quantidade).toHaveText('2');
    await expect(diminuir).not.toHaveAttribute('aria-disabled', 'true');

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(quantidade).toHaveText('1');
    await expect(diminuir).toBeFocused();
    await expect(diminuir).toHaveAttribute('aria-disabled', 'true');
  });

  test('Tela cheia é focável, aria-disabled, descrita e não faz nada', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const telaCheia = page.getByRole('button', { name: 'Tela cheia' });
    await expect(telaCheia).toHaveAttribute('aria-disabled', 'true');
    await expect(telaCheia).toHaveAccessibleDescription('Tela cheia disponível em breve');
    await page.getByRole('button', { name: 'Girar' }).focus();
    await page.keyboard.press('End');
    await expect(telaCheia).toBeFocused();
    expect(await temIndicadorDeFoco(telaCheia)).toBe(true);
    await page.keyboard.press('Enter');
    await expect(telaCheia).toBeFocused();
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  });

  test('abas: setas, Home e End movem o foco com rotação e atualizam o painel', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const abas = page.getByRole('tab');
    expect(await abas.count()).toBeGreaterThan(1);
    const primeira = abas.first();
    const ultima = abas.last();

    await tabAte(page, primeira);
    await expect(primeira).toHaveAttribute('aria-selected', 'true');
    expect(await temIndicadorDeFoco(primeira)).toBe(true);

    await page.keyboard.press('ArrowRight');
    await expect(abas.nth(1)).toBeFocused();
    await expect(abas.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();

    await page.keyboard.press('End');
    await expect(ultima).toBeFocused();
    await expect(ultima).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(primeira).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(ultima).toBeFocused();

    await page.keyboard.press('Home');
    await expect(primeira).toBeFocused();
    await expect(primeira).toHaveAttribute('aria-selected', 'true');
  });

  test('390 px: ao navegar com Tab, o foco nunca fica sob a barra fixa', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(rota);
    await expect(page.locator('[data-barra-compra]')).toBeVisible();

    let fora = 0;
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('Tab');
      const dados = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const barra = document.querySelector('[data-barra-compra]');
        if (!el || el === document.body || !barra || barra.contains(el)) return null;
        const r = el.getBoundingClientRect();
        return {
          nome: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? '',
          base: r.bottom,
          topoBarra: barra.getBoundingClientRect().top,
        };
      });
      if (!dados) continue;
      fora++;
      expect(dados.base, `foco em "${dados.nome}" sob a barra fixa`).toBeLessThanOrEqual(
        dados.topoBarra + 1,
      );
    }
    expect(fora).toBeGreaterThan(10);
  });

  test('390 px: a barra fixa é alcançável por Tab e Adicionar tem foco visível', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(rota);
    const adicionar = page
      .locator('[data-barra-compra]')
      .getByRole('button', { name: 'Adicionar à sacola' });
    await tabAte(page, adicionar, 120);
    expect(await temIndicadorDeFoco(adicionar)).toBe(true);
    await expect(adicionar).not.toHaveAttribute('aria-disabled');
  });
});
