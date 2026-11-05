import { describe, expect, it } from 'vitest';
import { QUEIJOS } from './cheeses';
import { ANO_PRODUTOR_CANASTRA_FICTICIO, PRODUTOR_CANASTRA_FICTICIO } from './ficticio';
import { PRODUTORES } from './produtores';

describe('PRODUTORES', () => {
  it('só cita queijos que existem no catálogo', () => {
    const slugs = new Set<string>(QUEIJOS.map((q) => q.slug));
    for (const p of PRODUTORES) for (const q of p.queijos) expect(slugs.has(q)).toBe(true);
  });

  it('o nome é igual ao detalhe.produtor dos queijos dele', () => {
    for (const p of PRODUTORES) {
      for (const slug of p.queijos) {
        const queijo = QUEIJOS.find((q) => q.slug === slug);
        expect(queijo?.detalhe.produtor).toBe(p.nome);
      }
    }
  });

  it('o produtor do Canastra usa o ano de data/ficticio.ts', () => {
    const canastra = PRODUTORES.find((p) => p.id === 'canastra');
    expect(canastra?.desde).toBe(ANO_PRODUTOR_CANASTRA_FICTICIO);
    expect(canastra?.regiao).toBe('Serra da Canastra, MG');
  });

  it('ids únicos', () => {
    expect(new Set(PRODUTORES.map((p) => p.id)).size).toBe(PRODUTORES.length);
  });

  it('o nome do Canastra vem de data/ficticio.ts', () => {
    const canastra = PRODUTORES.find((p) => p.id === 'canastra');
    expect(canastra?.nome).toContain(PRODUTOR_CANASTRA_FICTICIO);
  });

  it('cada produtor tem ao menos um queijo, sem repetição, e textos preenchidos', () => {
    for (const p of PRODUTORES) {
      expect(p.queijos.length).toBeGreaterThan(0);
      expect(new Set(p.queijos).size).toBe(p.queijos.length);
      expect(p.regiao.trim()).not.toBe('');
      expect(p.foto.trim()).not.toBe('');
      expect(p.desde.trim()).not.toBe('');
    }
  });
});
