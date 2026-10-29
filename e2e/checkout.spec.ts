import { expect, test } from '@playwright/test';
import {
  DADOS,
  CHAVE_DA_SACOLA,
  campo,
  preencherComTeclado,
  semearSacola,
  tabAte,
} from './_apoio/checkout';
import { vigiarConsole } from './_apoio/console';

test.describe('checkout, etapa 1 (Entrega)', () => {
  test('só com teclado: da /sacola até a etapa 2, com o foco no título', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await semearSacola(page);
    await page.goto('/sacola');
    await expect(page.getByRole('link', { name: 'Finalizar compra' })).toBeVisible();

    await tabAte(page, page.getByRole('link', { name: 'Finalizar compra' }));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Entrega' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: '1. Entrega' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await expect(
      page.getByText(
        'Enviamos de segunda a quarta, para que seu queijo nunca passe o fim de semana em trânsito.',
      ),
    ).toBeVisible();

    await preencherComTeclado(page);
    await expect(campo(page, 'CEP')).toHaveValue('01310-100');
    await expect(campo(page, 'Telefone')).toHaveValue('(11) 91234-5678');
    await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
    await tabAte(page, page.getByRole('button', { name: 'Continuar para o pagamento' }));
    await page.keyboard.press('Enter');

    const titulo = page.getByRole('heading', { level: 2, name: 'Pagamento' });
    await expect(titulo).toBeFocused();
    await expect(page.getByRole('listitem').filter({ hasText: '2. Pagamento' })).toHaveAttribute(
      'aria-current',
      'step',
    );

    // Voltar mantém os dados.
    await page.getByRole('button', { name: 'Voltar para a entrega' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Entrega' })).toBeFocused();
    await expect(campo(page, 'Nome completo')).toHaveValue(DADOS.nome);
    await expect(campo(page, 'E-mail')).toHaveValue(DADOS.email);
    await expect(campo(page, 'Estado')).toHaveValue('SP');
    expect(problemas).toEqual([]);
  });

  test('nenhum dado pessoal vai para a URL, localStorage, sessionStorage ou cookies', async ({
    page,
    context,
  }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { level: 2, name: 'Entrega' })).toBeVisible();
    await preencherComTeclado(page);
    await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();

    // Enter dentro de um campo envia o formulário: nada pode ir para a barra de endereço.
    await campo(page, 'Número').press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();

    expect(new URL(page.url()).search).toBe('');
    const guardado = await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, sessao: { ...sessionStorage } }),
    );
    const cookies = JSON.stringify(await context.cookies());
    for (const valor of [
      DADOS.nome,
      'Souza',
      DADOS.email,
      DADOS.telefone,
      '01310',
      DADOS.logradouro,
      DADOS.numero,
      DADOS.bairro,
    ]) {
      expect(page.url()).not.toContain(encodeURIComponent(valor));
      expect(guardado).not.toContain(valor);
      expect(cookies).not.toContain(valor);
    }
    // A sacola continua sendo a única coisa salva.
    expect(Object.keys(JSON.parse(guardado).local)).toEqual([CHAVE_DA_SACOLA]);
    expect(JSON.parse(guardado).sessao).toEqual({});
  });

  test('envio vazio mostra o resumo de erros focado, com links para os campos', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    await semearSacola(page);
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    const resumo = page.getByRole('region', { name: 'Revise os campos abaixo' });
    await expect(resumo.getByRole('heading', { name: 'Revise os campos abaixo' })).toBeFocused();
    await expect(resumo.getByRole('link')).toHaveCount(9);
    await resumo.getByRole('link', { name: /^Nome completo:/ }).click();
    await expect(campo(page, 'Nome completo')).toBeFocused();
    await expect(campo(page, 'Nome completo')).toHaveAttribute('aria-invalid', 'true');
    expect(problemas).toEqual([]);
  });

  test('CEP fora de área impede avançar', async ({ page }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await preencherComTeclado(page);
    await campo(page, 'CEP').fill('');
    await campo(page, 'CEP').pressSequentially('00500000');
    await expect(
      page.getByText('Ainda não chegamos ao seu CEP com segurança refrigerada.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await expect(page.getByRole('heading', { name: 'Revise os campos abaixo' })).toBeFocused();
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toHaveCount(0);
  });

  test('o bloco do presente só aparece quando a sacola é presente', async ({ browser }) => {
    for (const presente of [false, true]) {
      const contexto = await browser.newContext();
      const page = await contexto.newPage();
      const problemas = vigiarConsole(page);
      await semearSacola(page, presente);
      await page.goto('/checkout');
      await expect(page.getByRole('heading', { level: 2, name: 'Entrega' })).toBeVisible();
      const quantidade = presente ? 1 : 0;
      await expect(campo(page, 'Mensagem do cartão')).toHaveCount(quantidade);
      await expect(campo(page, 'Data de entrega')).toHaveCount(quantidade);
      await expect(page.getByText(/nota fiscal sem valor visível/i)).toHaveCount(quantidade);
      expect(problemas).toEqual([]);
      await contexto.close();
    }
  });

  test('sacola vazia mostra o estado vazio da /sacola', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText('Sua tábua ainda está vazia.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );
  });

  test('não é indexada (noindex)', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page).toHaveTitle('Finalizar compra — Ateliê do Queijo');
  });

  for (const largura of [360, 390, 768, 1440, 1920]) {
    test(`sem rolagem horizontal a ${largura} px (vazio, entrega e presente)`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      const cabe = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        );
      await page.goto('/checkout');
      await expect(page.getByText('Sua tábua ainda está vazia.')).toBeVisible();
      expect(await cabe()).toBe(true);

      await semearSacola(page, true);
      await page.goto('/checkout');
      await expect(campo(page, 'Mensagem do cartão')).toBeVisible();
      expect(await cabe()).toBe(true);
      await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
      await expect(page.getByRole('region', { name: 'Revise os campos abaixo' })).toBeVisible();
      expect(await cabe()).toBe(true);
    });
  }
});
