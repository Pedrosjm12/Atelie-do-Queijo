import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUEIJOS } from '@/data/cheeses';
import type { Cheese } from '@/data/cheeses';
import { ESGOTADOS, FORMATOS_POR_QUEIJO, ehFormatoValido } from './formatosDaSacola';

describe('paridade do índice com o catálogo', () => {
  it('tem os mesmos slugs, na mesma ordem', () => {
    expect(Object.keys(FORMATOS_POR_QUEIJO)).toEqual(QUEIJOS.map((q) => q.slug));
  });

  it('tem os mesmos ids de formato de cada queijo, na mesma ordem', () => {
    for (const q of QUEIJOS) {
      expect(FORMATOS_POR_QUEIJO[q.slug], q.slug).toEqual(q.formatos.map((f) => f.id));
    }
  });

  it('ESGOTADOS bate com o estoque do catálogo', () => {
    const esgotados = (QUEIJOS as readonly Cheese[])
      .filter((q) => q.estoque.situacao === 'esgotado')
      .map((q) => q.slug);
    expect([...ESGOTADOS].sort()).toEqual(esgotados.sort());
  });

  it('não importa valor de data/ (só tipo)', () => {
    for (const arquivo of ['formatosDaSacola.ts', 'sacola.ts', 'pedido.ts', 'commerce.ts']) {
      const codigo = readFileSync(join(process.cwd(), 'lib', arquivo), 'utf8');
      const importsDeData = codigo
        .split('\n')
        .filter((l) => /^\s*import\b/.test(l) && /['"]@\/data\//.test(l));
      for (const linha of importsDeData) expect(linha).toMatch(/^\s*import type\b/);
    }
  });
});

describe('imutabilidade do índice', () => {
  it('o índice e cada lista de formatos estão congelados', () => {
    expect(Object.isFrozen(FORMATOS_POR_QUEIJO)).toBe(true);
    for (const formatos of Object.values(FORMATOS_POR_QUEIJO)) {
      expect(Object.isFrozen(formatos)).toBe(true);
    }
    expect(() => {
      (FORMATOS_POR_QUEIJO as unknown as Record<string, string[]>)['manchego']!.push('x');
    }).toThrow(TypeError);
  });
});

describe('ehFormatoValido', () => {
  it('aceita pares que existem', () => {
    expect(ehFormatoValido('canastra-curado', 'meia')).toBe(true);
    expect(ehFormatoValido('manchego', '250g')).toBe(true);
  });

  it('recusa formato de outro queijo e slug inexistente', () => {
    expect(ehFormatoValido('canastra-curado', 'peca')).toBe(false);
    expect(ehFormatoValido('nao-existe', 'meia')).toBe(false);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf', 'prototype'])(
    'recusa %s como slug e como formatoId, sem lançar',
    (nome) => {
      expect(ehFormatoValido(nome, 'meia')).toBe(false);
      expect(ehFormatoValido('canastra-curado', nome)).toBe(false);
      expect(ehFormatoValido(nome, nome)).toBe(false);
    },
  );

  it('recusa o que não é texto e textos longos demais', () => {
    for (const v of [null, undefined, 1, {}, [], ['canastra-curado'], Symbol('x')]) {
      expect(ehFormatoValido(v, 'meia')).toBe(false);
      expect(ehFormatoValido('canastra-curado', v)).toBe(false);
    }
    expect(ehFormatoValido('a'.repeat(65), 'meia')).toBe(false);
    expect(ehFormatoValido('canastra-curado', 'a'.repeat(65))).toBe(false);
  });
});
