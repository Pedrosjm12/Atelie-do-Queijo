import { afterEach, describe, expect, it, vi } from 'vitest';
import { exigirCentavos } from '../lib/dinheiro';
import {
  DADOS_FICTICIOS_ATIVOS,
  FAIXAS_DE_FRETE_FICTICIAS,
  NUMERO_WHATSAPP_FICTICIO,
  exigirSemDadosFicticiosEmProducao,
  numeroDoWhatsApp,
} from './ficticio';

describe('numeroDoWhatsApp', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('o fictício é só dígitos, com DDD inexistente (20)', () => {
    expect(NUMERO_WHATSAPP_FICTICIO).toBe('5520900000000');
    expect(NUMERO_WHATSAPP_FICTICIO).toMatch(/^55\d{10,11}$/);
  });

  it('fora de produção, sem variável (vazia ou ausente): usa o fictício', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    expect(numeroDoWhatsApp()).toBe(NUMERO_WHATSAPP_FICTICIO);
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', undefined);
    expect(numeroDoWhatsApp()).toBe(NUMERO_WHATSAPP_FICTICIO);
  });

  it('com a variável válida: usa o valor, removendo o que não for dígito', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+55 (11) 98888-7777');
    expect(numeroDoWhatsApp()).toBe('5511988887777');
  });

  it('variável fora do formato 55 + 10 ou 11 dígitos: cai no fictício fora de produção', () => {
    for (const v of ['123', 'abc', '5511', '1198888777712', '55' + '1'.repeat(12)]) {
      vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', v);
      expect(numeroDoWhatsApp(), v).toBe(NUMERO_WHATSAPP_FICTICIO);
    }
  });

  it('em produção (VERCEL_ENV): variável ausente ou inválida → null; válida → o número', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', undefined);
    expect(numeroDoWhatsApp()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '123');
    expect(numeroDoWhatsApp()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '5511988887777');
    expect(numeroDoWhatsApp()).toBe('5511988887777');
  });
});

describe('trava de produção', () => {
  it('os dados fictícios estão ativos enquanto o dono não trocar', () => {
    expect(DADOS_FICTICIOS_ATIVOS).toBe(true);
  });

  it('VERCEL_ENV=production com dados fictícios: lança erro em português', () => {
    expect(() => exigirSemDadosFicticiosEmProducao('production')).toThrow(
      /Build de produção bloqueado/,
    );
  });

  it('preview, desenvolvimento e ausente: não lança', () => {
    for (const a of ['preview', 'development', undefined]) {
      expect(() => exigirSemDadosFicticiosEmProducao(a)).not.toThrow();
    }
  });

  it('produção sem dados fictícios: não lança', () => {
    expect(() => exigirSemDadosFicticiosEmProducao('production', false)).not.toThrow();
  });
});

describe('FAIXAS_DE_FRETE_FICTICIAS', () => {
  it('todos os valores passam por exigirCentavos e os prazos são inteiros positivos', () => {
    for (const f of FAIXAS_DE_FRETE_FICTICIAS) {
      expect(() => exigirCentavos(f.valor, 'Frete')).not.toThrow();
      expect(Number.isInteger(f.prazoDiasUteis) && f.prazoDiasUteis > 0).toBe(true);
    }
  });
});
