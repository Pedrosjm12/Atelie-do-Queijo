import { describe, expect, it } from 'vitest';
import { encontrarLacunas, exigirSemLacunasEmProducao } from './lacunas';

describe('encontrarLacunas', () => {
  it('devolve o caminho de cada texto com [A DEFINIR, em objetos e listas', () => {
    const fontes = {
      TEXTOS: { saude: '[A DEFINIR: saúde]', ok: 'Texto pronto' },
      LISTA: [{ nome: 'a' }, { detalhe: { origem: '[A DEFINIR]' } }],
      AVISO: '[A DEFINIR: aviso]',
    };
    expect(encontrarLacunas(fontes)).toEqual(['TEXTOS.saude', 'LISTA[1].detalhe.origem', 'AVISO']);
  });

  it('[FOTO], [PREÇO], [n] e [TEXTO DO ARTIGO] não são lacunas', () => {
    expect(
      encontrarLacunas({ a: ['[FOTO: queijo]', '[PREÇO]', '[n]', '[TEXTO DO ARTIGO]'] }),
    ).toEqual([]);
  });

  it('ignora números e nulos e tolera referência circular', () => {
    const circular: Record<string, unknown> = { n: 1, nulo: null, x: '[A DEFINIR]' };
    circular.eu = circular;
    expect(encontrarLacunas({ circular })).toEqual(['circular.x']);
  });
});

describe('encontrarLacunas: fronteiras', () => {
  it('acha a marca no meio de um texto maior e conta uma vez por texto', () => {
    expect(encontrarLacunas({ a: 'Antes [A DEFINIR: x] e [A DEFINIR: y] depois' })).toEqual(['a']);
  });

  it('só vale a marca exata "[A DEFINIR": sem colchete, minúsculas ou espaço extra não trava', () => {
    expect(
      encontrarLacunas({ a: ['A DEFINIR', 'a definir', '[a definir]', '[A  DEFINIR]', 'DEFINIR'] }),
    ).toEqual([]);
  });

  it('lista vazia, objeto vazio e fontes vazias não geram lacuna', () => {
    expect(encontrarLacunas({})).toEqual([]);
    expect(encontrarLacunas({ a: [], b: {}, c: '' })).toEqual([]);
  });

  it('acha em listas aninhadas e mantém a ordem de declaração', () => {
    expect(encontrarLacunas({ z: [['[A DEFINIR]']], a: { b: ['ok', '[A DEFINIR]'] } })).toEqual([
      'z[0][0]',
      'a.b[1]',
    ]);
  });

  it('o mesmo objeto referenciado em dois lugares é visitado uma vez (sem duplicar caminho)', () => {
    const comum = { t: '[A DEFINIR]' };
    expect(encontrarLacunas({ a: comum, b: comum })).toEqual(['a.t']);
  });
});

describe('exigirSemLacunasEmProducao', () => {
  const fontes = { T: { a: '[A DEFINIR: a]', b: '[A DEFINIR: b]' } };

  it('em produção com lacunas: lança erro em português listando todas', () => {
    expect(() => exigirSemLacunasEmProducao('production', fontes)).toThrow(
      /Build de produção bloqueado: 2 texto\(s\)[\s\S]*- T\.a[\s\S]*- T\.b/,
    );
  });

  it('em produção sem lacunas: não lança', () => {
    expect(() => exigirSemLacunasEmProducao('production', { T: 'ok' })).not.toThrow();
  });

  it('fora de produção: não lança', () => {
    for (const a of ['preview', 'development', undefined]) {
      expect(() => exigirSemLacunasEmProducao(a, fontes)).not.toThrow();
    }
  });
});
