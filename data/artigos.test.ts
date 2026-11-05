import { describe, expect, it } from 'vitest';
import { ARTIGOS, CATEGORIAS, nomeDaCategoria, obterArtigo } from './artigos';

describe('ARTIGOS (spec §5.8)', () => {
  it('traz os três títulos literais e suas categorias, na ordem', () => {
    expect(ARTIGOS.map((a) => [a.titulo, nomeDaCategoria(a.categoria)])).toEqual([
      ['Como montar uma tábua de queijos', 'Primeiros passos'],
      ['Queijo e vinho: um guia sem regras chatas', 'Harmonização'],
      ['Como guardar queijo na geladeira', 'Servir e guardar'],
    ]);
  });

  it('slugs únicos e sem acento; corpo e queijos citados são lacunas (null)', () => {
    const slugs = ARTIGOS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(ARTIGOS.every((a) => a.corpo === null && a.queijosCitados === null)).toBe(true);
  });

  it('obterArtigo acha pelo slug e devolve undefined para desconhecido', () => {
    expect(obterArtigo('queijo-e-vinho')?.titulo).toBe('Queijo e vinho: um guia sem regras chatas');
    expect(obterArtigo('nao-existe')).toBeUndefined();
  });
});

describe('ARTIGOS (integridade)', () => {
  it('toda categoria usada existe em CATEGORIAS e os títulos são únicos', () => {
    const ids = new Set(CATEGORIAS.map((c) => c.id));
    for (const a of ARTIGOS) expect(ids.has(a.categoria)).toBe(true);
    expect(new Set(ARTIGOS.map((a) => a.titulo)).size).toBe(ARTIGOS.length);
  });

  it('nomeDaCategoria e obterArtigo não aceitam slug com outra caixa', () => {
    expect(obterArtigo('QUEIJO-E-VINHO')).toBeUndefined();
    expect(obterArtigo('')).toBeUndefined();
  });
});

describe('CATEGORIAS (spec §12)', () => {
  it('nomes literais na ordem da spec', () => {
    expect(CATEGORIAS.map((c) => c.nome)).toEqual([
      'Primeiros passos',
      'Harmonização',
      'Servir e guardar',
      'Regiões e produtores',
    ]);
  });
});
