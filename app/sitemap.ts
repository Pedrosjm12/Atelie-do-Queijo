import type { MetadataRoute } from 'next';
import { caminhosIndexaveis } from '@/lib/seo';
import { urlDoSite } from '@/lib/site';

/**
 * Sitemap com as rotas indexáveis, em URL absoluta. Sem `lastModified`, `changeFrequency` e
 * `priority`: não há datas reais e os buscadores ignoram os dois últimos (plano da etapa 8).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = urlDoSite();
  return caminhosIndexaveis().map((caminho) => ({ url: new URL(caminho, site).toString() }));
}
