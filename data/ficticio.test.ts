import { describe, expect, it } from 'vitest';
import { exigirCentavos } from '../lib/dinheiro';
import {
  DADOS_FICTICIOS_ATIVOS,
  FAIXAS_DE_FRETE_FICTICIAS,
  NUMERO_WHATSAPP_FICTICIO,
  dadosFicticiosPermitidos,
  exigirDadosFicticiosPermitidos,
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

describe('dadosFicticiosPermitidos (P74)', () => {
  it('permitido em next dev, mesmo sem a variável', () => {
    expect(dadosFicticiosPermitidos({ NODE_ENV: 'development' })).toBe(true);
  });

  it('em build (NODE_ENV=production): só com PERMITIR_DADOS_FICTICIOS=1', () => {
    expect(dadosFicticiosPermitidos({ NODE_ENV: 'production' })).toBe(false);
    expect(
      dadosFicticiosPermitidos({ NODE_ENV: 'production', PERMITIR_DADOS_FICTICIOS: '0' }),
    ).toBe(false);
    expect(
      dadosFicticiosPermitidos({ NODE_ENV: 'production', PERMITIR_DADOS_FICTICIOS: '1' }),
    ).toBe(true);
  });

  it('nunca com VERCEL_ENV=production, nem com a variável nem em dev', () => {
    expect(
      dadosFicticiosPermitidos({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        PERMITIR_DADOS_FICTICIOS: '1',
      }),
    ).toBe(false);
    expect(dadosFicticiosPermitidos({ NODE_ENV: 'development', VERCEL_ENV: 'production' })).toBe(
      false,
    );
  });

  it('preview na Vercel com a variável: permitido', () => {
    expect(
      dadosFicticiosPermitidos({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        PERMITIR_DADOS_FICTICIOS: '1',
      }),
    ).toBe(true);
  });
});

describe('exigirDadosFicticiosPermitidos (build)', () => {
  it('sem a variável: lança dizendo exatamente o que definir', () => {
    expect(() => exigirDadosFicticiosPermitidos({ NODE_ENV: 'production' })).toThrow(
      /defina PERMITIR_DADOS_FICTICIOS=1/,
    );
  });

  it('com a variável, sem dados fictícios ativos ou em dev: não lança', () => {
    expect(() =>
      exigirDadosFicticiosPermitidos({ NODE_ENV: 'production', PERMITIR_DADOS_FICTICIOS: '1' }),
    ).not.toThrow();
    expect(() => exigirDadosFicticiosPermitidos({ NODE_ENV: 'production' }, false)).not.toThrow();
  });

  it('build com NODE_ENV=test ou development sem a variável lança', () => {
    for (const NODE_ENV of ['test', 'development']) {
      expect(() => exigirDadosFicticiosPermitidos({ NODE_ENV })).toThrow(
        /defina PERMITIR_DADOS_FICTICIOS=1/,
      );
    }
    expect(() =>
      exigirDadosFicticiosPermitidos({ NODE_ENV: 'test', PERMITIR_DADOS_FICTICIOS: '1' }),
    ).not.toThrow();
  });

  it('em produção na Vercel não duplica a trava: quem bloqueia é exigirSemDadosFicticiosEmProducao', () => {
    const ambiente = { NODE_ENV: 'production', VERCEL_ENV: 'production' };
    expect(() => exigirDadosFicticiosPermitidos(ambiente)).not.toThrow();
    expect(() => exigirSemDadosFicticiosEmProducao('production')).toThrow(
      /Build de produção bloqueado/,
    );
  });
});
