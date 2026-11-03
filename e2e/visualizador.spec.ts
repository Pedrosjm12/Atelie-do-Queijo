import { expect, test, type Page } from '@playwright/test';
import { MODELOS_3D } from '../data/modelos3d';

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

test.describe('visualizador do queijo, com GLB', () => {
  test.skip(SEM_GLB, 'Sem GLB no manifesto (D21): passa a rodar sozinho com o primeiro modelo.');

  const slug = Object.keys(MODELOS_3D)[0] ?? '';

  test('carrega o model-viewer tarde, com os atributos da §11 e sem "ar"', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/queijos/${slug}`);
    const modelo = page.locator('model-viewer');
    await expect(modelo).toBeAttached({ timeout: 30_000 });
    await expect(modelo).toHaveAttribute('rotation-per-second', '36deg');
    await expect(modelo).toHaveAttribute('exposure', '0.9');
    await expect(modelo).toHaveAttribute('shadow-intensity', '1');
    await expect(modelo).toHaveAttribute('interaction-prompt', 'none');
    await expect(modelo).not.toHaveAttribute('ar', /.*/);
  });

  test('sem WebGL: SVG com a mensagem da §7.5', async ({ page }) => {
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
  });
});
