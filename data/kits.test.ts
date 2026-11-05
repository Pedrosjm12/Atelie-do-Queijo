import { describe, expect, it } from 'vitest';
import { KITS } from './kits';

describe('KITS (spec §5.7)', () => {
  it('traz os três kits na ordem, com os textos literais', () => {
    expect(KITS.map((k) => [k.nome, k.descricao])).toEqual([
      ['Primeira Degustação', '3 queijos suaves, mel de flores e guia de degustação.'],
      ['Volta ao Mundo', '5 queijos de 5 países, com mapa de origem.'],
      ['Grande Cave', '7 queijos, tábua de madeira maciça e faca de queijo.'],
    ]);
  });

  it('preço é lacuna (null), nunca 0, e os ids são únicos', () => {
    expect(KITS.every((k) => k.preco === null)).toBe(true);
    expect(new Set(KITS.map((k) => k.id)).size).toBe(KITS.length);
  });

  it('ids são slugs válidos para âncora e nomes não se repetem', () => {
    for (const k of KITS) expect(k.id).toMatch(/^[a-z0-9-]+$/);
    expect(new Set(KITS.map((k) => k.nome)).size).toBe(KITS.length);
  });
});
