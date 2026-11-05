/**
 * URL pública do site (base das canônicas, do sitemap, do robots e do Open Graph).
 * Módulo de servidor e de build: o `next.config.ts` o importa por caminho relativo (sem o alias `@/`),
 * então este arquivo não importa nada do projeto. Nenhum arquivo `'use client'` pode importá-lo.
 */

const URL_LOCAL = 'http://localhost:3000';

export interface AmbienteDoSite {
  NEXT_PUBLIC_SITE_URL?: string | undefined;
  VERCEL_ENV?: string | undefined;
}

/** Produção de verdade (Vercel `production`). Prévia e local não são produção. */
export function ehProducao(
  ambiente: Pick<AmbienteDoSite, 'VERCEL_ENV'> = { VERCEL_ENV: process.env.VERCEL_ENV },
): boolean {
  return ambiente.VERCEL_ENV === 'production';
}

/**
 * Devolve a URL pública do site, só com origem (sem caminho, `?query` ou `#hash`).
 * - `VERCEL_ENV=production`: variável obrigatória e `https:` (P69).
 * - Fora de produção: ausente vale `http://localhost:3000`; presente e inválida lança erro.
 */
export function urlDoSite(
  ambiente: AmbienteDoSite = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
): URL {
  const producao = ehProducao(ambiente);
  const bruto = ambiente.NEXT_PUBLIC_SITE_URL?.trim() ?? '';

  if (bruto === '') {
    if (producao) {
      throw new Error(
        'Build de produção bloqueado: defina NEXT_PUBLIC_SITE_URL com o endereço público do site (ex.: https://www.seudominio.com.br) nas variáveis da Vercel.',
      );
    }
    return new URL(URL_LOCAL);
  }

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL inválida ("${bruto}"): use um endereço completo, como https://www.seudominio.com.br.`,
    );
  }

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && !producao)) {
    throw new Error(
      producao
        ? `NEXT_PUBLIC_SITE_URL ("${bruto}") precisa começar com https:// em produção.`
        : `NEXT_PUBLIC_SITE_URL ("${bruto}") precisa começar com http:// ou https://.`,
    );
  }
  if ((url.pathname !== '/' && url.pathname !== '') || url.search !== '' || url.hash !== '') {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL ("${bruto}") deve ter só o endereço do site, sem caminho, ? ou #.`,
    );
  }
  return new URL(url.origin);
}
