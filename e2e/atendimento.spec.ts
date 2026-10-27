import { expect, test, type Locator, type Page } from '@playwright/test';

const painel = (page: Page) => page.getByRole('dialog', { name: 'Assistente do Ateliê' });

const gatilhos: { nome: string; rota: string; botao: (page: Page) => Locator }[] = [
  {
    nome: 'botão flutuante',
    rota: '/',
    botao: (page) => page.getByRole('button', { name: 'Abrir atendimento' }),
  },
  {
    nome: '"Fale conosco" do rodapé',
    rota: '/queijos',
    botao: (page) => page.getByRole('button', { name: 'Fale conosco' }),
  },
  {
    nome: '"Pedir ajuda" do catálogo',
    rota: '/queijos',
    botao: (page) => page.getByRole('button', { name: 'Pedir ajuda' }),
  },
];

const semRolagemHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe('painel de atendimento', () => {
  for (const { nome, rota, botao } of gatilhos) {
    test(`${nome}: abre o painel, Esc fecha e o foco volta ao gatilho`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(rota);

      const gatilho = botao(page);
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
      await gatilho.scrollIntoViewIfNeeded();
      await gatilho.click();

      await expect(painel(page)).toBeVisible();
      await expect(painel(page).getByText('Responde na hora, 24 horas')).toBeVisible();
      await expect(painel(page).getByRole('button', { name: 'Fechar atendimento' })).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(painel(page)).toBeHidden();
      await expect(gatilho).toBeFocused();
    });
  }

  test('o botão fechar também devolve o foco ao gatilho', async ({ page }) => {
    await page.goto('/');
    const gatilho = page.getByRole('button', { name: 'Abrir atendimento' });
    await gatilho.click();
    await painel(page).getByRole('button', { name: 'Fechar atendimento' }).click();
    await expect(painel(page)).toBeHidden();
    await expect(gatilho).toBeFocused();
  });

  test('o foco não escapa para a página atrás do painel enquanto ele está aberto', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      // No Chromium o Tab pode sair do documento para a interface do navegador (activeElement
      // vira o <body>); o que não pode é o foco cair em elemento da página atrás do painel.
      const foraDoPainel = await page.evaluate(() => {
        const ativo = document.activeElement;
        return ativo !== null && ativo !== document.body && !ativo.closest('dialog');
      });
      expect(foraDoPainel).toBe(false);
    }
  });

  test('1440 px: 390 x 640, canto inferior direito, 100 px acima do fundo, borda e raio', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();

    const caixa = await painel(page).boundingBox();
    expect(caixa).not.toBeNull();
    expect(caixa?.width).toBe(390);
    expect(caixa?.height).toBe(640);
    expect((caixa?.x ?? 0) + (caixa?.width ?? 0)).toBe(1440 - 28);
    expect((caixa?.y ?? 0) + (caixa?.height ?? 0)).toBe(900 - 100);

    await expect(painel(page)).toHaveCSS('border-top-left-radius', '16px');
    await expect(painel(page)).toHaveCSS('border-top-width', '1px');
    await expect(painel(page)).toHaveCSS('background-color', 'rgb(20, 17, 15)');
    expect(await semRolagemHorizontal(page)).toBe(true);
  });

  test('janela baixa: o painel não passa do topo e a área de mensagens rola', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 560 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();

    const caixa = await painel(page).boundingBox();
    expect(caixa?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect(caixa?.height ?? 9999).toBeLessThan(640);
    const rola = await painel(page)
      .getByRole('log')
      .evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(rola).toBe(true);
  });

  for (const [largura, altura] of [
    [320, 256],
    [640, 360],
  ] as const) {
    test(`reflow ${largura} x ${altura}: campo e Enviar ficam alcançáveis ao rolar`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await page.goto('/');
      await page.getByRole('button', { name: 'Abrir atendimento' }).click();
      const p = painel(page);
      const campo = p.getByLabel('Escreva sua mensagem');
      const enviar = p.getByRole('button', { name: 'Enviar' });

      await enviar.scrollIntoViewIfNeeded();
      await campo.scrollIntoViewIfNeeded();
      await expect(campo).toBeInViewport();
      await expect(enviar).toBeInViewport();
      expect(await semRolagemHorizontal(page)).toBe(true);
      const mensagens = await p.getByRole('log').boundingBox();
      expect(mensagens?.height ?? 0).toBeGreaterThanOrEqual(119);
    });
  }

  test('390 px: tela cheia, sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();

    const caixa = await painel(page).boundingBox();
    expect(caixa).toEqual({ x: 0, y: 0, width: 390, height: 844 });
    await expect(painel(page)).toHaveCSS('border-top-left-radius', '0px');
    expect(await semRolagemHorizontal(page)).toBe(true);
    // O conteúdo do painel também cabe na largura.
    const transborda = await painel(page).evaluate((el) =>
      Array.from(el.querySelectorAll('*')).some((n) => n.getBoundingClientRect().right > 390.5),
    );
    expect(transborda).toBe(false);
  });

  test('conteúdo da aba Assistente: roteiro, cartão, faixa e campo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();
    const p = painel(page);

    await expect(p.getByText(/Olá! Sou o assistente do Ateliê do Queijo/)).toBeVisible();
    await expect(p.getByRole('button', { name: 'Sugira um queijo' })).toBeVisible();
    await expect(p.getByText('Quero presentear alguém que adora vinho tinto.')).toBeVisible();
    await expect(p.getByText('BRASIL · CANASTRA, MG')).toBeVisible();
    await expect(p.getByRole('button', { name: 'Sim, com cartão' })).toHaveCSS(
      'border-top-color',
      'rgb(201, 162, 75)',
    );
    await expect(p.getByText('Prefere falar com uma pessoa?')).toBeVisible();
    await expect(p.getByLabel('Escreva sua mensagem')).toBeVisible();
    await expect(p.getByRole('button', { name: 'Enviar' })).toHaveCSS('width', '46px');
    await expect(p.getByRole('button', { name: 'Fechar atendimento' })).toHaveCSS('width', '44px');
  });

  test('abas: setas trocam para a aba Queijista (WhatsApp) e mostram horário e botão', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();
    const p = painel(page);

    const assistente = p.getByRole('tab', { name: 'Assistente' });
    await assistente.focus();
    await page.keyboard.press('ArrowRight');
    const queijista = p.getByRole('tab', { name: 'Queijista (WhatsApp)' });
    await expect(queijista).toBeFocused();
    await expect(queijista).toHaveAttribute('aria-selected', 'true');

    const aba = p.getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });
    await expect(aba.getByText('Seg a sex, 9h às 18h · sáb, 9h às 15h')).toBeVisible();
    const botao = aba.getByRole('button', { name: 'Falar com um queijista' });
    await expect(botao).toHaveCSS('background-color', 'rgb(37, 211, 102)');
    await expect(botao).toHaveAttribute('aria-disabled', 'true');
    await expect(p.getByRole('log')).toBeHidden();
  });

  test('o botão do cartão leva ao produto e fecha o painel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir atendimento' }).click();

    const link = painel(page).getByRole('link', { name: 'Ver Canastra curado em 3D' });
    await expect(link).toHaveAttribute('href', '/queijos/canastra-curado');
    expect((await link.boundingBox())?.width).toBe(44);
    await link.click();

    await expect(page).toHaveURL(/\/queijos\/canastra-curado$/);
    await expect(painel(page)).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Canastra curado' })).toBeVisible();
  });

  test('sem ids duplicados e com todo url(#…) resolvido, com o painel aberto', async ({ page }) => {
    for (const rota of ['/', '/queijos', '/queijos/canastra-curado']) {
      await page.goto(rota);
      await page.getByRole('button', { name: 'Abrir atendimento' }).click();
      await expect(painel(page)).toBeVisible();

      const { duplicados, orfaos } = await page.evaluate(() => {
        const vistos = new Set<string>();
        const duplicados = new Set<string>();
        for (const no of Array.from(document.querySelectorAll('[id]'))) {
          if (vistos.has(no.id)) duplicados.add(no.id);
          vistos.add(no.id);
        }
        const orfaos: string[] = [];
        for (const no of Array.from(document.querySelectorAll('*'))) {
          for (const atributo of Array.from(no.attributes)) {
            for (const achado of atributo.value.matchAll(/url\(#([^)]+)\)/g)) {
              const id = achado[1];
              if (id && !document.getElementById(id)) orfaos.push(id);
            }
          }
        }
        return { duplicados: Array.from(duplicados), orfaos };
      });
      expect(duplicados, rota).toEqual([]);
      expect(orfaos, rota).toEqual([]);
    }
  });

  for (const largura of [360, 768, 1920]) {
    test(`sem rolagem horizontal a ${largura} px com o painel aberto`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/queijos');
      await page.getByRole('button', { name: 'Abrir atendimento' }).click();
      await expect(painel(page)).toBeVisible();
      expect(await semRolagemHorizontal(page)).toBe(true);
    });
  }
});
