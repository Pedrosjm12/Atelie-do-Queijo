import { describe, expect, it } from 'vitest';
import { DESCONTO_PIX_PERCENTUAL, precoNoPix } from './commerce';

describe('precoNoPix', () => {
  it('aplica 5% de desconto nos casos da spec §7.2', () => {
    expect(precoNoPix(13600)).toBe(12920);
    expect(precoNoPix(7800)).toBe(7410);
    expect(precoNoPix(4900)).toBe(4655);
  });

  it('arredonda meio centavo para cima', () => {
    expect(precoNoPix(11750)).toBe(11163);
  });

  it('trata zero e centavos pequenos', () => {
    expect(precoNoPix(0)).toBe(0);
    expect(precoNoPix(1)).toBe(1);
    expect(precoNoPix(10)).toBe(10);
  });

  it('arredonda para baixo quando a fração é menor que meio centavo', () => {
    expect(precoNoPix(11)).toBe(10);
  });

  it('coincide com Math.round(c * 95 / 100) de 0 a 20000 centavos', () => {
    for (let c = 0; c <= 20000; c++) {
      expect(precoNoPix(c)).toBe(Math.round((c * 95) / 100));
    }
  });

  it('sempre devolve inteiro', () => {
    for (const c of [101, 3333, 7601, 18001, 99999]) {
      expect(Number.isInteger(precoNoPix(c))).toBe(true);
    }
  });

  it('rejeita valores que não são inteiros não negativos', () => {
    expect(() => precoNoPix(10.5)).toThrow(RangeError);
    expect(() => precoNoPix(-1)).toThrow(RangeError);
    expect(() => precoNoPix(Number.NaN)).toThrow(RangeError);
  });

  it('expõe o percentual de desconto', () => {
    expect(DESCONTO_PIX_PERCENTUAL).toBe(5);
  });
});
