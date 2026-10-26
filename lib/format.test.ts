import { describe, expect, it } from 'vitest';
import { formatarPreco } from './format';

const nbsp = ' ';

describe('formatarPreco', () => {
  it('formata centavos inteiros', () => {
    expect(formatarPreco(13600)).toBe(`R$${nbsp}136,00`);
    expect(formatarPreco(123450)).toBe(`R$${nbsp}1.234,50`);
    expect(formatarPreco(0)).toBe(`R$${nbsp}0,00`);
  });

  it('usa espaço não separável depois de R$', () => {
    expect(formatarPreco(13600).replace(nbsp, ' ')).toBe('R$ 136,00');
  });

  it('rejeita valores que não são inteiros em centavos', () => {
    expect(() => formatarPreco(13600.5)).toThrow(RangeError);
    expect(() => formatarPreco(Number.NaN)).toThrow(RangeError);
    expect(() => formatarPreco(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
