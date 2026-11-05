import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from './robots';

afterEach(() => vi.unstubAllEnvs());

describe('robots', () => {
  it('produção: Allow /, sitemap absoluto e sem Disallow para sacola e checkout', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.exemplo.com.br');
    const r = robots();
    expect(r.rules).toEqual({ userAgent: '*', allow: '/' });
    expect(r.sitemap).toBe('https://www.exemplo.com.br/sitemap.xml');
    expect(JSON.stringify(r)).not.toMatch(/sacola|checkout|disallow/i);
  });

  it('prévia: Disallow /, sem sitemap', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://previa.exemplo.com.br');
    const r = robots();
    expect(r.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(r.sitemap).toBeUndefined();
  });

  it('local (sem VERCEL_ENV): Disallow /', () => {
    vi.stubEnv('VERCEL_ENV', '');
    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' });
  });
});
