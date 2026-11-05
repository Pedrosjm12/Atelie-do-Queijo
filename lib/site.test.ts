import { describe, expect, it } from 'vitest';
import { ehProducao, urlDoSite } from './site';

describe('urlDoSite', () => {
  it('fora de produção, ausente vale localhost', () => {
    expect(urlDoSite({}).href).toBe('http://localhost:3000/');
    expect(urlDoSite({ NEXT_PUBLIC_SITE_URL: '  ' }).origin).toBe('http://localhost:3000');
  });

  it('em produção, ausente lança erro em português', () => {
    expect(() => urlDoSite({ VERCEL_ENV: 'production' })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it('em produção exige https', () => {
    expect(() =>
      urlDoSite({ VERCEL_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'http://exemplo.com.br' }),
    ).toThrow(/https/);
    expect(
      urlDoSite({ VERCEL_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://exemplo.com.br' })
        .origin,
    ).toBe('https://exemplo.com.br');
  });

  it('fora de produção aceita http', () => {
    expect(urlDoSite({ NEXT_PUBLIC_SITE_URL: 'http://localhost:4000' }).origin).toBe(
      'http://localhost:4000',
    );
  });

  it('valor inválido lança erro, mesmo fora de produção', () => {
    expect(() => urlDoSite({ NEXT_PUBLIC_SITE_URL: 'não é url' })).toThrow(/inválida/);
    expect(() => urlDoSite({ NEXT_PUBLIC_SITE_URL: 'ftp://exemplo.com' })).toThrow(/http/);
  });

  it('rejeita caminho, query e hash', () => {
    for (const valor of ['https://a.com/loja', 'https://a.com/?x=1', 'https://a.com/#topo']) {
      expect(() => urlDoSite({ NEXT_PUBLIC_SITE_URL: valor })).toThrow(/sem caminho/);
    }
  });

  it('devolve só a origem (barra final removida)', () => {
    expect(urlDoSite({ NEXT_PUBLIC_SITE_URL: 'https://a.com/' }).href).toBe('https://a.com/');
  });
});

describe('ehProducao', () => {
  it('só VERCEL_ENV=production é produção', () => {
    expect(ehProducao({ VERCEL_ENV: 'production' })).toBe(true);
    expect(ehProducao({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(ehProducao({})).toBe(false);
  });
});
