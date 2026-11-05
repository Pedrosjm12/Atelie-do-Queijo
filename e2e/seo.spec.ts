import { expect, test } from './_apoio/teste';
import { caminhosIndexaveis } from '../lib/seo';

const BASE = 'http://localhost:3000';
// O e2e roda `next build` sem VERCEL_ENV: ambiente de desenvolvimento/prévia (robots bloqueia tudo).
const EM_PRODUCAO = process.env.VERCEL_ENV === 'production';

async function meta(page: import('@playwright/test').Page, seletor: string) {
  return page.locator(seletor).first().getAttribute('content');
}

for (const caminho of caminhosIndexaveis()) {
  test(`SEO de ${caminho}: canônica, Open Graph e Twitter`, async ({ page }) => {
    await page.goto(caminho);
    // O Next monta a canônica da Home sem a barra final.
    const absoluta = caminho === '/' ? BASE : new URL(caminho, BASE).href;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluta);
    expect(await meta(page, 'meta[property="og:url"]')).toBe(absoluta);
    expect(await meta(page, 'meta[property="og:title"]')).toBeTruthy();
    expect(await meta(page, 'meta[property="og:description"]')).toBeTruthy();
    expect(await meta(page, 'meta[property="og:image"]')).toMatch(/\/opengraph-image/);
    expect(await meta(page, 'meta[name="twitter:image"]')).toMatch(/\/opengraph-image/);
  });
}

test('filtro de /queijos mantém a canônica da listagem', async ({ page }) => {
  await page.goto('/queijos?origem=brasil');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${BASE}/queijos`);
});

test('sitemap.xml lista exatamente os caminhos indexáveis', async ({ request }) => {
  const resposta = await request.get('/sitemap.xml');
  expect(resposta.ok()).toBe(true);
  const xml = await resposta.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toEqual(caminhosIndexaveis().map((c) => new URL(c, BASE).href));
});

test('robots.txt nunca desabilita sacola e checkout por Disallow específico', async ({
  request,
}) => {
  const texto = await (await request.get('/robots.txt')).text();
  expect(texto).not.toMatch(/Disallow:\s*\/sacola/);
  expect(texto).not.toMatch(/Disallow:\s*\/checkout/);
  if (EM_PRODUCAO) {
    expect(texto).toMatch(/Allow:\s*\//);
    expect(texto).toMatch(/Sitemap:\s*https:\/\/.+\/sitemap\.xml/);
  } else {
    expect(texto).toMatch(/Disallow:\s*\/\s*$/m);
  }
});
