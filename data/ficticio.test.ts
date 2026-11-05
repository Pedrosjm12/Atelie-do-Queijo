import { describe, expect, it } from 'vitest';
import { exigirCentavos } from '../lib/dinheiro';
import {
  DADOS_FICTICIOS_ATIVOS,
  FAIXAS_DE_FRETE_FICTICIAS,
  NUMERO_WHATSAPP_FICTICIO,
  exigirSemDadosFicticiosEmProducao,
} from './ficticio';

describe('número do WhatsApp fictício', () => {
  it('é só dígitos, com DDD inexistente (20)', () => {
    expect(NUMERO_WHATSAPP_FICTICIO).toBe('5520900000000');
    expect(NUMERO_WHATSAPP_FICTICIO).toMatch(/^55\d{10,11}$/);
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
