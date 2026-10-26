import { describe, expect, it } from 'vitest';
import { QUEIJOS } from '@/data/cheeses';
import {
  contarPorOrigem,
  dadosDoCartao,
  destaquesDaSemana,
  ehOrigem,
  ehSlugDoQueijo,
  filtrarPorOrigem,
  lerOrigem,
  listarQueijos,
  obterQueijo,
  precoDeVitrine,
} from './catalogo';

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(`Queijo ausente: ${slug}`);
  return q;
}

describe('integridade dos dados', () => {
  it('tem 10 queijos na ordem da §9', () => {
    expect(QUEIJOS.map((q) => q.slug)).toEqual([
      'canastra-curado',
      'canastra-meia-cura-premiado',
      'creme-do-marajo',
      'penadinho-de-bufala',
      'cabra-com-cinzas',
      'gorgonzola-dolce',
      'tipo-gruyere',
      'brie-frances',
      'parmigiano-reggiano',
      'manchego',
    ]);
  });

  it('tem slugs únicos', () => {
    expect(new Set(QUEIJOS.map((q) => q.slug)).size).toBe(QUEIJOS.length);
  });

  it('tem preços inteiros positivos e ids de formato únicos por queijo', () => {
    for (const q of QUEIJOS) {
      const ids = q.formatos.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const f of q.formatos) {
        expect(Number.isInteger(f.preco)).toBe(true);
        expect(f.preco).toBeGreaterThan(0);
      }
    }
  });

  it('copia os preços da §9 em centavos', () => {
    expect(QUEIJOS.flatMap((q) => q.formatos.map((f) => f.preco))).toEqual([
      13600, 7800, 4900, 21499, 11750, 6490, 11900, 7400, 7600, 9145, 5573, 22495, 12248, 23000,
      12500, 23998, 12999,
    ]);
  });

  it('usa tag em maiúsculas e cores de ilustração hexadecimais', () => {
    for (const q of QUEIJOS) {
      expect(q.tag).toBe(q.tag.toUpperCase());
      expect(q.ilustracao.side).toMatch(/^#[0-9A-F]{6}$/);
      expect(q.ilustracao.top).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('mantém as lacunas literais do Canastra e [A DEFINIR] nos demais', () => {
    const c = queijo('canastra-curado').detalhe;
    expect(c.produtor).toBe('Queijaria [NOME DO PRODUTOR]');
    expect(c.perfil).toEqual({ intensidade: 4, cremosidade: 2, salinidade: 3, aroma: 4 });
    expect(c.fichaTecnica).toContain('[SELO E NÚMERO]');
    expect(c.fichaTecnica).toContain('[DATA]');
    expect(c.comoGuardar).toContain('[N]');
    expect(c.historia[0]).toContain('[ANO]');
    for (const q of QUEIJOS.slice(1)) {
      expect(q.detalhe.descricao).toBe('[A DEFINIR]');
      expect(q.detalhe.selos).toEqual([{ tipo: 'origem', texto: '[A DEFINIR]' }]);
      expect(Object.values(q.detalhe.perfil).every((v) => v === null)).toBe(true);
    }
  });

  it('deixa os formatos sem nome na spec como [A DEFINIR]', () => {
    for (const slug of ['brie-frances', 'parmigiano-reggiano', 'manchego']) {
      expect(queijo(slug).formatos.every((f) => f.nome === '[A DEFINIR]')).toBe(true);
    }
  });

  it('começa com todos os queijos disponíveis', () => {
    expect(QUEIJOS.every((q) => q.estoque.situacao === 'disponivel')).toBe(true);
  });
});

describe('contagens e filtro por origem', () => {
  it('conta Todos 10 / Brasil 7 / Mundo 3', () => {
    expect(contarPorOrigem()).toEqual({ todos: 10, brasil: 7, mundo: 3 });
  });

  it('filtra por origem e preserva a ordem', () => {
    expect(filtrarPorOrigem(null)).toHaveLength(10);
    expect(filtrarPorOrigem('mundo').map((q) => q.slug)).toEqual([
      'brie-frances',
      'parmigiano-reggiano',
      'manchego',
    ]);
    expect(filtrarPorOrigem('brasil').every((q) => q.origem === 'brasil')).toBe(true);
  });

  it('lê a origem de searchParams', () => {
    expect(lerOrigem('brasil')).toBe('brasil');
    expect(lerOrigem('mundo')).toBe('mundo');
    expect(lerOrigem(undefined)).toBeNull();
    expect(lerOrigem('europa')).toBeNull();
    expect(lerOrigem(['brasil', 'mundo'])).toBeNull();
    expect(lerOrigem(['brasil'])).toBeNull();
  });
});

describe('busca e type guards', () => {
  it('obtém por slug', () => {
    expect(obterQueijo('manchego')?.nome).toBe('Manchego DOP');
    expect(obterQueijo('inexistente')).toBeUndefined();
    expect(listarQueijos()).toHaveLength(10);
  });

  it('valida slug e origem', () => {
    expect(ehSlugDoQueijo('brie-frances')).toBe(true);
    expect(ehSlugDoQueijo('parmigiano-reggiano-dop')).toBe(false);
    expect(ehSlugDoQueijo(42)).toBe(false);
    expect(ehOrigem('brasil')).toBe(true);
    expect(ehOrigem('Brasil')).toBe(false);
    expect(ehOrigem(null)).toBe(false);
  });
});

describe('destaques da semana', () => {
  it('tem 4 queijos na ordem da Home', () => {
    expect(destaquesDaSemana().map((q) => q.slug)).toEqual([
      'canastra-curado',
      'brie-frances',
      'gorgonzola-dolce',
      'cabra-com-cinzas',
    ]);
  });

  it('não altera a ordem do catálogo', () => {
    destaquesDaSemana();
    expect(listarQueijos()[0]?.slug).toBe('canastra-curado');
    expect(listarQueijos()[4]?.slug).toBe('cabra-com-cinzas');
  });
});

describe('preço de vitrine e dados do cartão', () => {
  it('usa "a partir de" + menor preço com mais de um formato', () => {
    expect(precoDeVitrine(queijo('canastra-curado'))).toEqual({
      linhaPequena: 'a partir de',
      preco: 4900,
    });
    expect(precoDeVitrine(queijo('brie-frances'))).toEqual({
      linhaPequena: 'a partir de',
      preco: 12248,
    });
  });

  it('usa peso + preço com um só formato', () => {
    expect(precoDeVitrine(queijo('gorgonzola-dolce'))).toEqual({
      linhaPequena: '~300 g',
      preco: 7600,
    });
    expect(precoDeVitrine(queijo('creme-do-marajo'))).toEqual({
      linhaPequena: '200 g',
      preco: 6490,
    });
  });

  it('aplica a vitrine na Home e no chat, e a §9 pura no catálogo', () => {
    const cabra = queijo('cabra-com-cinzas');
    expect(dadosDoCartao(cabra, 'home')).toEqual({
      tag: 'BRASIL · LEITE DE CABRA',
      nota: 'Fresco, cítrico, casca aveludada.',
      linhaPequena: 'a partir de',
      preco: 7400,
    });
    expect(dadosDoCartao(cabra, 'chat')).toEqual(dadosDoCartao(cabra, 'home'));
    expect(dadosDoCartao(cabra, 'catalogo')).toEqual({
      tag: 'BRASIL · SERRA DA MANTIQUEIRA, SP',
      nota: 'Fresco, cítrico, casca aveludada.',
      linhaPequena: '~160 g',
      preco: 7400,
    });
  });

  it('mantém a tag da §9 do Canastra no catálogo e usa a da §5.4 na Home e no chat', () => {
    const c = queijo('canastra-curado');
    expect(dadosDoCartao(c, 'catalogo').tag).toBe('BRASIL · SERRA DA CANASTRA, MG');
    expect(dadosDoCartao(c, 'home').tag).toBe('BRASIL · CANASTRA, MG');
    expect(dadosDoCartao(c, 'chat').tag).toBe('BRASIL · CANASTRA, MG');
  });

  it('bate com a tabela da §5.4 nos quatro destaques', () => {
    const home = destaquesDaSemana().map((q) => {
      const d = dadosDoCartao(q, 'home');
      return [d.tag, d.nota, d.linhaPequena, d.preco];
    });
    expect(home).toEqual([
      ['BRASIL · CANASTRA, MG', 'Intenso, amanteigado, final picante.', 'a partir de', 4900],
      ['FRANÇA · IMPORTADO', 'Cremoso, notas de cogumelo e nozes.', 'a partir de', 12248],
      ['BRASIL · SERRA DAS ANTAS, MG', 'Macio, levemente adocicado, veios suaves.', '~300 g', 7600],
      ['BRASIL · LEITE DE CABRA', 'Fresco, cítrico, casca aveludada.', 'a partir de', 7400],
    ]);
  });
});
