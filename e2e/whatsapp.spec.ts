import { aguardarHidratacao, expect, test } from './_apoio/teste';
import type { Page } from '@playwright/test';

// Links do WhatsApp, horário do atendimento e carregamento tardio do motor (etapa 6; spec §8.2, §8.3
// e §10.5). O número é o fictício de `data/ficticio.ts` (sem variável de ambiente no e2e).
const NUMERO = '5520900000000';

const painel = (page: Page) => page.getByRole('dialog', { name: 'Assistente do Ateliê' });
const abrirPainel = (page: Page) => page.getByRole('button', { name: 'Abrir atendimento' }).click();

const TEXTO_DO_HORARIO = 'Seg a sex, 9h às 18h · sáb, 9h às 15h';
const TEXTO_DA_CAVE_FECHADA =
  'Nossa cave está fechada agora. Atendemos de segunda a sexta, das 9h às 18h, e aos sábados, das 9h às 15h. Se preferir, o Assistente do Ateliê responde na hora pelo site.';

const semRolagemHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Texto da mensagem pré-preenchida de um link `wa.me`. */
async function mensagemDoLink(page: Page, nome: string | RegExp, dentro = painel(page)) {
  const href = await dentro.getByRole('link', { name: nome }).first().getAttribute('href');
  expect(href).toMatch(new RegExp(`^https://wa\\.me/${NUMERO}\\?text=`));
  return decodeURIComponent((href ?? '').split('?text=')[1] ?? '');
}

async function digitar(page: Page, texto: string) {
  const campo = painel(page).getByLabel('Escreva sua mensagem');
  await campo.fill(texto);
  await campo.press('Enter');
}

test.describe('links do WhatsApp (§8.3, §10.5)', () => {
  test('Fale com um queijista (produto): link wa.me com a mensagem do queijo, em nova aba', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');
    const link = page
      .getByRole('link', { name: 'Fale com um queijista' })
      .filter({ visible: true });
    await expect(link).toHaveCount(1);

    const href = (await link.getAttribute('href')) ?? '';
    expect(decodeURIComponent(href)).toBe(
      `https://wa.me/${NUMERO}?text=Olá! Tenho uma dúvida sobre o Canastra curado.`,
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('faixa e aba do painel: mensagem geral; depois do pedido informado, mensagem do pedido', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPainel(page);
    const p = painel(page);

    expect(await mensagemDoLink(page, 'Falar com um queijista')).toBe(
      'Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.',
    );

    await p.getByRole('button', { name: 'Onde está meu pedido?' }).click();
    await expect(p.getByRole('button', { name: 'Onde está meu pedido?' })).toHaveCount(0);
    await digitar(page, 'AQ-123456');
    await expect(p.getByText(/Vou chamar um queijista da nossa equipe/)).toBeVisible();

    const mensagem = await mensagemDoLink(page, 'Falar com um queijista');
    expect(mensagem).toBe('Olá! Quero falar sobre o pedido nº AQ-123456.');
    expect(mensagem.endsWith('pedido nº AQ-123456.')).toBe(true);

    // A aba do queijista usa o mesmo contexto.
    await p.getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
    const aba = p.getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });
    expect(await mensagemDoLink(page, 'Falar com um queijista', aba)).toBe(mensagem);
  });

  test('produto sugerido no chat muda a mensagem para a do produto', async ({ page }) => {
    await page.goto('/');
    await abrirPainel(page);
    await digitar(page, 'Quero presentear alguém que adora vinho tinto.');
    await expect(painel(page).getByRole('button', { name: 'Ver outras opções' })).toBeVisible();
    expect(await mensagemDoLink(page, 'Falar com um queijista')).toBe(
      'Olá! Tenho uma dúvida sobre o Canastra curado.',
    );
  });

  test('o texto digitado nunca vai para a URL', async ({ page }) => {
    await page.goto('/');
    await abrirPainel(page);
    await digitar(page, 'quero falar com um atendente sobre o cpf 123.456.789-00');
    await expect(painel(page).getByText(/Vou chamar um queijista da nossa equipe/)).toBeVisible();
    expect(await mensagemDoLink(page, 'Falar com um queijista')).not.toMatch(/cpf|123/);
  });
});

test.describe('horário do atendimento (America/Sao_Paulo)', () => {
  const casos = [
    { nome: 'sábado 15h00', instante: '2026-11-07T15:00:00-03:00', fechado: true },
    { nome: 'sábado 14h59', instante: '2026-11-07T14:59:00-03:00', fechado: false },
    { nome: 'domingo 11h00', instante: '2026-11-08T11:00:00-03:00', fechado: true },
    { nome: 'terça 10h00', instante: '2026-11-10T10:00:00-03:00', fechado: false },
  ] as const;

  for (const { nome, instante, fechado } of casos) {
    test(`${nome}: ${fechado ? 'cave fechada no lugar da linha' : 'linha de horário'}, e o botão continua`, async ({
      page,
    }) => {
      await page.clock.setFixedTime(new Date(instante));
      await page.goto('/');
      await abrirPainel(page);
      await painel(page).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();

      const aba = painel(page).getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });
      if (fechado) {
        await expect(aba.getByText(TEXTO_DA_CAVE_FECHADA, { exact: true })).toBeVisible();
        await expect(aba.getByText(TEXTO_DO_HORARIO, { exact: true })).toHaveCount(0);
      } else {
        await expect(aba.getByText(TEXTO_DO_HORARIO, { exact: true })).toBeVisible();
        await expect(aba.getByText(TEXTO_DA_CAVE_FECHADA)).toHaveCount(0);
      }
      await expect(aba.getByRole('link', { name: 'Falar com um queijista' })).toBeVisible();
    });
  }

  test('a faixa do assistente mantém a linha de horário mesmo com a cave fechada', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-08T11:00:00-03:00'));
    await page.goto('/');
    await abrirPainel(page);
    const faixa = painel(page).getByText('Prefere falar com uma pessoa?');
    await expect(faixa).toContainText(TEXTO_DO_HORARIO);
  });

  test('o fuso da máquina não muda o resultado (domingo 23h em São Paulo é segunda 02h UTC)', async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
    const pagina = await contexto.newPage();
    await pagina.clock.setFixedTime(new Date('2026-11-09T02:00:00Z'));
    await pagina.goto('/');
    await aguardarHidratacao(pagina);
    await abrirPainel(pagina);
    await painel(pagina).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
    await expect(painel(pagina).getByText(TEXTO_DA_CAVE_FECHADA, { exact: true })).toBeVisible();
    await contexto.close();
  });
});

test.describe('motor do assistente em chunk tardio', () => {
  // Literal da §8.2 que só existe em lib/roteiro.ts (não depende de lacunas [A DEFINIR]).
  const MARCA_DO_MOTOR = 'Vou chamar um queijista da nossa equipe';

  test('nenhum script do HTML das páginas contém o motor', async ({ request }) => {
    for (const rota of ['/', '/queijos', '/queijos/canastra-curado']) {
      const resposta = await request.get(rota);
      const html = await resposta.text();
      expect(html).not.toContain(MARCA_DO_MOTOR);
      const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
      expect(scripts.length).toBeGreaterThan(0);
      for (const src of scripts) {
        const js = await (await request.get(src ?? '')).text();
        expect(js, `${rota} ${src}`).not.toContain(MARCA_DO_MOTOR);
      }
    }
  });

  test('o motor só é baixado ao abrir o painel', async ({ page }) => {
    const baixados: string[] = [];
    page.on('response', async (resposta) => {
      if (!resposta.url().includes('/_next/static/') || !resposta.url().includes('.js')) return;
      const corpo = await resposta.text().catch(() => '');
      if (corpo.includes(MARCA_DO_MOTOR)) baixados.push(resposta.url());
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: 'Abrir atendimento' })).toBeVisible();
    expect(baixados).toEqual([]);

    await abrirPainel(page);
    await expect.poll(() => baixados.length).toBeGreaterThan(0);
  });

  test('usar o chat não faz nenhuma requisição para outro domínio', async ({ page }) => {
    const externas: string[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) externas.push(r.url());
    });
    await page.goto('/');
    await abrirPainel(page);
    await painel(page).getByRole('button', { name: 'Sugira um queijo' }).click();
    await digitar(page, 'Quero presentear alguém que adora vinho tinto.');
    await expect(painel(page).getByRole('button', { name: 'Ver outras opções' })).toBeVisible();
    await painel(page).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
    expect(externas).toEqual([]);
  });
});

test.describe('ações e layout da conversa', () => {
  test('Sim, com cartão pergunta o formato e põe o Canastra de presente na sacola', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPainel(page);
    await digitar(page, 'Quero presentear alguém que adora vinho tinto.');
    await painel(page).getByRole('button', { name: 'Sim, com cartão' }).click();
    await expect(painel(page).getByLabel('Escreva sua mensagem')).toBeFocused();

    await painel(page)
      .getByRole('button', { name: /^Peça inteira/ })
      .click();
    // O aviso visual fica fora do <dialog> modal: quem usa leitor de tela o recebe no log do painel.
    await expect(
      painel(page)
        .getByRole('log', { name: 'Conversa' })
        .getByText('Adicionado à sacola. Boa escolha.'),
    ).toBeVisible();
    const sacola = await page.evaluate(() => window.localStorage.getItem('atelie:sacola:v1'));
    expect(sacola).toContain('canastra-curado');
    expect(sacola).toContain('"presente":true');
  });

  test('o grupo antigo de respostas rápidas some: só o último aceita clique', async ({ page }) => {
    await page.goto('/');
    await abrirPainel(page);
    await painel(page).getByRole('button', { name: 'Sugira um queijo' }).click();
    await expect(painel(page).getByRole('group', { name: 'Respostas sugeridas' })).toHaveCount(1);
    await expect(painel(page).getByRole('button', { name: 'Montar uma tábua' })).toHaveCount(0);
  });

  for (const largura of [320, 360, 390]) {
    test(`${largura} px: sem rolagem horizontal com o painel aberto e a conversa longa`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 780 });
      await page.goto('/');
      await abrirPainel(page);
      await painel(page).getByRole('button', { name: 'Montar uma tábua' }).click();
      await expect(
        painel(page).getByRole('link', { name: 'Ver Brie francês em 3D' }),
      ).toBeVisible();
      await digitar(page, 'Quero presentear alguém que adora vinho tinto.');
      await expect(painel(page).getByRole('button', { name: 'Ver outras opções' })).toBeVisible();
      await painel(page).getByRole('button', { name: 'Ver outras opções' }).click();
      await expect(
        painel(page).getByRole('link', { name: 'Ver Manchego DOP em 3D' }),
      ).toBeVisible();

      expect(await semRolagemHorizontal(page)).toBe(true);
      const transborda = await painel(page).evaluate(
        (el, w) =>
          Array.from(el.querySelectorAll('*')).some(
            (n) => n.getBoundingClientRect().right > w + 0.5,
          ),
        largura,
      );
      expect(transborda).toBe(false);

      // Aba e botão do WhatsApp: nada cortado (o texto quebra em vez de estourar).
      const cortados = () =>
        painel(page).evaluate((el) =>
          Array.from(el.querySelectorAll<HTMLElement>('button, a')).some(
            (n) => n.offsetParent !== null && n.scrollWidth > n.clientWidth + 1,
          ),
        );
      expect(await cortados()).toBe(false);
      await painel(page).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
      expect(await cortados()).toBe(false);
      expect(await semRolagemHorizontal(page)).toBe(true);
    });
  }
});
