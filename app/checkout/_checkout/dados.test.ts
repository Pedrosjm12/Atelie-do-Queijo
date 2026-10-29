import { describe, expect, it } from 'vitest';
import { mascararTelefone, medirMensagem } from './dados';

describe('mascararTelefone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['11', '(11'],
    ['119', '(11) 9'],
    ['11912', '(11) 912'],
    ['1191234', '(11) 9123-4'],
    ['11912345678', '(11) 91234-5678'],
    ['1112345678', '(11) 1234-5678'],
    ['(11) 91234-5678999', '(11) 91234-5678'],
    ['abc', ''],
  ])('%s → %s', (entrada, esperado) => {
    expect(mascararTelefone(entrada)).toBe(esperado);
  });
});

describe('medirMensagem', () => {
  it('conta emoji como 1 e CRLF como uma quebra só', () => {
    expect(medirMensagem('a\u{1F9C0}b')).toEqual({ caracteres: 3, linhas: 1 });
    expect(medirMensagem('a\r\nb\rc')).toEqual({ caracteres: 5, linhas: 3 });
  });

  it('ignora espaços nas pontas, como o esquema', () => {
    expect(medirMensagem('  oi  ')).toEqual({ caracteres: 2, linhas: 1 });
  });
});
