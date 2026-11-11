import { describe, expect, it } from 'vitest';
import {
  cabecalhosDeSeguranca,
  ehServidorDeDesenvolvimento,
  politicaDeConteudo,
} from './cabecalhos';

const BASE =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

describe('politicaDeConteudo', () => {
  it('local (build/start fora da Vercel de produção): política base', () => {
    expect(politicaDeConteudo({ desenvolvimento: false, producao: false })).toBe(BASE);
  });

  it("desenvolvimento acrescenta 'unsafe-eval' só em script-src", () => {
    const csp = politicaDeConteudo({ desenvolvimento: true, producao: false });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval';");
    expect(csp.match(/unsafe-eval/g)).toHaveLength(1);
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('produção acrescenta upgrade-insecure-requests e nenhum unsafe-eval', () => {
    const csp = politicaDeConteudo({ desenvolvimento: false, producao: true });
    expect(csp).toBe(`${BASE}; upgrade-insecure-requests`);
    expect(csp).not.toContain('unsafe-eval');
  });

  it('nunca libera outro domínio, wasm nem worker (diretivas do 3D só com GLB comprimido)', () => {
    for (const desenvolvimento of [true, false]) {
      for (const producao of [true, false]) {
        const csp = politicaDeConteudo({ desenvolvimento, producao });
        expect(csp).not.toMatch(/https?:/);
        expect(csp).not.toContain('wasm-unsafe-eval');
        expect(csp).not.toContain('worker-src');
      }
    }
  });
});

describe('cabecalhosDeSeguranca', () => {
  const comoMapa = (o: { desenvolvimento: boolean; producao: boolean }) =>
    Object.fromEntries(cabecalhosDeSeguranca(o).map((c) => [c.key, c.value]));

  it('traz os seis cabeçalhos do ADR-0015 com os valores exatos', () => {
    const c = comoMapa({ desenvolvimento: false, producao: false });
    expect(Object.keys(c)).toHaveLength(6);
    expect(c['Content-Security-Policy']).toBe(BASE);
    expect(c['Strict-Transport-Security']).toBe('max-age=31536000');
    expect(c['X-Content-Type-Options']).toBe('nosniff');
    expect(c['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(c['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    expect(c['X-Frame-Options']).toBe('DENY');
  });

  it('em todas as combinações: seis cabeçalhos, sem chave repetida', () => {
    for (const desenvolvimento of [true, false]) {
      for (const producao of [true, false]) {
        const chaves = cabecalhosDeSeguranca({ desenvolvimento, producao }).map((c) => c.key);
        expect(new Set(chaves).size).toBe(6);
      }
    }
  });

  it('HSTS sem includeSubDomains e sem preload', () => {
    const hsts = comoMapa({ desenvolvimento: false, producao: true })['Strict-Transport-Security'];
    expect(hsts).not.toMatch(/includeSubDomains|preload/i);
  });

  it('a CSP segue o ambiente', () => {
    expect(comoMapa({ desenvolvimento: true, producao: false })['Content-Security-Policy']).toBe(
      politicaDeConteudo({ desenvolvimento: true, producao: false }),
    );
    expect(comoMapa({ desenvolvimento: false, producao: true })['Content-Security-Policy']).toMatch(
      /upgrade-insecure-requests$/,
    );
  });
});

describe('ehServidorDeDesenvolvimento', () => {
  it('só a fase do servidor de desenvolvimento libera o eval da CSP', () => {
    expect(ehServidorDeDesenvolvimento('phase-development-server')).toBe(true);
    expect(ehServidorDeDesenvolvimento('phase-production-build')).toBe(false);
    expect(ehServidorDeDesenvolvimento('phase-production-server')).toBe(false);
  });
});
