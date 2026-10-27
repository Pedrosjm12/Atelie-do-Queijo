import { describe, expect, it } from 'vitest';
import { listarQueijos } from './catalogo';
import {
  CHAVE_DA_SACOLA,
  MAXIMO_DE_LINHAS,
  QUANTIDADE_MAXIMA_POR_ITEM,
  SACOLA_VAZIA,
  TAMANHO_MAXIMO_SALVO,
  lerSacolaSalva,
  precificarSacola,
  reduzirSacola,
  serializarSacola,
  totalDeItens,
} from './sacola';
import type { ResumoParaSacola, Sacola } from './sacola';

const salvo = (itens: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ v: 1, itens, presente: false, ...extra });

const item = (quantidade: unknown, slug = 'canastra-curado', formatoId = 'meia') => ({
  slug,
  formatoId,
  quantidade,
});

describe('constantes', () => {
  it('seguem o plano', () => {
    expect(CHAVE_DA_SACOLA).toBe('atelie:sacola:v1');
    expect(QUANTIDADE_MAXIMA_POR_ITEM).toBe(10);
    expect(MAXIMO_DE_LINHAS).toBe(30);
    expect(TAMANHO_MAXIMO_SALVO).toBe(8192);
  });
});

describe('lerSacolaSalva', () => {
  it('null → vazia, sem pedir regravação', () => {
    expect(lerSacolaSalva(null)).toEqual({ sacola: SACOLA_VAZIA, corrigida: false });
  });

  it.each([
    ['JSON truncado', '{'],
    ['array', '[]'],
    ['texto', 'abc'],
    ['null em JSON', 'null'],
    ['outra versão', JSON.stringify({ v: 2, itens: [item(1)], presente: false })],
    ['sem versão', JSON.stringify({ itens: [item(1)] })],
    ['itens que não é array', JSON.stringify({ v: 1, itens: 'x' })],
    ['string vazia', ''],
  ])('%s → vazia e corrigida', (_nome, bruto) => {
    const r = lerSacolaSalva(bruto);
    expect(r.sacola.itens).toEqual([]);
    expect(r.corrigida).toBe(true);
  });

  it('texto de 9 KB → vazia, sem nem chamar JSON.parse', () => {
    const enorme = salvo([item(1)], { lixo: 'x'.repeat(9 * 1024) });
    const original = JSON.parse;
    let chamadas = 0;
    JSON.parse = (...args: Parameters<typeof JSON.parse>) => {
      chamadas += 1;
      return original(...args);
    };
    try {
      const r = lerSacolaSalva(enorme);
      expect(r).toEqual({ sacola: SACOLA_VAZIA, corrigida: true });
      expect(chamadas).toBe(0);
    } finally {
      JSON.parse = original;
    }
  });

  it('lê uma sacola válida sem pedir regravação', () => {
    const s: Sacola = {
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 }],
      presente: true,
    };
    expect(lerSacolaSalva(serializarSacola(s))).toEqual({ sacola: s, corrigida: false });
  });

  it('descarta só o item com slug inexistente ou formatoId de outro queijo', () => {
    const r = lerSacolaSalva(
      salvo([
        item(1, 'nao-existe'),
        item(1, 'canastra-curado', 'peca'),
        item(2, 'manchego', '500g'),
      ]),
    );
    expect(r.sacola.itens).toEqual([{ slug: 'manchego', formatoId: '500g', quantidade: 2 }]);
    expect(r.corrigida).toBe(true);
  });

  it('limita 0, -1 e 99 a 1..10', () => {
    const r = lerSacolaSalva(
      salvo([
        item(0, 'canastra-curado', 'inteira'),
        item(-1, 'canastra-curado', 'meia'),
        item(99, 'canastra-curado', 'fracao'),
      ]),
    );
    expect(r.sacola.itens.map((i) => i.quantidade)).toEqual([1, 1, 10]);
    expect(r.corrigida).toBe(true);
  });

  it('descarta quantidade fracionária, texto, nula ou sem número finito', () => {
    for (const q of [1.5, '2', null, true, [], {}, 1e999]) {
      const bruto = `{"v":1,"itens":[{"slug":"canastra-curado","formatoId":"meia","quantidade":${
        q === 1e999 ? '1e999' : JSON.stringify(q)
      }}],"presente":false}`;
      expect(lerSacolaSalva(bruto).sacola.itens, bruto).toEqual([]);
    }
  });

  it('descarta item que não é objeto', () => {
    const r = lerSacolaSalva(salvo([null, 1, 'x', [], item(1)]));
    expect(r.sacola.itens).toHaveLength(1);
  });

  it('soma linhas repetidas e limita a 10', () => {
    expect(lerSacolaSalva(salvo([item(3), item(4)])).sacola.itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'meia', quantidade: 7 },
    ]);
    expect(lerSacolaSalva(salvo([item(8), item(8)])).sacola.itens[0]?.quantidade).toBe(10);
  });

  it('ignora preço, nome e `__proto__` no JSON, e regrava a versão limpa', () => {
    const bruto =
      '{"v":1,"__proto__":{"polluido":true},"preco":1,"itens":[{"slug":"canastra-curado","formatoId":"meia","quantidade":1,"preco":1,"nome":"x","__proto__":{"polluido":true}}],"presente":false}';
    const r = lerSacolaSalva(bruto);
    expect(r.sacola.itens).toEqual([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }]);
    expect(Object.keys(r.sacola.itens[0] ?? {}).sort()).toEqual([
      'formatoId',
      'quantidade',
      'slug',
    ]);
    expect(r.corrigida).toBe(true);
    expect(({} as Record<string, unknown>).polluido).toBeUndefined();
    expect(serializarSacola(r.sacola)).not.toMatch(/preco|nome|proto/);
  });

  it('com 31 itens (17 linhas distintas), soma as repetidas e respeita o teto de linhas', () => {
    const ids = [
      ['canastra-curado', 'inteira'],
      ['canastra-curado', 'meia'],
      ['canastra-curado', 'fracao'],
      ['canastra-meia-cura-premiado', 'inteira'],
      ['canastra-meia-cura-premiado', 'meia'],
      ['creme-do-marajo', 'fracao'],
      ['penadinho-de-bufala', 'peca'],
      ['cabra-com-cinzas', 'peca'],
      ['gorgonzola-dolce', 'fracao'],
      ['tipo-gruyere', 'meia'],
      ['tipo-gruyere', 'fracao'],
      ['brie-frances', '500g'],
      ['brie-frances', '250g'],
      ['parmigiano-reggiano', '500g'],
      ['parmigiano-reggiano', '250g'],
      ['manchego', '500g'],
      ['manchego', '250g'],
    ] as const;
    // O catálogo tem só 17 linhas distintas; 31 itens (repetidos) comprovam o teto de bytes e a soma.
    const trintaEUm = Array.from({ length: 31 }, (_, i) => {
      const [slug, formatoId] = ids[i % ids.length] ?? ids[0];
      return item(1, slug, formatoId);
    });
    const r = lerSacolaSalva(salvo(trintaEUm));
    expect(r.sacola.itens.length).toBeLessThanOrEqual(MAXIMO_DE_LINHAS);
    expect(r.sacola.itens).toHaveLength(ids.length);
    expect(totalDeItens(r.sacola)).toBe(31);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    '%s como slug e como formatoId → item descartado, sem lançar',
    (nome) => {
      const comoSlug = `{"v":1,"itens":[{"slug":"${nome}","formatoId":"meia","quantidade":1}],"presente":false}`;
      const comoFormato = `{"v":1,"itens":[{"slug":"canastra-curado","formatoId":"${nome}","quantidade":1}],"presente":false}`;
      expect(() => lerSacolaSalva(comoSlug)).not.toThrow();
      expect(lerSacolaSalva(comoSlug).sacola.itens).toEqual([]);
      expect(lerSacolaSalva(comoFormato).sacola.itens).toEqual([]);
    },
  );

  it('slug ou formatoId com mais de 64 caracteres → item descartado', () => {
    expect(lerSacolaSalva(salvo([item(1, 'a'.repeat(65))])).sacola.itens).toEqual([]);
    expect(
      lerSacolaSalva(salvo([item(1, 'canastra-curado', 'a'.repeat(65))])).sacola.itens,
    ).toEqual([]);
  });

  it('`presente` só vale se for exatamente true, e não sobrevive a uma sacola vazia', () => {
    expect(lerSacolaSalva(salvo([item(1)], { presente: 'sim' })).sacola.presente).toBe(false);
    expect(lerSacolaSalva(salvo([item(1)], { presente: true })).sacola.presente).toBe(true);
    expect(lerSacolaSalva(salvo([], { presente: true })).sacola.presente).toBe(false);
  });
});

describe('serializarSacola', () => {
  it('grava só v, itens e presente, nessa ordem', () => {
    const s: Sacola = {
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 }],
      presente: false,
    };
    const comExtras = {
      ...s,
      itens: [{ ...s.itens[0]!, preco: 1, nome: 'x' }],
    } as unknown as Sacola;
    expect(serializarSacola(comExtras)).toBe(
      '{"v":1,"itens":[{"slug":"canastra-curado","formatoId":"meia","quantidade":2}],"presente":false}',
    );
  });

  it('cabe no limite de leitura mesmo com 30 linhas de quantidade 10', () => {
    const itens = Array.from({ length: 30 }, () => ({
      slug: 'canastra-meia-cura-premiado' as const,
      formatoId: 'inteira',
      quantidade: 10,
    }));
    expect(serializarSacola({ itens, presente: true }).length).toBeLessThanOrEqual(
      TAMANHO_MAXIMO_SALVO,
    );
  });
});

describe('reduzirSacola', () => {
  const adicionar = (s: Sacola, quantidade: number, formatoId = 'meia', presente?: boolean) =>
    reduzirSacola(s, {
      tipo: 'adicionar',
      slug: 'canastra-curado',
      formatoId,
      quantidade,
      presente,
    });

  it('soma linhas iguais', () => {
    const s = adicionar(adicionar(SACOLA_VAZIA, 1), 2);
    expect(s.itens).toEqual([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 3 }]);
    expect(totalDeItens(s)).toBe(3);
  });

  it('limita a 10 ao somar e não passa de 10 em uma só adição', () => {
    expect(adicionar(adicionar(SACOLA_VAZIA, 8), 8).itens[0]?.quantidade).toBe(10);
    expect(adicionar(SACOLA_VAZIA, 99).itens[0]?.quantidade).toBe(10);
  });

  it('linha já em 10 e presente igual → mesma referência; com presente novo, muda só a marca', () => {
    const cheia = adicionar(SACOLA_VAZIA, 10);
    expect(adicionar(cheia, 1)).toBe(cheia);
    expect(adicionar(cheia, 5, 'meia', false)).toBe(cheia);
    const marcada = adicionar(cheia, 1, 'meia', true);
    expect(marcada).not.toBe(cheia);
    expect(marcada.presente).toBe(true);
    expect(marcada.itens[0]?.quantidade).toBe(10);
    const cheiaMarcada = adicionar(SACOLA_VAZIA, 10, 'meia', true);
    expect(adicionar(cheiaMarcada, 1, 'meia', true)).toBe(cheiaMarcada);
  });

  it('linhas diferentes (formatos) ficam separadas', () => {
    const s = adicionar(adicionar(SACOLA_VAZIA, 1, 'meia'), 1, 'inteira');
    expect(s.itens).toHaveLength(2);
  });

  it('ignora formato inexistente e quantidade que não é inteira (mesma referência, sem lançar)', () => {
    expect(adicionar(SACOLA_VAZIA, 1, 'xyz')).toBe(SACOLA_VAZIA);
    expect(adicionar(SACOLA_VAZIA, 1.5)).toBe(SACOLA_VAZIA);
    expect(adicionar(SACOLA_VAZIA, Number.NaN)).toBe(SACOLA_VAZIA);
    expect(adicionar(SACOLA_VAZIA, Number.POSITIVE_INFINITY)).toBe(SACOLA_VAZIA);
    const perigoso = reduzirSacola(SACOLA_VAZIA, {
      tipo: 'adicionar',
      slug: '__proto__' as never,
      formatoId: 'meia',
      quantidade: 1,
    });
    expect(perigoso).toBe(SACOLA_VAZIA);
  });

  it('adicionar com presente marca o pedido; sem presente, mantém a marca', () => {
    const marcada = adicionar(SACOLA_VAZIA, 1, 'meia', true);
    expect(marcada.presente).toBe(true);
    expect(adicionar(marcada, 1, 'meia', false).presente).toBe(true);
    expect(adicionar(marcada, 1, 'inteira').presente).toBe(true);
    expect(adicionar(SACOLA_VAZIA, 1).presente).toBe(false);
  });

  it('alterar-quantidade limita a 1..10 e ignora linha ausente ou valor inválido', () => {
    const base = adicionar(SACOLA_VAZIA, 2);
    const alterar = (quantidade: number) =>
      reduzirSacola(base, {
        tipo: 'alterar-quantidade',
        slug: 'canastra-curado',
        formatoId: 'meia',
        quantidade,
      });
    expect(alterar(5).itens[0]?.quantidade).toBe(5);
    expect(alterar(0).itens[0]?.quantidade).toBe(1);
    expect(alterar(50).itens[0]?.quantidade).toBe(10);
    expect(alterar(2)).toBe(base);
    expect(alterar(1.5)).toBe(base);
    expect(
      reduzirSacola(base, {
        tipo: 'alterar-quantidade',
        slug: 'manchego',
        formatoId: '500g',
        quantidade: 3,
      }),
    ).toBe(base);
  });

  it('remover tira a linha; a última linha também desmarca o presente', () => {
    const duas = adicionar(adicionar(SACOLA_VAZIA, 1, 'meia', true), 1, 'inteira');
    const uma = reduzirSacola(duas, {
      tipo: 'remover',
      slug: 'canastra-curado',
      formatoId: 'meia',
    });
    expect(uma.itens).toEqual([{ slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 }]);
    expect(uma.presente).toBe(true);
    const nenhuma = reduzirSacola(uma, {
      tipo: 'remover',
      slug: 'canastra-curado',
      formatoId: 'inteira',
    });
    expect(nenhuma).toEqual({ itens: [], presente: false });
    expect(
      reduzirSacola(nenhuma, { tipo: 'remover', slug: 'canastra-curado', formatoId: 'meia' }),
    ).toBe(nenhuma);
  });

  it('definir-presente e limpar', () => {
    const s = adicionar(SACOLA_VAZIA, 1);
    expect(reduzirSacola(s, { tipo: 'definir-presente', presente: true }).presente).toBe(true);
    expect(reduzirSacola(s, { tipo: 'definir-presente', presente: false })).toBe(s);
    // Sacola vazia nunca ganha a marca de presente.
    expect(reduzirSacola(SACOLA_VAZIA, { tipo: 'definir-presente', presente: true })).toBe(
      SACOLA_VAZIA,
    );
    expect(reduzirSacola(adicionar(SACOLA_VAZIA, 3, 'meia', true), { tipo: 'limpar' })).toEqual(
      SACOLA_VAZIA,
    );
  });

  it('substituir troca a sacola inteira', () => {
    const outra = adicionar(SACOLA_VAZIA, 4);
    expect(reduzirSacola(SACOLA_VAZIA, { tipo: 'substituir', sacola: outra })).toBe(outra);
  });

  it('nunca muda a sacola recebida (imutável)', () => {
    const base = adicionar(SACOLA_VAZIA, 1);
    const copia = JSON.stringify(base);
    adicionar(base, 2);
    reduzirSacola(base, { tipo: 'remover', slug: 'canastra-curado', formatoId: 'meia' });
    expect(JSON.stringify(base)).toBe(copia);
    expect(JSON.stringify(SACOLA_VAZIA)).toBe('{"itens":[],"presente":false}');
  });

  it('não passa de 30 linhas', () => {
    // Linhas sintéticas (o catálogo só tem 17 pares válidos) para testar só o teto de linhas.
    const s: Sacola = {
      itens: Array.from({ length: MAXIMO_DE_LINHAS }, (_, i) => ({
        slug: 'manchego' as const,
        formatoId: `x${i}`,
        quantidade: 1,
      })),
      presente: false,
    };
    expect(adicionar(s, 1)).toBe(s);
  });
});

describe('totalDeItens', () => {
  it('soma as quantidades (contador do cabeçalho)', () => {
    expect(totalDeItens(SACOLA_VAZIA)).toBe(0);
    const s = reduzirSacola(
      reduzirSacola(SACOLA_VAZIA, {
        tipo: 'adicionar',
        slug: 'canastra-curado',
        formatoId: 'meia',
        quantidade: 2,
      }),
      { tipo: 'adicionar', slug: 'manchego', formatoId: '500g', quantidade: 3 },
    );
    expect(totalDeItens(s)).toBe(5);
  });
});

describe('precificarSacola', () => {
  const catalogo: readonly ResumoParaSacola[] = listarQueijos().map((q) => ({
    slug: q.slug as ResumoParaSacola['slug'],
    nome: q.nome,
    esgotado: q.estoque.situacao === 'esgotado',
    ilustracao: q.ilustracao,
    formatos: q.formatos.map(({ id, nome, peso, preco }) => ({ id, nome, peso, preco })),
  }));

  it('Canastra "meia" × 2 = 15600', () => {
    const s: Sacola = {
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 }],
      presente: false,
    };
    const r = precificarSacola(s, catalogo);
    expect(r.subtotal).toBe(15600);
    expect(r.ignorados).toBe(0);
    expect(r.linhas[0]).toMatchObject({
      nome: 'Canastra curado',
      formatoNome: 'Meia peça',
      peso: '~500 g',
      precoUnitario: 7800,
      total: 15600,
    });
  });

  it('item sem correspondência é ignorado sem quebrar; o resto é somado', () => {
    const s: Sacola = {
      itens: [
        { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 1 },
        { slug: 'canastra-curado', formatoId: 'nao-existe', quantidade: 1 },
        { slug: 'manchego', formatoId: '500g', quantidade: 1 },
      ],
      presente: false,
    };
    const r = precificarSacola(
      s,
      catalogo.filter((q) => q.slug !== 'manchego'),
    );
    expect(r.linhas).toHaveLength(1);
    expect(r.ignorados).toBe(2);
    expect(r.subtotal).toBe(4900);
  });

  it('queijo esgotado vai para ignorados', () => {
    const s: Sacola = {
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }],
      presente: false,
    };
    const esgotado = catalogo.map((q) => ({ ...q, esgotado: true }));
    expect(precificarSacola(s, esgotado)).toEqual({ linhas: [], subtotal: 0, ignorados: 1 });
  });

  it('preço fracionário, negativo ou acima do teto no catálogo → RangeError', () => {
    const s: Sacola = {
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }],
      presente: false,
    };
    for (const preco of [78.5, -1, Number.NaN, 100_000_001]) {
      const ruim = catalogo.map((q) => ({
        ...q,
        formatos: q.formatos.map((f) => ({ ...f, preco })),
      }));
      expect(() => precificarSacola(s, ruim), String(preco)).toThrow(RangeError);
    }
  });

  it('todos os preços do catálogo real são inteiros em centavos', () => {
    for (const q of catalogo) {
      for (const f of q.formatos) expect(Number.isInteger(f.preco), `${q.slug}/${f.id}`).toBe(true);
    }
  });

  it('sacola vazia → subtotal 0', () => {
    expect(precificarSacola(SACOLA_VAZIA, catalogo)).toEqual({
      linhas: [],
      subtotal: 0,
      ignorados: 0,
    });
  });
});
