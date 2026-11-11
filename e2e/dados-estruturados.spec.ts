import { QUEIJOS } from '../data/cheeses';
import {
  ANO_PRODUTOR_CANASTRA_FICTICIO,
  CNPJ_FICTICIO,
  ENDERECO_FICTICIO,
  NUMERO_WHATSAPP_FICTICIO,
  PRODUTOR_CANASTRA_FICTICIO,
} from '../data/ficticio';
import { caminhosIndexaveis } from '../lib/seo';
import { expect, test } from './_apoio/teste';

type No = Record<string, unknown>;

async function lerJsonLd(page: import('@playwright/test').Page, caminho: string): Promise<No[]> {
  await page.goto(caminho);
  const blocos = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocos.flatMap((texto) => {
    const analisado = JSON.parse(texto) as No | No[];
    return Array.isArray(analisado) ? analisado : [analisado];
  });
}

function semColchetes(valor: unknown): void {
  if (typeof valor === 'string') expect(valor).not.toContain('[');
  else if (Array.isArray(valor)) valor.forEach(semColchetes);
  else if (valor && typeof valor === 'object') Object.values(valor).forEach(semColchetes);
}

const tipos = (dados: No[]) => dados.map((d) => d['@type']);

test('o logo da Organization (/icon.svg) responde 200 como SVG', async ({ request }) => {
  const resposta = await request.get('/icon.svg');
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()['content-type']).toContain('image/svg+xml');
});

test('Home: Organization e WebSite, sem SearchAction nem dados de contato', async ({ page }) => {
  const dados = await lerJsonLd(page, '/');
  expect(tipos(dados)).toEqual(['Organization', 'WebSite']);
  for (const d of dados) expect(d['@context']).toBe('https://schema.org');
  expect(JSON.stringify(dados)).not.toMatch(/SearchAction|telephone|address|taxID|vatID/);
  semColchetes(dados);
});

test('Canastra: Product com os três Offer da spec e BreadcrumbList', async ({ page }) => {
  const dados = await lerJsonLd(page, '/queijos/canastra-curado');
  expect(tipos(dados)).toEqual(['Product', 'BreadcrumbList']);
  const produto = dados[0] as No;
  expect(produto.name).toBe('Canastra curado');
  const ofertas = produto.offers as No[];
  expect(ofertas.map((o) => o.price)).toEqual(['136.00', '78.00', '49.00']);
  for (const o of ofertas) {
    expect(o['@type']).toBe('Offer');
    expect(o.priceCurrency).toBe('BRL');
    expect(o.availability).toBe('https://schema.org/InStock');
  }
  const trilha = (dados[1] as No).itemListElement as No[];
  expect(trilha.map((i) => i.name)).toEqual(['Início', 'Queijos', 'Brasil', 'Canastra curado']);
  semColchetes(dados);
});

test('Brie: Product e BreadcrumbList do Mundo', async ({ page }) => {
  const dados = await lerJsonLd(page, '/queijos/brie-frances');
  expect(tipos(dados)).toEqual(['Product', 'BreadcrumbList']);
  expect(((dados[0] as No).offers as No[]).map((o) => o.price)).toEqual(['224.95', '122.48']);
  const trilha = (dados[1] as No).itemListElement as No[];
  expect(trilha.map((i) => i.name)).toEqual(['Início', 'Queijos', 'Mundo', 'Brie francês']);
  semColchetes(dados);
});

test('Artigo sem corpo: só BreadcrumbList (nenhum Article)', async ({ page }) => {
  const dados = await lerJsonLd(page, '/aprenda/queijo-e-vinho');
  expect(tipos(dados)).toEqual(['BreadcrumbList']);
  const trilha = (dados[0] as No).itemListElement as No[];
  expect(trilha.map((i) => i.name)).toEqual([
    'Início',
    'Aprenda',
    'Queijo e vinho: um guia sem regras chatas',
  ]);
  semColchetes(dados);
});

test('Kits e produtores não publicam JSON-LD', async ({ page }) => {
  for (const caminho of ['/presentes', '/produtores']) {
    expect(await lerJsonLd(page, caminho)).toEqual([]);
  }
});

test.describe('todas as páginas de queijo', () => {
  for (const queijo of QUEIJOS) {
    test(`${queijo.slug}: Product válido com um Offer por formato`, async ({ page }) => {
      const dados = await lerJsonLd(page, `/queijos/${queijo.slug}`);
      expect(tipos(dados)).toEqual(['Product', 'BreadcrumbList']);
      const produto = dados[0] as No;
      expect(produto['@context']).toBe('https://schema.org');
      expect(produto.name).toBe(queijo.nome);
      expect(produto.url).toMatch(new RegExp(`^https?://[^/]+/queijos/${queijo.slug}$`));
      const ofertas = produto.offers as No[];
      expect(ofertas).toHaveLength(queijo.formatos.length);
      for (const o of ofertas) {
        expect(o['@type']).toBe('Offer');
        expect(o.price).toMatch(/^\d+\.\d{2}$/);
        expect(o.priceCurrency).toBe('BRL');
        expect(o.availability).toBe('https://schema.org/InStock');
      }
      const trilha = (dados[1] as No).itemListElement as No[];
      expect(trilha.map((i) => i.position)).toEqual([1, 2, 3, 4]);
      expect(trilha.at(-1)?.name).toBe(queijo.nome);
      semColchetes(dados);
    });
  }
});

test('nenhuma rota indexável publica dado de data/ficticio.ts, contato ou marca/imagem', async ({
  page,
}) => {
  const ficticios = [
    NUMERO_WHATSAPP_FICTICIO,
    CNPJ_FICTICIO,
    ENDERECO_FICTICIO,
    PRODUTOR_CANASTRA_FICTICIO,
    ANO_PRODUTOR_CANASTRA_FICTICIO,
  ];
  for (const caminho of caminhosIndexaveis()) {
    const dados = await lerJsonLd(page, caminho);
    const texto = JSON.stringify(dados);
    for (const f of ficticios) expect(texto, `${caminho} contém ${f}`).not.toContain(f);
    expect(texto, caminho).not.toMatch(/telephone|taxID|vatID|"address"|"brand"|"image"/);
    semColchetes(dados);
  }
});
