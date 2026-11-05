import { afterEach, describe, expect, it, vi } from 'vitest';
import { caminhosIndexaveis } from '@/lib/seo';
import sitemap from './sitemap';

afterEach(() => vi.unstubAllEnvs());

describe('sitemap', () => {
  it('lista exatamente as 18 rotas indexáveis, absolutas, na ordem', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.exemplo.com.br');
    const urls = sitemap().map((item) => item.url);
    expect(urls).toHaveLength(18);
    expect(urls).toEqual(caminhosIndexaveis().map((c) => `https://www.exemplo.com.br${c}`));
    expect(urls[0]).toBe('https://www.exemplo.com.br/');
  });

  it('não inclui sacola, checkout nem a 404', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.exemplo.com.br');
    const urls = sitemap().map((item) => item.url);
    expect(urls.some((u) => /sacola|checkout|not-found|404/.test(u))).toBe(false);
  });

  it('sem NEXT_PUBLIC_SITE_URL fora de produção usa localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_ENV', '');
    expect(sitemap()[1]?.url).toBe('http://localhost:3000/queijos');
  });

  it('não traz datas nem prioridades', () => {
    for (const item of sitemap()) {
      expect(Object.keys(item)).toEqual(['url']);
    }
  });
});
