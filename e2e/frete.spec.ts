import { expect, test, type Page } from '@playwright/test';
import { vigiarConsole } from './_apoio/console';

const ROTA = '/queijos/canastra-curado';

const campo = (page: Page) => page.getByLabel('Calcule o frete e o prazo');
const calcular = (page: Page) => page.getByRole('button', { name: 'Calcular' });

/** Espera a hidratação: o campo só aplica a máscara depois que o React assumiu a página. */
async function digitarCep(page: Page, cep: string) {
  const entrada = campo(page);
  await expect(async () => {
    await entrada.fill('');
    await entrada.pressSequentially(cep);
    await expect(entrada).toHaveValue(/^\d{5}-\d{3}$/);
  }).toPass();
}

test.describe('calculadora de frete do produto', () => {
  test('digitar 01310100 mostra 01310-100; ao enviar, o texto de prazo; CEP fora da URL', async ({
    page,
  }) => {
    const problemas = vigiarConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROTA);

    await digitarCep(page, '01310100');
    await expect(campo(page)).toHaveValue('01310-100');
    await calcular(page).click();

    await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
    expect(page.url()).not.toMatch(/01310|cep=/);
    expect(new URL(page.url()).search).toBe('');
    expect(problemas).toEqual([]);
  });

  test('Enter envia o formulário', async ({ page }) => {
    await page.goto(ROTA);
    await digitarCep(page, '01310100');
    await campo(page).press('Enter');
    await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
  });

  test('00500-000 → fora de área, sem campo de e-mail', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.goto(ROTA);
    await digitarCep(page, '00500000');
    await calcular(page).click();

    await expect(
      page.getByText(
        'Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: /e-mail/i })).toHaveCount(0);
    expect(page.url()).not.toContain('00500');
    expect(problemas).toEqual([]);
  });

  test('CEP incompleto → mensagem de erro, campo marcado e foco no campo', async ({ page }) => {
    const problemas = vigiarConsole(page);
    await page.goto(ROTA);
    await expect(async () => {
      await campo(page).fill('');
      await campo(page).pressSequentially('0131');
      await expect(campo(page)).toHaveValue('0131');
      await calcular(page).click();
      await expect(campo(page)).toHaveAttribute('aria-invalid', 'true');
    }).toPass();

    await expect(
      page.getByText('Informe um CEP com 8 números, por exemplo 01310-100.'),
    ).toBeVisible();
    await expect(campo(page)).toBeFocused();
    expect(problemas).toEqual([]);
  });

  test('envio antes de hidratar não põe o CEP na URL (POST, nunca GET)', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', (rota) => rota.abort());
    await page.goto(ROTA);
    await campo(page).fill('01310-100');
    const envio = page.waitForRequest((r) => r.method() === 'POST');
    await campo(page).press('Enter');
    await envio; // prova que houve POST nativo, não GET
    await page.waitForLoadState('load');
    expect(page.url()).not.toMatch(/01310|cep=/);
    expect(new URL(page.url()).search).toBe('');
  });

  test('corpo de ~40 KB na Server Action é recusado; CEP válido continua funcionando', async ({
    page,
  }) => {
    await page.goto(ROTA);
    const pedido = page.waitForRequest(
      (r) => r.method() === 'POST' && !!r.headers()['next-action'],
    );
    await digitarCep(page, '01310100');
    await calcular(page).click();
    const original = await pedido;
    await expect(page.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();

    const cabecalhos = original.headers();
    const idDaAcao = cabecalhos['next-action']!;
    const enviar = (corpo: string) =>
      page.request.post(original.url(), {
        headers: { 'next-action': idDaAcao, 'content-type': 'text/plain;charset=UTF-8' },
        data: corpo,
        failOnStatusCode: false,
      });

    const grande = await enviar(JSON.stringify(['0'.repeat(40 * 1024)]));
    expect(grande.status()).toBeGreaterThanOrEqual(400);
    expect(await grande.text()).not.toContain('Chega refrigerado');

    const pequeno = await enviar(JSON.stringify(['01310-100']));
    expect(pequeno.status()).toBe(200);
    expect(await pequeno.text()).toContain('atendido');
  });

  for (const largura of [390, 1440]) {
    test(`${largura} px: sem rolagem horizontal com o resultado na tela`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(ROTA);
      await digitarCep(page, '00500000');
      await calcular(page).click();
      await expect(page.getByText(/Ainda não chegamos/)).toBeVisible();

      const semRolagem = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(semRolagem).toBe(true);
    });
  }
});
