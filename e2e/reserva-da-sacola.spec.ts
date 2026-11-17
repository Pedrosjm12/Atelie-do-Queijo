import { expect, semAguardarHidratacao, test, type Page } from './_apoio/teste';

/**
 * Trava do CLS da /sacola (etapa 8, tarefa 15). Antes de ler o `localStorage`, a página mostra só a
 * `.reserva`, com altura fixada em CSS a partir de `data-sacola`, `--n` e `data-presente` (marcados
 * por `ReservaDaSacola`). Se alguém mudar padding, fonte ou texto da linha, do resumo ou da sacola
 * vazia sem ajustar a reserva, o rodapé volta a pular quando a sacola hidrata e este teste falha.
 *
 * Método: a mesma sacola é aberta duas vezes. Na primeira, o JavaScript do Next é bloqueado (o React
 * não hidrata, mas o script inline da reserva roda): mede-se a altura do contêiner com a reserva. Na
 * segunda, a página hidrata normalmente e mede-se a altura do estado final. Tolerância de 1 px.
 */

const CHAVE = 'atelie:sacola:v1';
const UM = [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }];
const TRES = [
  ...UM,
  { slug: 'creme-do-marajo', formatoId: 'fracao', quantidade: 1 },
  { slug: 'cabra-com-cinzas', formatoId: 'peca', quantidade: 1 },
];

const ESTADOS = [
  { nome: 'vazia', itens: [], presente: false },
  { nome: '1 item', itens: UM, presente: false },
  { nome: '3 itens', itens: TRES, presente: false },
  { nome: '1 item com presente', itens: UM, presente: true },
  { nome: '3 itens com presente', itens: TRES, presente: true },
] as const;

const LARGURAS = [1440, 800, 390] as const;

async function semear(page: Page, itens: readonly object[], presente: boolean) {
  await page.addInitScript(
    ([chave, valor]) => localStorage.setItem(chave!, valor!),
    [CHAVE, JSON.stringify({ v: 1, itens, presente })],
  );
}

/** Altura do contêiner da página (o que empurra o rodapé), depois de as fontes carregarem. */
async function alturaDoConteudo(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.locator('[data-sacola]').evaluate((el) => el.getBoundingClientRect().height);
}

for (const largura of LARGURAS) {
  for (const estado of ESTADOS) {
    test(`/sacola ${estado.nome} a ${largura} px: a reserva tem a altura do estado final`, async ({
      browser,
    }) => {
      const contexto = await browser.newContext({ viewport: { width: largura, height: 900 } });
      try {
        // 1) Sem hidratar: só a reserva.
        const antes = await contexto.newPage();
        semAguardarHidratacao(antes);
        await antes.route(/\/_next\/static\/.*\.js(\?.*)?$/, (rota) => rota.abort());
        await semear(antes, estado.itens, estado.presente);
        await antes.goto('/sacola');
        await expect(antes.locator('[data-sacola]')).toHaveAttribute(
          'data-sacola',
          estado.itens.length ? 'cheia' : 'vazia',
        );
        const reservada = await alturaDoConteudo(antes);
        await antes.close();

        // 2) Hidratada: o estado final.
        const depois = await contexto.newPage();
        await semear(depois, estado.itens, estado.presente);
        await depois.goto('/sacola');
        if (estado.itens.length) {
          await expect(
            depois.getByRole('list', { name: 'Itens da sacola' }).getByRole('listitem'),
          ).toHaveCount(estado.itens.length);
        } else {
          await expect(depois.getByText('Sua tábua ainda está vazia.')).toBeVisible();
        }
        if (estado.presente) {
          await expect(depois.getByText('Embalagem para presente')).toBeVisible();
        }
        const final = await alturaDoConteudo(depois);

        expect(
          Math.abs(final - reservada),
          `reserva ${reservada} px, final ${final} px`,
        ).toBeLessThanOrEqual(1);
      } finally {
        await contexto.close();
      }
    });
  }
}

/**
 * Trava do CLS do /checkout (2026-11-17, achado do Lighthouse: 0,14 com a sacola vazia). A reserva
 * usa a mesma marcação de `ReservaDaSacola`. Vazia: a altura exata de `SacolaVazia`, como na
 * /sacola. Com itens: uma tela inteira, para o rodapé já nascer abaixo da dobra; o formulário final
 * também o deixa abaixo da dobra, então ele só se move fora da tela (não conta no CLS).
 */
async function topoDoRodape(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.locator('footer').evaluate((el) => el.getBoundingClientRect().top);
}

for (const largura of LARGURAS) {
  test(`/checkout com a sacola vazia a ${largura} px: a reserva tem a altura do estado final`, async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ viewport: { width: largura, height: 900 } });
    try {
      const antes = await contexto.newPage();
      semAguardarHidratacao(antes);
      await antes.route(/\/_next\/static\/.*\.js(\?.*)?$/, (rota) => rota.abort());
      await semear(antes, [], false);
      await antes.goto('/checkout');
      await expect(antes.locator('[data-sacola]')).toHaveAttribute('data-sacola', 'vazia');
      const reservada = await alturaDoConteudo(antes);
      await antes.close();

      const depois = await contexto.newPage();
      await semear(depois, [], false);
      await depois.goto('/checkout');
      await expect(depois.getByText('Sua tábua ainda está vazia.')).toBeVisible();
      const final = await alturaDoConteudo(depois);

      expect(
        Math.abs(final - reservada),
        `reserva ${reservada} px, final ${final} px`,
      ).toBeLessThanOrEqual(1);
    } finally {
      await contexto.close();
    }
  });

  test(`/checkout com itens a ${largura} px: o rodapé fica abaixo da dobra antes e depois`, async ({
    browser,
  }) => {
    const altura = 900;
    const contexto = await browser.newContext({ viewport: { width: largura, height: altura } });
    try {
      const antes = await contexto.newPage();
      semAguardarHidratacao(antes);
      await antes.route(/\/_next\/static\/.*\.js(\?.*)?$/, (rota) => rota.abort());
      await semear(antes, TRES, false);
      await antes.goto('/checkout');
      await expect(antes.locator('[data-sacola]')).toHaveAttribute('data-sacola', 'cheia');
      expect(await topoDoRodape(antes)).toBeGreaterThanOrEqual(altura);
      await antes.close();

      const depois = await contexto.newPage();
      await semear(depois, TRES, false);
      await depois.goto('/checkout');
      await expect(depois.getByRole('heading', { level: 2, name: 'Entrega' })).toBeVisible();
      expect(await topoDoRodape(depois)).toBeGreaterThanOrEqual(altura);
    } finally {
      await contexto.close();
    }
  });
}

// Janela mais alta que o formulário: a reserva tem teto, e o rodapé não pode subir ao hidratar.
for (const largura of [1440, 390] as const) {
  test(`/checkout com itens a ${largura} px e janela alta: o rodapé não se move`, async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ viewport: { width: largura, height: 1700 } });
    try {
      const antes = await contexto.newPage();
      semAguardarHidratacao(antes);
      await antes.route(/\/_next\/static\/.*\.js(\?.*)?$/, (rota) => rota.abort());
      await semear(antes, UM, false);
      await antes.goto('/checkout');
      await expect(antes.locator('[data-sacola]')).toHaveAttribute('data-sacola', 'cheia');
      const reservado = await topoDoRodape(antes);
      await antes.close();

      const depois = await contexto.newPage();
      await semear(depois, UM, false);
      await depois.goto('/checkout');
      await expect(depois.getByRole('heading', { level: 2, name: 'Entrega' })).toBeVisible();
      const final = await topoDoRodape(depois);

      expect(Math.abs(final - reservado), `rodapé ${reservado} → ${final} px`).toBeLessThanOrEqual(
        1,
      );
    } finally {
      await contexto.close();
    }
  });
}

test('item malformado no localStorage não conta: a reserva fica a da sacola vazia', async ({
  page,
}) => {
  semAguardarHidratacao(page);
  await page.route(/\/_next\/static\/.*\.js(\?.*)?$/, (rota) => rota.abort());
  await semear(
    page,
    [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 0 }, { slug: 1 }],
    false,
  );
  await page.goto('/checkout');
  await expect(page.locator('[data-sacola]')).toHaveAttribute('data-sacola', 'vazia');
});
