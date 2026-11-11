import type { Locator, Page } from '@playwright/test';
import { expect, test } from './_apoio/teste';
import { DADOS, campo, semearSacola } from './_apoio/checkout';

// P81 = B (revoga o D2): borda dos campos em --placeholder; o que não é campo segue --pedra-clara.
const BORDA_DO_CAMPO = 'rgb(140, 128, 112)';
const BORDA_DO_CONTROLE = 'rgb(74, 64, 56)';

const corDaBorda = (alvo: Locator) => alvo.evaluate((no) => getComputedStyle(no).borderTopColor);

async function conferir(grupo: Record<string, Locator>, esperada: string) {
  for (const [nome, alvo] of Object.entries(grupo)) {
    await expect(alvo, nome).toBeVisible();
    expect(await corDaBorda(alvo), nome).toBe(esperada);
  }
}

async function abrirAtendimento(page: Page) {
  await page.getByRole('button', { name: 'Abrir atendimento' }).click();
  await expect(page.getByRole('dialog', { name: 'Assistente do Ateliê' })).toBeVisible();
}

test.describe('borda dos campos (P81 = B)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Home: newsletter é campo; botão secundário não é', async ({ page }) => {
    await page.goto('/');
    await conferir({ 'e-mail da newsletter': page.getByLabel('Seu e-mail') }, BORDA_DO_CAMPO);
    await conferir(
      { 'botão secundário': page.getByRole('link', { name: 'Montar um presente' }) },
      BORDA_DO_CONTROLE,
    );
  });

  test('produto: CEP é campo; chip de formato, quantidade e botão secundário não são', async ({
    page,
  }) => {
    await page.goto('/queijos/canastra-curado');
    await conferir({ CEP: campo(page, 'Calcule o frete e o prazo') }, BORDA_DO_CAMPO);
    await conferir(
      {
        'chip de formato': page
          .locator('label')
          .filter({ has: page.getByRole('radio', { name: /Meia peça/ }) }),
        'seletor de quantidade': page
          .getByRole('group')
          .filter({ has: page.getByLabel('Diminuir quantidade') }),
        'botão secundário': page.getByRole('button', { name: 'Embalar para presente' }),
      },
      BORDA_DO_CONTROLE,
    );
  });

  test('painel: campo de mensagem é campo; resposta rápida não é', async ({ page }) => {
    await page.goto('/');
    await abrirAtendimento(page);
    await conferir({ 'campo do chat': page.getByLabel('Escreva sua mensagem') }, BORDA_DO_CAMPO);
    await conferir(
      { 'resposta rápida': page.getByRole('button', { name: 'Sugira um queijo' }) },
      BORDA_DO_CONTROLE,
    );
  });

  test('checkout: inputs e select são campos; opção de pagamento não é', async ({ page }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await conferir(
      {
        Nome: campo(page, 'Nome completo'),
        'E-mail': campo(page, 'E-mail'),
        CEP: campo(page, 'CEP'),
        Estado: campo(page, 'Estado'),
      },
      BORDA_DO_CAMPO,
    );

    await campo(page, 'Nome completo').fill(DADOS.nome);
    await campo(page, 'E-mail').fill(DADOS.email);
    await campo(page, 'Telefone').fill(DADOS.telefone);
    await campo(page, 'CEP').fill(DADOS.cep);
    await campo(page, 'Rua ou avenida').fill(DADOS.logradouro);
    await campo(page, 'Número').fill(DADOS.numero);
    await campo(page, 'Bairro').fill(DADOS.bairro);
    await campo(page, 'Cidade').fill(DADOS.cidade);
    await campo(page, 'Estado').selectOption('SP');
    await expect(page.getByText('Chega refrigerado em até 3 dias úteis.')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();
    await conferir(
      { 'opção de pagamento': page.locator('label').filter({ hasText: 'Pix (5% de desconto)' }) },
      BORDA_DO_CONTROLE,
    );
  });
});

test.describe('colar no campo de CEP', () => {
  async function colar(alvo: Locator, texto: string) {
    await alvo.focus();
    await alvo.evaluate((no, valor) => {
      const dados = new DataTransfer();
      dados.setData('text/plain', valor);
      no.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dados, bubbles: true, cancelable: true }),
      );
    }, texto);
  }

  test('produto: "CEP 01310-100" vira 01310-100', async ({ page }) => {
    await page.goto('/queijos/canastra-curado');
    const cep = campo(page, 'Calcule o frete e o prazo');
    await colar(cep, 'CEP 01310-100');
    await expect(cep).toHaveValue('01310-100');
  });

  test('checkout: "CEP 01310-100" vira 01310-100', async ({ page }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    const cep = campo(page, 'CEP');
    await colar(cep, 'CEP 01310-100');
    await expect(cep).toHaveValue('01310-100');
  });
});

test.describe('Trilha: zona de toque (P82 = A)', () => {
  for (const largura of [360, 1440]) {
    test(`${largura} px: cada link tem zona de 24 px e as zonas não se sobrepõem`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      // No produto a trilha some no celular (§7.6); o artigo a mostra em qualquer largura.
      await page.goto('/aprenda/queijo-e-vinho');
      const links = page.getByRole('navigation', { name: 'Você está em' }).getByRole('link');
      const zonas = await links.evaluateAll((nos) =>
        nos.map((no) => {
          const caixa = no.getBoundingClientRect();
          const depois = getComputedStyle(no, '::after');
          const altura = parseFloat(depois.height);
          const centro = caixa.top + caixa.height / 2;
          return {
            posicao: depois.position,
            conteudo: depois.content,
            largura: caixa.width,
            altura,
            esquerda: caixa.left,
            direita: caixa.right,
            topo: centro - altura / 2,
            base: centro + altura / 2,
          };
        }),
      );
      expect(zonas.length).toBeGreaterThan(1);
      for (const z of zonas) {
        expect(z.posicao).toBe('absolute');
        expect(z.conteudo).not.toBe('none');
        expect(z.largura).toBeGreaterThanOrEqual(24);
        expect(z.altura).toBeGreaterThanOrEqual(24);
      }
      for (let i = 0; i < zonas.length; i++) {
        for (let j = i + 1; j < zonas.length; j++) {
          const a = zonas[i]!;
          const b = zonas[j]!;
          const sobrepoe =
            a.esquerda < b.direita && b.esquerda < a.direita && a.topo < b.base && b.topo < a.base;
          expect(sobrepoe, `zonas ${i} e ${j}`).toBe(false);
        }
      }
    });
  }
});
