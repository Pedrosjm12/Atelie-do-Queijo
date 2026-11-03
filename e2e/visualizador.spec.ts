import { expect, test, type Page, type Route } from '@playwright/test';
import { MODELOS_3D } from '../data/modelos3d';
import { ILUSTRACOES_DE_PRODUTO } from '../components/ilustracoes/CanastraProduto';
import { glbSintetico } from './_apoio/glbSintetico';

const rota = '/queijos/canastra-curado';
const ROTULO_CORTADO = 'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras';
const SEM_GLB = Object.keys(MODELOS_3D).length === 0;

/** Anota toda requisição que sai da página (prova de que não há 3D nem domínio de terceiros). */
function registrarRequisicoes(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  return urls;
}

test.describe('visualizador do queijo, sem GLB (o caso real de hoje)', () => {
  test.skip(!SEM_GLB, 'Já há GLB no manifesto: vale o bloco com GLB.');

  test('zero custo: sem model-viewer, sem requisição a /models/ nem a outro domínio', async ({
    page,
  }) => {
    const urls = registrarRequisicoes(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const origem = new URL(page.url()).origin;
    await page.waitForLoadState('load');
    await page.getByRole('toolbar', { name: 'Controles do 3D' }).scrollIntoViewIfNeeded();
    // Espera determinística: o navegador fica ocioso (o gatilho do 3D, quando houver GLB) e
    // passa um intervalo curto para qualquer requisição disparada por ele aparecer.
    await page.evaluate(
      () =>
        new Promise<void>((ok) =>
          requestIdleCallback(() => setTimeout(ok, 300), { timeout: 3000 }),
        ),
    );

    expect(await page.evaluate(() => customElements.get('model-viewer'))).toBeUndefined();
    expect(await page.locator('model-viewer').count()).toBe(0);
    expect(urls.filter((u) => u.includes('/models/'))).toEqual([]);
    expect(urls.filter((u) => new URL(u).origin !== origem)).toEqual([]);
    await expect(page.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
    await expect(page.getByText('Ver na mesa')).toHaveCount(0);
  });

  test('Girar fica desligado e desabilitado, com a descrição para leitor de tela', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const girar = page.getByRole('button', { name: 'Girar' });
    await expect(girar).toHaveAttribute('aria-pressed', 'false');
    await expect(girar).toHaveAttribute('aria-disabled', 'true');
    await expect(girar).toHaveAccessibleDescription('Giro disponível com o modelo 3D');
    await girar.click({ force: true }); // aria-disabled: o Playwright não clica sem `force`
    await expect(girar).toHaveAttribute('aria-pressed', 'false');
  });

  test('a dica só promete o toque duplo: "Arraste para girar" exige GLB', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    await expect(page.getByTestId('dica-3d')).toHaveText('Toque duas vezes para aproximar');
    await expect(page.getByText('Arraste para girar')).toHaveCount(0);
  });

  test('movimento reduzido: o zoom do SVG não tem transição', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const duracao = await page
      .getByRole('img', { name: ROTULO_CORTADO })
      .evaluate((svg) => getComputedStyle(svg.parentElement ?? svg).transitionDuration);
    expect(parseFloat(duracao)).toBeLessThan(0.001); // o CSS global usa ~0,00001 s
  });
});

test.describe('visualizador do queijo: controles sobre o SVG', () => {
  test('Tela cheia leva o palco à tela cheia e a saída devolve o aria-pressed', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const botao = page.getByRole('button', { name: 'Tela cheia' });
    await expect(botao).toHaveAttribute('aria-pressed', 'false');

    await botao.click();
    await expect(botao).toHaveAttribute('aria-pressed', 'true');
    const barraDentro = await page.evaluate(
      () =>
        document.fullscreenElement?.contains(document.querySelector('[role="toolbar"]')) ?? false,
    );
    expect(barraDentro).toBe(true);
    await expect(page.getByRole('toolbar', { name: 'Controles do 3D' })).toBeVisible();

    // O Esc real é do navegador (teclas simuladas não o acionam em modo headless): a saída é
    // pela API e dispara o mesmo `fullscreenchange` que o Esc dispara.
    await page.evaluate(() => document.exitFullscreen());
    await expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  });

  test('duplo clique no palco liga e desliga o Aproximar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const aproximar = page.getByRole('button', { name: 'Aproximar' });
    const ilustracao = page.getByRole('img', { name: ROTULO_CORTADO });
    await expect(aproximar).toHaveAttribute('aria-pressed', 'false');
    await ilustracao.dblclick();
    await expect(aproximar).toHaveAttribute('aria-pressed', 'true');
    await ilustracao.dblclick();
    await expect(aproximar).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('visualizador do queijo: navegador sem Fullscreen API', () => {
  test('Tela cheia fica aria-disabled com a descrição "indisponível neste navegador"', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(rota);
    const botao = page.getByRole('button', { name: 'Tela cheia' });
    await expect(botao).toHaveAttribute('aria-disabled', 'true');
    await expect(botao).toHaveAccessibleDescription('Tela cheia indisponível neste navegador');
    await botao.click({ force: true });
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  });
});

// Entrada do manifesto compatível com a variante inicial da página: a página abre no corte quando o
// queijo tem arte A.5 (só então `cortado` precisa existir) e na peça inteira nos demais.
const ENTRADA = Object.entries(MODELOS_3D).find(
  ([slug, modelos]) => ILUSTRACOES_DE_PRODUTO[slug] === undefined || modelos.cortado,
);
const SLUG_GLB = ENTRADA?.[0] ?? '';
const ARTE = ILUSTRACOES_DE_PRODUTO[SLUG_GLB];
const INICIAL = ARTE ? 'cortado' : 'inteiro';
// O rótulo sai da mesma fonte do componente (o `alt` do modelo é o rótulo do SVG).
const ROTULO_INICIAL = ARTE?.rotulos[INICIAL] ?? '';
const TEM_CORTE_ALTERNATIVO = ARTE !== undefined && ENTRADA?.[1].cortado === true;

test.describe('visualizador do queijo, com GLB (mockado por page.route)', () => {
  test.skip(
    ENTRADA === undefined,
    'Sem GLB compatível no manifesto (D21): passa a rodar sozinho com o primeiro modelo.',
  );

  const slug = SLUG_GLB;

  /** Entrega um GLB sintético no lugar do arquivo real (nenhum binário no repositório). */
  async function mockarGlb(page: Page) {
    const pedidos: string[] = [];
    await page.route('**/models/*.glb', (rota) => {
      pedidos.push(new URL(rota.request().url()).pathname);
      return rota.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glbSintetico() });
    });
    return pedidos;
  }

  test('carrega tarde, com os atributos da §11 e sem "ar", sem sair do próprio domínio', async ({
    page,
  }) => {
    const urls = registrarRequisicoes(page);
    await mockarGlb(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/queijos/${slug}`);
    const origem = new URL(page.url()).origin;
    const modelo = page.locator('model-viewer');
    await expect(modelo).toBeAttached({ timeout: 30_000 });
    await expect(modelo).toHaveAttribute('rotation-per-second', '36deg');
    await expect(modelo).toHaveAttribute('exposure', '0.9');
    await expect(modelo).toHaveAttribute('shadow-intensity', '1');
    await expect(modelo).toHaveAttribute('interaction-prompt', 'none');
    await expect(modelo).toHaveAttribute('touch-action', 'pan-y');
    await expect(modelo).not.toHaveAttribute('ar', /.*/);
    await expect(page.getByText('Ver na mesa')).toHaveCount(0);
    // O elemento definido pela biblioteca (e não um <model-viewer> morto) e o decodificador local.
    expect(await page.evaluate(() => customElements.get('model-viewer') !== undefined)).toBe(true);
    const locais = await page.evaluate(() => {
      const el = customElements.get('model-viewer') as unknown as {
        dracoDecoderLocation: string;
        ktx2TranscoderLocation: string;
      };
      return [el.dracoDecoderLocation, el.ktx2TranscoderLocation];
    });
    expect(locais).toEqual(['/decodificadores/draco/', '/decodificadores/basis/']);
    expect(urls.filter((u) => new URL(u).origin !== origem)).toEqual([]);
  });

  test('o modelo substitui o SVG quando o `load` chega e Girar à direita muda a órbita', async ({
    page,
  }) => {
    const pedidos = await mockarGlb(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/queijos/${slug}`);
    const modelo = page.locator('model-viewer');
    await expect(modelo).toBeAttached({ timeout: 30_000 });
    await expect
      .poll(() => modelo.evaluate((el) => (el as HTMLElement & { loaded: boolean }).loaded), {
        timeout: 30_000,
      })
      .toBe(true);
    // Pronto: só o texto de leitor de tela fica no aviso (aprovado pelo dono).
    await expect(page.locator('p[role="status"]')).toHaveText(
      'Peça pronta. Use Girar à esquerda ou à direita.',
    );
    expect(pedidos.length).toBeGreaterThan(0);
    // O SVG sai da árvore de acessibilidade e o modelo é o que a leitora de tela encontra.
    await expect(page.locator('svg[role="img"]:visible')).toHaveCount(0);
    await expect(page.getByRole('img', { name: ROTULO_INICIAL })).toHaveCount(1);
    // Girar sem arrastar (WCAG 2.5.7): a órbita muda 30° e o giro automático para.
    const theta = () =>
      modelo.evaluate(
        (el) =>
          (el as HTMLElement & { getCameraOrbit(): { theta: number } }).getCameraOrbit().theta,
      );
    const antes = await theta();
    await page.getByRole('button', { name: 'Girar à direita' }).click();
    await expect.poll(theta).toBeCloseTo(antes - Math.PI / 6, 2);
    await expect(page.getByRole('button', { name: 'Girar', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('Ver por dentro troca o arquivo e o aviso volta a "Preparando"', async ({ page }) => {
    test.skip(!TEM_CORTE_ALTERNATIVO, 'Sem GLB cortado e arte A.5 para alternar.');
    const pedidos = await mockarGlb(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/queijos/${slug}`);
    await expect.poll(() => pedidos.length, { timeout: 30_000 }).toBeGreaterThan(0);
    const antes = pedidos.length;
    await page.getByRole('button', { name: 'Ver por dentro' }).click();
    await expect.poll(() => pedidos.length).toBeGreaterThan(antes);
  });

  test('anel de foco dourado aparece no modelo ao chegar nele com Tab', async ({ page }) => {
    await mockarGlb(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/queijos/${slug}`);
    const modelo = page.locator('model-viewer');
    await expect
      .poll(() => modelo.evaluate((el) => (el as HTMLElement & { loaded?: boolean }).loaded), {
        timeout: 30_000,
      })
      .toBe(true);
    // Tab até o modelo (teclado: o :focus-visible só vale com a navegação por teclado).
    let achou = false;
    for (let i = 0; i < 40 && !achou; i++) {
      await page.keyboard.press('Tab');
      achou = await page.evaluate(() => document.activeElement?.tagName === 'MODEL-VIEWER');
    }
    expect(achou).toBe(true);
    const contorno = await modelo.evaluate((el) => {
      const camada = el.closest('[data-pronto]') as HTMLElement;
      const estilo = getComputedStyle(camada);
      return {
        foco: camada.dataset.foco,
        estilo: estilo.outlineStyle,
        largura: estilo.outlineWidth,
        cor: estilo.outlineColor,
        ouro: getComputedStyle(document.documentElement).getPropertyValue('--ouro').trim(),
      };
    });
    expect(contorno.foco).toBe('true');
    expect(contorno.estilo).toBe('solid');
    expect(contorno.largura).toBe('2px');
    expect(contorno.cor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('GLB com erro (500): volta ao SVG, sem texto de erro', async ({ page }) => {
    await page.route('**/models/*.glb', (rota) => rota.fulfill({ status: 500 }));
    await page.setViewportSize({ width: 1440, height: 900 });
    const pedido = page.waitForRequest('**/models/*.glb', { timeout: 30_000 });
    await page.goto(`/queijos/${slug}`);
    await pedido; // só depois de o GLB ter sido pedido a ausência do modelo prova a volta ao SVG
    await expect(page.locator('model-viewer')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.locator('p[role="status"]')).toHaveText('');
    await expect(page.getByRole('img', { name: ROTULO_INICIAL })).toBeVisible();
  });

  test('GLB que nunca chega: depois de 20 s volta ao SVG (relógio simulado)', async ({ page }) => {
    const pendentes: Route[] = [];
    await page.clock.install();
    await page.route('**/models/*.glb', (rota) => {
      pendentes.push(rota); // fica pendente até o fim do teste
    });
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/queijos/${slug}`);
      await expect(page.locator('p[role="status"]')).toHaveText('Preparando a peça…', {
        timeout: 30_000,
      });
      await page.clock.fastForward(20_500);
      await expect(page.locator('p[role="status"]')).toHaveText('');
      await expect(page.locator('model-viewer')).toHaveCount(0);
    } finally {
      await Promise.all(pendentes.map((rota) => rota.abort().catch(() => {})));
    }
  });

  test('sem WebGL: SVG com a mensagem da §7.5 e nenhum pedido de GLB', async ({ page }) => {
    const pedidos = await mockarGlb(page);
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string) {
        if (tipo === 'webgl' || tipo === 'webgl2') return null;
        return original.call(this, tipo as '2d');
      } as typeof original;
    });
    await page.goto(`/queijos/${slug}`);
    await expect(
      page.getByText('Seu navegador não exibe o 3D. Veja as fotos abaixo.'),
    ).toBeVisible();
    expect(await page.locator('model-viewer').count()).toBe(0);
    expect(pedidos).toEqual([]);
  });

  test('a 360 px a mensagem sem WebGL cabe em uma linha', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string) {
        if (tipo === 'webgl' || tipo === 'webgl2') return null;
        return original.call(this, tipo as '2d');
      } as typeof original;
    });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/queijos/${slug}`);
    const aviso = page.locator('p[role="status"]');
    await expect(aviso).toHaveText('Seu navegador não exibe o 3D. Veja as fotos abaixo.');
    const altura = await aviso.evaluate((el) => el.getBoundingClientRect().height);
    expect(altura).toBeLessThanOrEqual(20); // uma linha de 16 px
  });
});
