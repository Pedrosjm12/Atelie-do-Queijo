import { describe, expect, it } from 'vitest';
import { digitosAte, posicaoAposDigitos } from './mascara';

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
