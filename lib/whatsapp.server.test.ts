import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NUMERO_WHATSAPP_FICTICIO } from '@/data/ficticio';
import { numeroDoWhatsApp } from './whatsapp.server';

describe('numeroDoWhatsApp', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('fora de produção, sem variável (vazia ou ausente): usa o fictício', () => {
    vi.stubEnv('WHATSAPP_NUMBER', '');
    expect(numeroDoWhatsApp()).toBe(NUMERO_WHATSAPP_FICTICIO);
    vi.stubEnv('WHATSAPP_NUMBER', undefined);
    expect(numeroDoWhatsApp()).toBe(NUMERO_WHATSAPP_FICTICIO);
  });

  it('com a variável válida: usa o valor, removendo o que não for dígito', () => {
    vi.stubEnv('WHATSAPP_NUMBER', '+55 (11) 98888-7777');
    expect(numeroDoWhatsApp()).toBe('5511988887777');
  });

  it('variável fora do formato 55 + 10 ou 11 dígitos: cai no fictício fora de produção', () => {
    for (const v of ['123', 'abc', '5511', '1198888777712', '55' + '1'.repeat(12)]) {
      vi.stubEnv('WHATSAPP_NUMBER', v);
      expect(numeroDoWhatsApp(), v).toBe(NUMERO_WHATSAPP_FICTICIO);
    }
  });

  it('em produção (VERCEL_ENV): variável ausente ou inválida → null; válida → o número', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('WHATSAPP_NUMBER', undefined);
    expect(numeroDoWhatsApp()).toBeNull();
    vi.stubEnv('WHATSAPP_NUMBER', '123');
    expect(numeroDoWhatsApp()).toBeNull();
    vi.stubEnv('WHATSAPP_NUMBER', '5511988887777');
    expect(numeroDoWhatsApp()).toBe('5511988887777');
  });
});

describe('lib/whatsapp.server.ts', () => {
  it('o módulo declara que é só do servidor', () => {
    const codigo = readFileSync(join(process.cwd(), 'lib', 'whatsapp.server.ts'), 'utf8');
    expect(codigo).toMatch(/^import 'server-only';/m);
  });
});
