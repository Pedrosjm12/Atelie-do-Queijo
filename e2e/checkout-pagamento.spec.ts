import { expect, test, type Page } from '@playwright/test';
import { CHAVE_DA_SACOLA, DADOS, campo, semearSacola } from './_apoio/checkout';
import { vigiarConsole } from './_apoio/console';

const TEXTO_DO_ERRO =
  'Não conseguimos confirmar o pagamento. Nada foi cobrado. Tente outra forma ou fale com a gente.';
const EMAIL_DE_RECUSA = 'recusa@exemplo.com';
const LARGURAS = [360, 390, 768, 1440, 1920];

/** Preenche a etapa 1 com `fill` (rápido); o fluxo por teclado já é coberto em checkout.spec.ts. */
async function preencherEntrega(page: Page, email: string = DADOS.email) {
  await campo(page, 'Nome completo').fill(DADOS.nome);
  await campo(page, 'E-mail').fill(email);
  await campo(page, 'Telefone').fill(DADOS.telefone);
  await campo(page, 'CEP').fill(DADOS.cep);
  await campo(page, 'Rua ou avenida').fill(DADOS.logradouro);
  await campo(page, 'Número').fill(DADOS.numero);
  await campo(page, 'Bairro').fill(DADOS.bairro);
  await campo(page, 'Cidade').fill(DADOS.cidade);
  await campo(page, 'Estado').selectOption('SP');
  await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
}

async function irParaOPagamento(page: Page, email?: string) {
  await preencherEntrega(page, email);
  await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();
}

const pix = (page: Page) => page.getByRole('radio', { name: 'Pix (5% de desconto)' });
const cartao = (page: Page) => page.getByRole('radio', { name: 'Cartão em até [n]x sem juros' });
/** O rádio é visualmente oculto (padrão dos formatos): o clique vai no rótulo. */
const escolher = (page: Page, rotulo: string) =>
  page.locator('label').filter({ hasText: rotulo }).click();
const confirmar = (page: Page) => page.getByRole('button', { name: 'Confirmar pedido' });
const contador = (page: Page) => page.getByRole('link', { name: /^Sacola \d+ item/ }).first();
const totalDoResumo = (page: Page) =>
  page
    .getByRole('region', { name: 'Resumo do pedido' })
    .getByText('Total', { exact: true })
    .locator('xpath=..');

async function semRolagemHorizontal(page: Page, rotulo: string) {
  const cabe = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(cabe, rotulo).toBe(true);
}

async function semIdsDuplicados(page: Page) {
  const duplicados = await page.evaluate(() => {
    const vistos = new Set<string>();
    const repetidos = new Set<string>();
    for (const no of document.querySelectorAll('[id]')) {
      if (vistos.has(no.id)) repetidos.add(no.id);
      vistos.add(no.id);
    }
    return Array.from(repetidos);
  });
  expect(duplicados).toEqual([]);
}

test.describe('checkout, etapas 2 e 3 (Pagamento e Confirmação)', () => {
  test('fluxo completo: adicionar, sacola, checkout, Pix, confirmação com o e-mail digitado, contador 0', async ({
    page,
    context,
  }) => {
    const problemas = vigiarConsole(page);
    await page.goto('/queijos');
    await page.getByRole('button', { name: 'Adicionar Brie francês à sacola' }).click();
    await expect(page.getByRole('link', { name: 'Sacola 1 item' })).toBeVisible();
    await page.getByRole('link', { name: 'Sacola 1 item' }).click();
    await expect(page).toHaveURL(/\/sacola$/);
    await page.getByRole('link', { name: 'Finalizar compra' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await semIdsDuplicados(page);

    await irParaOPagamento(page);
    await semIdsDuplicados(page);
    await escolher(page, 'Pix (5% de desconto)');
    await confirmar(page).click();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Seu queijo já está sendo preparado.' }),
    ).toBeFocused();
    await expect(page.getByText(/^Enviamos os detalhes para /)).toHaveText(
      `Enviamos os detalhes para ${DADOS.email}. Você vai receber o código de rastreio assim que a caixa sair da cave.`,
    );
    await expect(page.getByRole('listitem').filter({ hasText: '3. Confirmação' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await expect(page.getByRole('link', { name: 'Sacola 0 itens' }).first()).toBeVisible();
    await expect(page.getByText('Sua tábua ainda está vazia.')).toHaveCount(0);
    await expect(page.getByText(/AQ-\d{6}/)).toHaveCount(0); // P36
    await semIdsDuplicados(page);

    // Nenhum valor digitado ficou na URL, no storage nem em cookies (só o e-mail, na tela).
    const guardado = await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, sessao: { ...sessionStorage } }),
    );
    const cookies = JSON.stringify(await context.cookies());
    const url = decodeURIComponent(page.url());
    for (const valor of [
      DADOS.nome,
      'Souza',
      'maria.souza',
      DADOS.email,
      DADOS.telefone,
      '91234',
      '01310',
      DADOS.logradouro,
      DADOS.numero,
      DADOS.bairro,
      DADOS.cidade,
    ]) {
      expect(url).not.toContain(valor);
      expect(guardado).not.toContain(valor);
      expect(cookies).not.toContain(valor);
    }
    expect(new URL(page.url()).search).toBe('');
    expect(Object.keys(JSON.parse(guardado).local)).toEqual([CHAVE_DA_SACOLA]);
    expect(JSON.parse(guardado).local[CHAVE_DA_SACOLA]).not.toContain('slug');

    // P37: recarregar não mostra a confirmação (a sacola está vazia).
    await page.reload();
    await expect(page.getByText('Sua tábua ainda está vazia.')).toBeVisible();
    await expect(page.getByText('Seu queijo já está sendo preparado.')).toHaveCount(0);
    expect(problemas).toEqual([]);
  });

  test('sem escolher a forma de pagamento: erro do campo, foco no primeiro rádio e nada é enviado', async ({
    page,
  }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await irParaOPagamento(page);
    await confirmar(page).click();
    await expect(page.getByText('Escolha Pix ou cartão.')).toBeVisible();
    await expect(pix(page)).toBeFocused();
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeVisible();
    await expect(contador(page)).toHaveAccessibleName('Sacola 1 item');
  });

  test('trocar Pix por cartão muda o total; a opção escolhida vira ativa', async ({ page }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await irParaOPagamento(page);
    const resumo = page.getByRole('region', { name: 'Resumo do pedido' });
    await expect(resumo.getByText('Desconto no Pix')).toHaveCount(0);

    await escolher(page, 'Pix (5% de desconto)');
    await expect(resumo.getByText('Desconto no Pix')).toBeVisible();
    const comPix = await totalDoResumo(page).textContent();
    await escolher(page, 'Cartão em até [n]x sem juros');
    await expect(resumo.getByText('Desconto no Pix')).toHaveCount(0);
    const comCartao = await totalDoResumo(page).textContent();
    expect(comPix).not.toBe(comCartao);
    // Voltar e avançar mantém a forma escolhida.
    await page.getByRole('button', { name: 'Voltar para a entrega' }).click();
    await expect(campo(page, 'E-mail')).toHaveValue(DADOS.email);
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await expect(cartao(page)).toBeChecked();
  });

  for (const largura of [360, 390, 1440]) {
    test(`alvos de toque de pelo menos 44 px a ${largura} px (link do erro e "fale com a gente")`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await semearSacola(page);
      await page.goto('/checkout');
      await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
      const links = page.getByRole('region', { name: 'Revise os campos abaixo' }).getByRole('link');
      await expect(links).toHaveCount(9);
      for (const link of await links.all()) {
        const caixa = await link.boundingBox();
        expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(44);
      }

      await preencherEntrega(page, EMAIL_DE_RECUSA);
      await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
      await escolher(page, 'Pix (5% de desconto)');
      await confirmar(page).click();
      const alerta = page.locator('form [role="alert"]');
      await expect(alerta).toHaveText(TEXTO_DO_ERRO);
      const botao = await alerta.getByRole('button', { name: 'fale com a gente' }).boundingBox();
      expect(botao?.height ?? 0).toBeGreaterThanOrEqual(44);
      // O padding extra é compensado: o parágrafo não cresce (3 linhas de 16 px no máximo).
      const caixaDoAlerta = await alerta.boundingBox();
      expect(caixaDoAlerta?.height ?? 0).toBeLessThan(largura < 600 ? 190 : 110);
    });
  }

  test('pagamento recusado: mensagem em role=alert, sacola intacta, "fale com a gente" abre o atendimento', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    await semearSacola(page);
    await page.goto('/checkout');
    await irParaOPagamento(page, EMAIL_DE_RECUSA);
    await escolher(page, 'Pix (5% de desconto)');
    const antes = await page.evaluate((chave) => localStorage.getItem(chave), CHAVE_DA_SACOLA);
    await confirmar(page).click();

    const alerta = page.locator('form [role="alert"]');
    await expect(alerta).toHaveText(TEXTO_DO_ERRO);
    await expect(page.getByText('Seu queijo já está sendo preparado.')).toHaveCount(0);
    await expect(contador(page)).toHaveAccessibleName('Sacola 1 item');
    expect(await page.evaluate((chave) => localStorage.getItem(chave), CHAVE_DA_SACOLA)).toBe(
      antes,
    );
    await expect(confirmar(page)).not.toHaveAttribute('aria-disabled', 'true');

    await alerta.getByRole('button', { name: 'fale com a gente' }).click();
    await expect(page.getByRole('dialog', { name: 'Assistente do Ateliê' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Assistente do Ateliê' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'fale com a gente' })).toBeFocused();

    // Tentar de novo com outro e-mail dá certo.
    await page.getByRole('button', { name: 'Voltar para a entrega' }).click();
    await campo(page, 'E-mail').fill(DADOS.email);
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await confirmar(page).click();
    await expect(page.getByText('Seu queijo já está sendo preparado.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sacola 0 itens' }).first()).toBeVisible();
    expect(problemas).toEqual([]);
  });

  test('presente: a mensagem aparece como texto no resumo e nada vira HTML', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await semearSacola(page, true);
    await page.goto('/checkout');
    const mensagem = '<img src=x onerror=alert(1)>\nFeliz aniversário';
    await campo(page, 'Mensagem do cartão').fill(mensagem);
    const amanha = await campo(page, 'Data de entrega').getAttribute('min');
    await campo(page, 'Data de entrega').fill(amanha ?? '');
    await irParaOPagamento(page);
    const resumo = page.getByRole('region', { name: 'Resumo do pedido' });
    await expect(resumo.getByText('Feliz aniversário')).toBeVisible();
    await expect(resumo.locator('img')).toHaveCount(0);
    expect(
      await resumo.getByText('Feliz aniversário').evaluate((e) => getComputedStyle(e).whiteSpace),
    ).toBe('pre-line');
    expect(problemas).toEqual([]);
  });

  test('sem rolagem horizontal de 360 a 1920 px: pagamento, erro e confirmação', async ({
    page,
  }) => {
    await semearSacola(page, true);
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/checkout');
    const amanha = await campo(page, 'Data de entrega').getAttribute('min');
    await campo(page, 'Data de entrega').fill(amanha ?? '');
    await campo(page, 'Mensagem do cartão').fill('Uma mensagem bem longa '.repeat(8).trim());
    await irParaOPagamento(page, EMAIL_DE_RECUSA);
    await escolher(page, 'Pix (5% de desconto)');
    for (const largura of LARGURAS) {
      await page.setViewportSize({ width: largura, height: 900 });
      await semRolagemHorizontal(page, `pagamento a ${largura} px`);
    }
    await page.setViewportSize({ width: 360, height: 900 });
    await confirmar(page).click();
    await expect(page.locator('form [role="alert"]')).toContainText('Não conseguimos');
    for (const largura of LARGURAS) {
      await page.setViewportSize({ width: largura, height: 900 });
      await semRolagemHorizontal(page, `erro a ${largura} px`);
    }

    await page.setViewportSize({ width: 360, height: 900 });
    await page.getByRole('button', { name: 'Voltar para a entrega' }).click();
    await campo(page, 'E-mail').fill('uma.pessoa.com.um.endereco.bem.comprido@exemplo.com.br');
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await confirmar(page).click();
    await expect(page.getByText('Seu queijo já está sendo preparado.')).toBeVisible();
    for (const largura of LARGURAS) {
      await page.setViewportSize({ width: largura, height: 900 });
      await semRolagemHorizontal(page, `confirmação a ${largura} px`);
    }
  });

  test('documento sem id duplicado em /sacola e /checkout', async ({ page }) => {
    await semearSacola(page);
    for (const rota of ['/sacola', '/checkout']) {
      await page.goto(rota);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await semIdsDuplicados(page);
    }
  });
});
