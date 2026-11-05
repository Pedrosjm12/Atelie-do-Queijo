import type { MetadataRoute } from 'next';
import { ehProducao, urlDoSite } from '@/lib/site';

/**
 * Produção: tudo liberado e aponta para o sitemap. Sem `Disallow` para /sacola e /checkout: o
 * `noindex` delas só funciona se o buscador puder ler a página. Prévias e local: `Disallow: /`.
 */
export default function robots(): MetadataRoute.Robots {
  if (!ehProducao()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', urlDoSite()).toString(),
  };
}
