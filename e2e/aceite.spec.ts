import { expect, test, type Page } from './_apoio/teste';
import { semearSacola } from './_apoio/checkout';
import { caminhosIndexaveis } from '../lib/seo';

/**
 * Evidência automática do checklist de aceite (§14) onde nenhum outro spec cobria:
 * - item 12: sem rolagem horizontal de 360 a 1920 px em TODAS as rotas;
 * - item 2: Cormorant Garamond e Manrope carregadas com os pesos da §3.2.
 * Os espaçamentos da Home (item 3) já têm o teste "espaçamentos exatos da §5" em home.spec.ts.
 */

const LARGURAS = [360, 390, 768, 1024, 1440, 1920];

/** Rotas fixas do app que o sitemap não lista (privadas ou de erro). */
const ROTAS_INDEXAVEIS = caminhosIndexaveis();

const ROTAS_FORA_DO_SITEMAP = ['/sacola', '/checkout', '/queijos?origem=mundo', '/nao-existe'];

async function folgaHorizontal(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe('aceite §14: sem rolagem horizontal em todas as rotas', () => {
  test('o sitemap.xml lista as mesmas rotas indexáveis que os testes por largura percorrem', async ({
    request,
  }) => {
    const resposta = await request.get('/sitemap.xml');
    expect(resposta.status()).toBe(200);
    const noSitemap = [...(await resposta.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const url = new URL(m[1]!);
      return `${url.pathname}${url.search}`;
    });
    expect(noSitemap).toEqual(ROTAS_INDEXAVEIS);
    expect(ROTAS_INDEXAVEIS.length).toBeGreaterThanOrEqual(18);
  });

  for (const largura of LARGURAS) {
    for (const rota of [...ROTAS_INDEXAVEIS, ...ROTAS_FORA_DO_SITEMAP]) {
      test(`${rota} não rola na horizontal a ${largura} px`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(rota);
        expect(await folgaHorizontal(page)).toBeLessThanOrEqual(0);
      });
    }

    test(`sacola e checkout com item, e o painel de atendimento aberto, não rolam a ${largura} px`, async ({
      page,
    }) => {
      test.slow();
      await page.setViewportSize({ width: largura, height: 900 });
      await semearSacola(page);
      const estouros: string[] = [];
      for (const rota of ['/sacola', '/checkout']) {
        await page.goto(rota);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const folga = await folgaHorizontal(page);
        if (folga > 0) estouros.push(`${rota}: +${folga}px`);
      }
      await page.goto('/queijos/canastra-curado');
      await page.getByRole('button', { name: 'Abrir atendimento' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      const folga = await folgaHorizontal(page);
      if (folga > 0) estouros.push(`painel de atendimento: +${folga}px`);
      expect(estouros).toEqual([]);
    });
  }
});

test.describe('aceite §14: fontes e pesos da §3.2', () => {
  type Face = { familia: string; peso: string; estilo: string; status: string };

  async function carregarFaces(page: Page): Promise<Face[]> {
    return page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts).map((f) => ({
        familia: f.family,
        peso: f.weight,
        estilo: f.style,
        status: f.status,
      }));
    });
  }

  /** `weight` de um FontFace é "500" ou um intervalo "300 700" (fonte variável). */
  const cobre = (peso: string, alvo: number) => {
    const [min, max] = peso.split(/\s+/).map(Number);
    return min !== undefined && alvo >= min && alvo <= (max ?? min);
  };

  test('Cormorant Garamond (500, 600, itálico 500) e Manrope (400, 600) estão carregadas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const faces = (await carregarFaces(page)).filter((f) => f.status === 'loaded');
    const tem = (familia: RegExp, peso: number, estilo: string) =>
      faces.some((f) => familia.test(f.familia) && f.estilo === estilo && cobre(f.peso, peso));

    expect(tem(/Cormorant/, 500, 'normal'), 'Cormorant 500').toBe(true);
    expect(tem(/Cormorant/, 600, 'normal'), 'Cormorant 600').toBe(true);
    expect(tem(/Cormorant/, 500, 'italic'), 'Cormorant itálico 500').toBe(true);
    expect(tem(/Manrope/, 400, 'normal'), 'Manrope 400').toBe(true);
    expect(tem(/Manrope/, 600, 'normal'), 'Manrope 600').toBe(true);
  });

  test('cada papel tipográfico usa a família e o peso da tabela da §3.2', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const estilo = (alvo: ReturnType<Page['locator']>) =>
      alvo.first().evaluate((no) => {
        const e = getComputedStyle(no);
        return {
          familia: e.fontFamily,
          peso: e.fontWeight,
          estilo: e.fontStyle,
          tam: e.fontSize,
          cor: e.color,
        };
      });

    const h1 = await estilo(page.getByRole('heading', { level: 1 }));
    expect(h1).toMatchObject({ peso: '500', tam: '76px' });
    expect(h1.familia).toMatch(/Cormorant/);

    const enfase = await estilo(page.getByRole('heading', { level: 1 }).locator('em'));
    // Item 4 da §14: itálico dourado.
    expect(enfase).toMatchObject({ peso: '500', estilo: 'italic', cor: 'rgb(201, 162, 75)' });
    expect(enfase.familia).toMatch(/Cormorant/);

    const h2 = await estilo(page.getByRole('heading', { level: 2 }));
    expect(h2).toMatchObject({ peso: '500', tam: '48px' });
    expect(h2.familia).toMatch(/Cormorant/);

    // Nome do queijo em cartão: Cormorant 600, 28 px.
    const nome = await estilo(page.getByRole('article').first().getByRole('heading', { level: 3 }));
    expect(nome).toMatchObject({ peso: '600', tam: '28px' });
    expect(nome.familia).toMatch(/Cormorant/);

    // Corpo: Manrope 400, 16 px.
    const corpo = await estilo(page.locator('body'));
    expect(corpo).toMatchObject({ peso: '400', tam: '16px' });
    expect(corpo.familia).toMatch(/Manrope/);

    // Botões: Manrope 600.
    const botao = await estilo(page.getByRole('link', { name: 'Explorar a cave' }));
    expect(botao.peso).toBe('600');
    expect(botao.familia).toMatch(/Manrope/);

    // Sobretítulo: Manrope 600, 12 px, caixa alta, 0.18em.
    const sobretitulo = await page
      .locator('main')
      .getByText('CURADORIA DE QUEIJOS FINOS', { exact: true })
      .first()
      .evaluate((no) => {
        const e = getComputedStyle(no);
        return { peso: e.fontWeight, familia: e.fontFamily, tam: e.fontSize };
      });
    expect(sobretitulo.peso).toBe('600');
    expect(sobretitulo.tam).toBe('12px');
    expect(sobretitulo.familia).toMatch(/Manrope/);
  });

  test('o h1 do produto usa Cormorant 500 a 56 px e o preço grande, 600 a 40 px em ouro', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos/canastra-curado');
    const h1 = await page.getByRole('heading', { level: 1 }).evaluate((no) => {
      const e = getComputedStyle(no);
      return { peso: e.fontWeight, tam: e.fontSize };
    });
    expect(h1).toEqual({ peso: '500', tam: '56px' });

    const preco = await page.getByTestId('preco-do-painel').evaluate((no) => {
      const e = getComputedStyle(no);
      return { peso: e.fontWeight, tam: e.fontSize, cor: e.color, familia: e.fontFamily };
    });
    expect(preco).toMatchObject({ peso: '600', tam: '40px', cor: 'rgb(201, 162, 75)' });
    expect(preco.familia).toMatch(/Cormorant/);
  });
});

test.describe('aceite §14: hero e faixa de confiança da Home', () => {
  test('hero: pílula "Arraste para girar" e etiqueta do Canastra no canto inferior direito da ilustração', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const hero = page.locator('section').filter({ has: page.getByRole('heading', { level: 1 }) });
    const pilula = hero.getByText('Arraste para girar');
    await expect(pilula).toBeVisible();

    // A etiqueta é o contêiner mais interno que tem o nome (o palco também o contém, vem antes).
    const etiqueta = hero
      .locator('div')
      .filter({ has: page.getByText('Canastra curado', { exact: true }) })
      .last();
    await expect(etiqueta.getByText('BRASIL · SERRA DA CANASTRA, MG')).toBeVisible();
    await expect(etiqueta.getByText('Leite cru · 60 dias de cura')).toBeVisible();

    // O palco é o pai comum da ilustração, da pílula e da etiqueta.
    const palco = etiqueta.locator('..');
    const caixaPalco = (await palco.boundingBox())!;
    const caixaEtiqueta = (await etiqueta.boundingBox())!;
    expect(
      Math.round(caixaPalco.x + caixaPalco.width - (caixaEtiqueta.x + caixaEtiqueta.width)),
    ).toBeLessThanOrEqual(2);
    expect(
      Math.round(caixaPalco.y + caixaPalco.height - (caixaEtiqueta.y + caixaEtiqueta.height)),
    ).toBeLessThanOrEqual(2);
    // A pílula fica no canto superior esquerdo: a etiqueta está à direita e abaixo dela.
    const caixaPilula = (await pilula.boundingBox())!;
    expect(caixaEtiqueta.x).toBeGreaterThan(caixaPilula.x);
    expect(caixaEtiqueta.y).toBeGreaterThan(caixaPilula.y);
    // A ilustração A.3 (SVG) está no palco.
    await expect(palco.locator('svg').first()).toBeVisible();
  });

  test('faixa de confiança: 4 itens, cada um com ícone dourado', async ({ page }) => {
    await page.goto('/');
    const faixa = page.getByRole('region', { name: 'Garantias' });
    const itens = faixa.getByRole('listitem');
    await expect(itens).toHaveCount(4);
    await expect(itens.locator('p:first-child')).toHaveText([
      'Entrega refrigerada',
      'Produtores certificados',
      '5% de desconto no Pix',
      'Fale com um queijista',
    ]);
    const cores = await itens.evaluateAll((nos) =>
      nos.map((no) => {
        const icone = no.querySelector('svg');
        return icone ? getComputedStyle(icone).color : 'sem ícone';
      }),
    );
    expect(cores).toEqual(Array(4).fill('rgb(201, 162, 75)'));
  });
});
