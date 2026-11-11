import { describe, expect, it } from 'vitest';
import { ARTIGOS, type Artigo } from '@/data/artigos';
import { QUEIJOS, type Cheese } from '@/data/cheeses';
import {
  CNPJ_FICTICIO,
  ENDERECO_FICTICIO,
  NUMERO_WHATSAPP_FICTICIO,
  PRODUTOR_CANASTRA_FICTICIO,
} from '@/data/ficticio';
import {
  artigo,
  organizacao,
  produto,
  serializar,
  siteWeb,
  trilhaDeNavegacao,
  type DadoEstruturado,
} from './dadosEstruturados';

const SITE = new URL('https://www.exemplo.com.br');

/** Versões que afirmam não nulo, para os casos com dados válidos. */
const pr = (q: Cheese, site: URL) => produto(q, site) as DadoEstruturado;
const tr = (...args: Parameters<typeof trilhaDeNavegacao>) =>
  trilhaDeNavegacao(...args) as DadoEstruturado;
// Valores completos (nunca o ano "1985" sozinho: substring curta dá falso positivo).
const FICTICIOS = [
  NUMERO_WHATSAPP_FICTICIO,
  CNPJ_FICTICIO,
  ENDERECO_FICTICIO,
  PRODUTOR_CANASTRA_FICTICIO,
];

function todosOsDados(): DadoEstruturado[] {
  return [
    organizacao(SITE),
    siteWeb(SITE),
    ...QUEIJOS.flatMap((q) => [
      pr(q, SITE),
      tr(
        [
          { href: '/', texto: 'Início' },
          { href: '/queijos', texto: 'Queijos' },
        ],
        { href: `/queijos/${q.slug}`, texto: q.nome },
        SITE,
      ),
    ]),
    ...ARTIGOS.map((a) =>
      tr(
        [
          { href: '/', texto: 'Início' },
          { href: '/aprenda', texto: 'Aprenda' },
        ],
        { href: `/aprenda/${a.slug}`, texto: a.titulo },
        SITE,
      ),
    ),
  ];
}

function textosDe(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(textosDe);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(textosDe);
  return [];
}

describe('regra única: sem lacuna e sem dado fictício', () => {
  it('nenhum valor textual contém "["', () => {
    for (const dado of todosOsDados()) {
      for (const v of textosDe(dado)) expect(v).not.toContain('[');
    }
  });

  it('nenhum valor de data/ficticio.ts aparece', () => {
    for (const dado of todosOsDados()) {
      const texto = JSON.stringify(dado);
      for (const f of FICTICIOS) expect(texto).not.toContain(f);
    }
  });
});

describe('organizacao e siteWeb', () => {
  it('Organization só com nome, url e logo', () => {
    const o = organizacao(SITE);
    expect(o['@type']).toBe('Organization');
    expect(Object.keys(o).sort()).toEqual(['@context', '@type', 'logo', 'name', 'url']);
    expect(o.logo).toBe('https://www.exemplo.com.br/icon.svg');
  });

  it('WebSite em pt-BR e sem SearchAction', () => {
    const w = siteWeb(SITE);
    expect(w['@type']).toBe('WebSite');
    expect(w.inLanguage).toBe('pt-BR');
    expect(JSON.stringify(w)).not.toContain('SearchAction');
    expect(w).not.toHaveProperty('potentialAction');
  });
});

describe('produto', () => {
  const canastra = QUEIJOS.find((q) => q.slug === 'canastra-curado') as Cheese;

  it('Canastra: três Offer com preço em texto, BRL, InStock e url do produto', () => {
    const p = pr(canastra, SITE);
    expect(p['@type']).toBe('Product');
    expect(p).not.toHaveProperty('brand');
    expect(p).not.toHaveProperty('image');
    const ofertas = p.offers as readonly Record<string, unknown>[];
    expect(ofertas.map((o) => o.price)).toEqual(['136.00', '78.00', '49.00']);
    for (const o of ofertas) {
      expect(o['@type']).toBe('Offer');
      expect(o.priceCurrency).toBe('BRL');
      expect(o.availability).toBe('https://schema.org/InStock');
      expect(o.url).toBe('https://www.exemplo.com.br/queijos/canastra-curado');
    }
  });

  it('todo price tem ponto e duas casas, e todo formato vira um Offer', () => {
    for (const q of QUEIJOS) {
      const ofertas = pr(q, SITE).offers as readonly Record<string, unknown>[];
      expect(ofertas).toHaveLength(q.formatos.length);
      for (const o of ofertas) expect(o.price).toMatch(/^\d+\.\d{2}$/);
    }
    const caso = { ...canastra, formatos: [{ ...canastra.formatos[0], preco: 21499 }] } as Cheese;
    expect((pr(caso, SITE).offers as { price: string }[])[0]?.price).toBe('214.99');
  });

  it('esgotado vira OutOfStock', () => {
    const esgotado = { ...canastra, estoque: { situacao: 'esgotado' } } as Cheese;
    const o = (pr(esgotado, SITE).offers as { availability: string }[])[0];
    expect(o?.availability).toBe('https://schema.org/OutOfStock');
  });

  it('nunca Offer com preço nulo: sem preço válido, omite offers', () => {
    const semPreco = {
      ...canastra,
      formatos: [{ ...canastra.formatos[0], preco: null }],
    } as unknown as Cheese;
    expect(pr(semPreco, SITE)).not.toHaveProperty('offers');
  });

  it('omite a descrição quando a nota é lacuna', () => {
    const lacuna = { ...canastra, nota: '[A DEFINIR]' } as Cheese;
    expect(pr(lacuna, SITE)).not.toHaveProperty('description');
  });
});

describe('trilhaDeNavegacao', () => {
  it('BreadcrumbList com posições, nomes e URLs absolutas', () => {
    const t = tr(
      [
        { href: '/', texto: 'Início' },
        { href: '/queijos?origem=brasil', texto: 'Brasil' },
      ],
      { href: '/queijos/canastra-curado', texto: 'Canastra curado' },
      SITE,
    );
    expect(t['@type']).toBe('BreadcrumbList');
    expect(t.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.exemplo.com.br/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Brasil',
        item: 'https://www.exemplo.com.br/queijos?origem=brasil',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Canastra curado',
        item: 'https://www.exemplo.com.br/queijos/canastra-curado',
      },
    ]);
  });
});

describe('artigo', () => {
  it('é nulo enquanto o corpo é null (todos os artigos de hoje)', () => {
    for (const a of ARTIGOS) expect(artigo(a, SITE)).toBeNull();
  });

  it('com corpo, devolve Article sem lacunas', () => {
    const base = ARTIGOS[0] as Artigo;
    const com: Artigo = { ...base, corpo: ['Primeiro parágrafo real.'] };
    const a = artigo(com, SITE);
    expect(a?.['@type']).toBe('Article');
    expect(a?.headline).toBe(base.titulo);
    expect(a?.url).toBe(`https://www.exemplo.com.br/aprenda/${base.slug}`);
    for (const v of textosDe(a)) expect(v).not.toContain('[');
  });
});

describe('serializar', () => {
  it('escapa "<" e não deixa fechar o script', () => {
    const malicioso: DadoEstruturado = {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: '</script><script>alert(1)</script>',
    };
    const saida = serializar(malicioso);
    expect(saida).not.toContain('<');
    expect(saida).toContain('\\u003c/script>');
    expect((JSON.parse(saida) as { name: string }).name).toBe(malicioso.name);
  });

  it('aceita lista', () => {
    expect(JSON.parse(serializar([organizacao(SITE), siteWeb(SITE)]))).toHaveLength(2);
  });
});

describe('fronteiras do produto', () => {
  const canastra = QUEIJOS.find((q) => q.slug === 'canastra-curado') as Cheese;
  const ofertasDe = (q: Cheese) => pr(q, SITE).offers as readonly Record<string, unknown>[];

  it('esgotado: todos os Offer viram OutOfStock', () => {
    const esgotado = { ...canastra, estoque: { situacao: 'esgotado' } } as Cheese;
    for (const o of ofertasDe(esgotado))
      expect(o.availability).toBe('https://schema.org/OutOfStock');
  });

  it('últimas unidades continua InStock', () => {
    const ultimas = { ...canastra, estoque: { situacao: 'ultimas', restam: 2 } } as Cheese;
    for (const o of ofertasDe(ultimas)) expect(o.availability).toBe('https://schema.org/InStock');
  });

  it('um formato com preço nulo é omitido e os demais permanecem', () => {
    const [a, b, c] = canastra.formatos;
    const parcial = { ...canastra, formatos: [a, { ...b, preco: null }, c] } as unknown as Cheese;
    expect(ofertasDe(parcial).map((o) => o.price)).toEqual(['136.00', '49.00']);
  });

  it('todos os formatos nulos: sem a chave offers (nunca lista vazia)', () => {
    const nulos = {
      ...canastra,
      formatos: canastra.formatos.map((f) => ({ ...f, preco: null })),
    } as unknown as Cheese;
    expect(pr(nulos, SITE)).not.toHaveProperty('offers');
  });

  it('centavos que não fecham em ",00" mantêm duas casas', () => {
    const formato = (preco: number) => ({ ...canastra.formatos[0], preco });
    const casos: [number, string][] = [
      [4990, '49.90'],
      [5, '0.05'],
      [100, '1.00'],
      [123456, '1234.56'],
    ];
    for (const [centavos, esperado] of casos) {
      const q = { ...canastra, formatos: [formato(centavos)] } as Cheese;
      expect(ofertasDe(q)[0]?.price).toBe(esperado);
    }
  });

  it('preço negativo ou fracionário não vira Offer', () => {
    for (const preco of [-100, 49.9, Number.NaN]) {
      const q = { ...canastra, formatos: [{ ...canastra.formatos[0], preco }] } as Cheese;
      expect(pr(q, SITE)).not.toHaveProperty('offers');
    }
  });

  it('lacuna "[" no nome do queijo: não publica o Product (null)', () => {
    const q = { ...canastra, nome: 'Queijo [NOME]' } as Cheese;
    expect(produto(q, SITE)).toBeNull();
  });

  it('lacuna "[" no peso do formato omite só o name do Offer, mantendo o preço', () => {
    const q = { ...canastra, formatos: [{ ...canastra.formatos[0], peso: '[PESO]' }] } as Cheese;
    const o = ofertasDe(q)[0] as Record<string, unknown>;
    expect(o).not.toHaveProperty('name');
    expect(o.price).toBe('136.00');
  });

  it('nenhum Product de nenhum queijo tem "[" em qualquer campo', () => {
    for (const q of QUEIJOS) {
      for (const v of textosDe(pr(q, SITE))) expect(v).not.toContain('[');
    }
  });
});

describe('fronteiras de trilhaDeNavegacao e artigo', () => {
  it('item com texto de lacuna é omitido e as posições continuam 1..n', () => {
    const t = tr(
      [
        { href: '/', texto: 'Início' },
        { href: '/x', texto: '[A DEFINIR]' },
      ],
      { href: '/y', texto: 'Atual' },
      SITE,
    );
    const itens = t.itemListElement as { position: number; name: string }[];
    expect(itens.map((i) => [i.position, i.name])).toEqual([
      [1, 'Início'],
      [2, 'Atual'],
    ]);
  });

  it('URLs são absolutas, a partir do site e com a query preservada', () => {
    const t = tr(
      [{ href: '/queijos?origem=mundo', texto: 'Mundo' }],
      { href: '/a', texto: 'A' },
      SITE,
    );
    const urls = (t.itemListElement as { item: string }[]).map((i) => i.item);
    expect(urls).toEqual([
      'https://www.exemplo.com.br/queijos?origem=mundo',
      'https://www.exemplo.com.br/a',
    ]);
  });

  it('artigo com corpo de parágrafos vazios ou só com lacuna continua nulo', () => {
    const base = ARTIGOS[0] as Artigo;
    expect(artigo({ ...base, corpo: ['   '] }, SITE)).toBeNull();
    expect(artigo({ ...base, corpo: ['[TEXTO]'] }, SITE)).toBeNull();
  });

  it('artigo com corpo omite descrição que contém "[" e não traz dado fictício', () => {
    const base = ARTIGOS[0] as Artigo;
    const a = artigo(
      { ...base, corpo: ['Texto real.'], descricao: '[DESCRIÇÃO]' },
      SITE,
    ) as DadoEstruturado;
    for (const v of textosDe(a)) expect(v).not.toContain('[');
    for (const f of FICTICIOS) expect(JSON.stringify(a)).not.toContain(f);
  });
});

describe('serializar: escapes', () => {
  const com = (name: string): DadoEstruturado => ({
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name,
  });

  it('"<!--" e "<script" não aparecem na saída e o valor volta intacto', () => {
    for (const nome of ['<!-- x -->', '<script>', '</SCRIPT >', 'a<b']) {
      const saida = serializar(com(nome));
      expect(saida).not.toContain('<');
      expect((JSON.parse(saida) as { name: string }).name).toBe(nome);
    }
  });

  it('U+2028 e U+2029 voltam intactos no JSON.parse (válidos em JSON e em script não executável)', () => {
    const nome = 'a\u2028b\u2029c';
    const saida = serializar(com(nome));
    expect((JSON.parse(saida) as { name: string }).name).toBe(nome);
  });

  it('a saída é uma única linha de JSON válido, sem quebra de linha crua', () => {
    const saida = serializar(com('linha1\nlinha2'));
    expect(saida).not.toMatch(/[\n\r]/);
  });
});

describe('varredura completa: nenhum JSON-LD de nenhuma rota tem dado fictício', () => {
  it('serializado (como vai no HTML) não contém nenhum valor de data/ficticio.ts', () => {
    const tudo = [
      ...todosOsDados(),
      ...ARTIGOS.flatMap((a) => artigo({ ...a, corpo: ['Corpo de teste.'] }, SITE) ?? []),
    ];
    const saida = serializar(tudo);
    for (const f of FICTICIOS) expect(saida).not.toContain(f);
    expect(saida).not.toMatch(/telephone|taxID|vatID|address|"brand"|"image"/);
    for (const v of textosDe(JSON.parse(saida))) expect(v).not.toContain('[');
  });
});

describe('ajustes da auditoria', () => {
  const canastra = QUEIJOS.find((q) => q.slug === 'canastra-curado') as Cheese;

  it('artigo com corpo citando o produtor fictício não publica esse valor (descrição omitida)', () => {
    const base = ARTIGOS[0] as Artigo;
    const a = artigo(
      {
        ...base,
        corpo: [`Feito por ${PRODUTOR_CANASTRA_FICTICIO} desde sempre.`, 'Segundo parágrafo real.'],
      },
      SITE,
    ) as DadoEstruturado;
    expect(a['@type']).toBe('Article');
    expect(a).not.toHaveProperty('description');
    expect(JSON.stringify(a)).not.toContain(PRODUTOR_CANASTRA_FICTICIO);
  });

  it('artigo com título de lacuna ou fictício: null', () => {
    const base = ARTIGOS[0] as Artigo;
    for (const titulo of ['[TÍTULO]', ENDERECO_FICTICIO]) {
      expect(artigo({ ...base, titulo, corpo: ['Texto real.'] }, SITE)).toBeNull();
    }
  });

  it('artigo cujo único parágrafo é fictício: null (sem corpo verdadeiro)', () => {
    const base = ARTIGOS[0] as Artigo;
    expect(artigo({ ...base, corpo: [PRODUTOR_CANASTRA_FICTICIO] }, SITE)).toBeNull();
  });

  it('produto com nome fictício ou só lacuna: null', () => {
    for (const nome of [ENDERECO_FICTICIO, '[A DEFINIR]', '  ']) {
      expect(produto({ ...canastra, nome } as Cheese, SITE)).toBeNull();
    }
  });

  it('descrição com valor fictício é omitida, e o Product continua', () => {
    const q = { ...canastra, nota: `Feito por ${PRODUTOR_CANASTRA_FICTICIO}.` } as Cheese;
    const p = pr(q, SITE);
    expect(p).not.toHaveProperty('description');
    expect(p.name).toBe('Canastra curado');
  });

  it('trilha sem nenhum item verdadeiro: null (nenhum BreadcrumbList)', () => {
    expect(
      trilhaDeNavegacao([{ href: '/', texto: '[A]' }], { href: '/x', texto: '' }, SITE),
    ).toBeNull();
  });

  it('preço 0 não vira Offer (preço deve ser maior que zero)', () => {
    const q = { ...canastra, formatos: [{ ...canastra.formatos[0], preco: 0 }] } as Cheese;
    expect(pr(q, SITE)).not.toHaveProperty('offers');
  });
});
