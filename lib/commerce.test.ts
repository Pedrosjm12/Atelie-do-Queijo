import { describe, expect, it, vi } from 'vitest';
import {
  DESCONTO_PIX_PERCENTUAL,
  FRETE_GRATIS_A_PARTIR_DE,
  calcularTotais,
  faltaParaFreteGratis,
  mascararCep,
  normalizarCep,
  precoNoPix,
  valorDoFrete,
} from './commerce';
import { TETO_EM_CENTAVOS } from './dinheiro';

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

  it('aceita até o teto de R$ 1.000.000 e recusa acima dele', () => {
    expect(precoNoPix(TETO_EM_CENTAVOS)).toBe(95_000_000);
    expect(() => precoNoPix(TETO_EM_CENTAVOS + 1)).toThrow(RangeError);
    expect(() => precoNoPix(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });

  it('a mensagem de erro não repete o valor recebido', () => {
    for (const v of [123456789.5, -98765, TETO_EM_CENTAVOS + 7]) {
      expect(() => precoNoPix(v)).toThrow(/^Preço inválido/);
      try {
        precoNoPix(v);
      } catch (e) {
        expect((e as Error).message).not.toContain(String(v));
      }
    }
  });

  it('expõe o percentual de desconto', () => {
    expect(DESCONTO_PIX_PERCENTUAL).toBe(5);
  });
});

describe('faltaParaFreteGratis', () => {
  it('é max(0, 18000 − subtotal)', () => {
    expect(FRETE_GRATIS_A_PARTIR_DE).toBe(18000);
    expect(faltaParaFreteGratis(0)).toBe(18000);
    expect(faltaParaFreteGratis(17999)).toBe(1);
    expect(faltaParaFreteGratis(18000)).toBe(0);
    expect(faltaParaFreteGratis(18001)).toBe(0);
    expect(faltaParaFreteGratis(99999)).toBe(0);
  });

  it('rejeita valor que não é inteiro não negativo', () => {
    expect(() => faltaParaFreteGratis(-1)).toThrow(RangeError);
    expect(() => faltaParaFreteGratis(1.5)).toThrow(RangeError);
    expect(() => faltaParaFreteGratis(Number.NaN)).toThrow(RangeError);
  });
});

describe('normalizarCep', () => {
  it('aceita com ou sem máscara', () => {
    expect(normalizarCep('01310-100')).toBe('01310100');
    expect(normalizarCep('01310100')).toBe('01310100');
  });

  it('só aceita NNNNN-NNN ou NNNNNNNN (depois do trim)', () => {
    expect(normalizarCep(' 01310100')).toBe('01310100');
    expect(normalizarCep('01310-100 ')).toBeNull(); // 10 caracteres
    for (const v of [
      '01310 100',
      '01-310-100',
      '0131-0100',
      '013101-00',
      '-01310100',
      '01310--100',
    ]) {
      expect(normalizarCep(v), v).toBeNull();
    }
    expect(normalizarCep('٠١٣١٠١٠٠')).toBeNull(); // dígitos árabe-índicos
  });

  it('recusa 7 dígitos, 9 dígitos, letras e vazio', () => {
    expect(normalizarCep('0131010')).toBeNull();
    expect(normalizarCep('013101000')).toBeNull();
    expect(normalizarCep('abcdefgh')).toBeNull();
    expect(normalizarCep('0131010a')).toBeNull();
    expect(normalizarCep('')).toBeNull();
  });

  it('recusa mais de 9 caracteres antes de qualquer replace', () => {
    const replace = vi.spyOn(String.prototype, 'replace');
    try {
      expect(normalizarCep('01310-100 ')).toBeNull(); // 10 caracteres, mesmo com 8 dígitos
      expect(normalizarCep('0'.repeat(10_000))).toBeNull();
      expect(replace).not.toHaveBeenCalled();
    } finally {
      replace.mockRestore();
    }
  });

  it('recusa o que não é texto', () => {
    for (const v of [null, undefined, 1310100, {}, ['01310100']]) {
      expect(normalizarCep(v as unknown as string)).toBeNull();
    }
  });
});

describe('mascararCep', () => {
  it('aplica a máscara progressiva', () => {
    expect(mascararCep('')).toBe('');
    expect(mascararCep('0131')).toBe('0131');
    expect(mascararCep('01310')).toBe('01310');
    expect(mascararCep('013101')).toBe('01310-1');
    expect(mascararCep('01310100')).toBe('01310-100');
  });

  it('limita a 9 caracteres e ignora o que não é dígito', () => {
    expect(mascararCep('01310-1009')).toBe('01310-100');
    expect(mascararCep('01310-100')).toBe('01310-100');
    expect(mascararCep('a0b1c3d1e0f1g0h0')).toBe('01310-100');
    expect(mascararCep('x'.repeat(100_000))).toBe('');
    expect(mascararCep('0'.repeat(100_000)).length).toBe(9);
  });
});

describe('valorDoFrete', () => {
  const atendido = { situacao: 'atendido', prazoDiasUteis: 3, valor: 2500 } as const;
  const comLacuna = { situacao: 'atendido', prazoDiasUteis: null, valor: null } as const;

  it('subtotal ≥ R$ 180 → 0 (exatamente R$ 180 já é grátis)', () => {
    expect(valorDoFrete(atendido, 18000)).toBe(0);
    expect(valorDoFrete(atendido, 25000)).toBe(0);
    expect(valorDoFrete(comLacuna, 18000)).toBe(0);
  });

  it('abaixo de R$ 180 → o valor do resultado (pode ser null)', () => {
    expect(valorDoFrete(atendido, 17999)).toBe(2500);
    expect(valorDoFrete(comLacuna, 17999)).toBeNull();
    expect(valorDoFrete(comLacuna, 0)).toBeNull();
  });
});

describe('calcularTotais', () => {
  it('Pix com frete em lacuna: desconto de 680 e total null', () => {
    expect(calcularTotais(13600, null, 'pix')).toEqual({
      subtotal: 13600,
      frete: null,
      descontoPix: 680,
      total: null,
    });
  });

  it('Pix em R$ 180 com frete grátis → 17100', () => {
    expect(calcularTotais(18000, 0, 'pix')).toEqual({
      subtotal: 18000,
      frete: 0,
      descontoPix: 900,
      total: 17100,
    });
  });

  it('cartão não tem desconto (P30)', () => {
    expect(calcularTotais(18000, 0, 'cartao')).toEqual({
      subtotal: 18000,
      frete: 0,
      descontoPix: 0,
      total: 18000,
    });
    expect(calcularTotais(7800, 2500, 'cartao').total).toBe(10300);
  });

  it('o desconto usa um único arredondamento sobre o subtotal', () => {
    // 11750 − precoNoPix(11750) = 11750 − 11163 = 587 (meio centavo arredondado para cima).
    expect(calcularTotais(11750, 0, 'pix')).toMatchObject({ descontoPix: 587, total: 11163 });
  });

  it('subtotal zero e frete somado', () => {
    expect(calcularTotais(0, 0, 'pix')).toEqual({
      subtotal: 0,
      frete: 0,
      descontoPix: 0,
      total: 0,
    });
    expect(calcularTotais(10000, 2500, 'pix').total).toBe(9500 + 2500);
  });

  it('respeita o teto de R$ 1.000.000 em cada valor e no total', () => {
    expect(calcularTotais(TETO_EM_CENTAVOS, 0, 'cartao').total).toBe(TETO_EM_CENTAVOS);
    expect(() => calcularTotais(TETO_EM_CENTAVOS + 1, 0, 'cartao')).toThrow(RangeError);
    expect(() => calcularTotais(100, TETO_EM_CENTAVOS + 1, 'cartao')).toThrow(RangeError);
    // Cada parcela cabe no teto, mas a soma não.
    expect(() => calcularTotais(TETO_EM_CENTAVOS, 1, 'cartao')).toThrow(RangeError);
  });

  it('rejeita valores inválidos', () => {
    expect(() => calcularTotais(-1, 0, 'pix')).toThrow(RangeError);
    expect(() => calcularTotais(100, 1.5, 'pix')).toThrow(RangeError);
    expect(() => calcularTotais(Number.NaN, 0, 'cartao')).toThrow(RangeError);
  });

  it('nunca devolve NaN nem R$ 0,00 no lugar de lacuna', () => {
    const t = calcularTotais(13600, null, 'cartao');
    expect(t.total).toBeNull();
    expect(Object.values(t).some((v) => typeof v === 'number' && Number.isNaN(v))).toBe(false);
  });
});
