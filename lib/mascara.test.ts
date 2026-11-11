import { describe, expect, it } from 'vitest';
import { mascararCep } from './commerce';
import { colarComMascara, digitosAte, posicaoAposDigitos } from './mascara';

describe('digitosAte', () => {
  it('conta só os dígitos antes da posição', () => {
    expect(digitosAte('(11) 9123', 6)).toBe(3);
    expect(digitosAte('abc', 3)).toBe(0);
  });
});

describe('posicaoAposDigitos', () => {
  it('fica logo depois do n-ésimo dígito, com a pontuação para trás do cursor', () => {
    expect(posicaoAposDigitos('(11) 91234', 0)).toBe(0);
    expect(posicaoAposDigitos('(11) 91234', 2)).toBe(3);
    expect(posicaoAposDigitos('(11) 91234', 3)).toBe(6);
  });
  it('passa do total de dígitos → fim do texto', () => {
    expect(posicaoAposDigitos('12-3', 9)).toBe(4);
  });
});

describe('colarComMascara', () => {
  it('"CEP 01310-100" colado no campo vazio vira 01310-100, com o cursor no fim', () => {
    expect(colarComMascara('', 0, 0, 'CEP 01310-100', mascararCep)).toEqual({
      texto: '01310-100',
      cursor: 9,
    });
  });

  it('substitui a seleção e descarta o que passa de 8 dígitos', () => {
    expect(colarComMascara('01310-100', 0, 9, ' 30130 010 99', mascararCep).texto).toBe(
      '30130-010',
    );
    expect(colarComMascara('0131', 4, 4, '0-100', mascararCep).texto).toBe('01310-100');
  });
});
