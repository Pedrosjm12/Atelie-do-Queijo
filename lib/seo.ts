import type { Metadata } from 'next';
import { ARTIGOS } from '@/data/artigos';
import type { Artigo } from '@/data/artigos';
import { QUEIJOS } from '@/data/cheeses';

export const NOME_DO_SITE = 'Ateliê do Queijo';

/** Descrição padrão do site (Home e reserva das páginas sem texto próprio). */
export const DESCRICAO_DO_SITE = 'Queijos de autor, escolhidos à mão.';

/**
 * Imagem de compartilhamento (arquivo `app/opengraph-image.tsx`). O merge de metadados é raso: uma
 * página que define `openGraph`/`twitter` perde a imagem do arquivo, então ela é repetida aqui.
 */
export const IMAGEM_DE_COMPARTILHAMENTO = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: NOME_DO_SITE,
  type: 'image/png',
} as const;

const LIMITE_DA_DESCRICAO = 160;

export type CaminhoIndexavel = `/${string}`;

/**
 * Caminhos indexáveis, na ordem do sitemap: '/', '/queijos', '/queijos/<slug>', '/presentes',
 * '/aprenda', '/aprenda/<slug>', '/produtores'. Nunca '/sacola', '/checkout' ou a 404.
 */
export function caminhosIndexaveis(): readonly CaminhoIndexavel[] {
  return [
    '/',
    '/queijos',
    ...QUEIJOS.map((q) => `/queijos/${q.slug}` as const),
    '/presentes',
    '/aprenda',
    ...ARTIGOS.map((a) => `/aprenda/${a.slug}` as const),
    '/produtores',
  ];
}

/**
 * Corta em palavra inteira até `limite` caracteres, com "…" quando corta. Nunca deixa uma lacuna
 * "[...]" cortada ao meio.
 */
export function descricaoCurta(texto: string, limite: number = LIMITE_DA_DESCRICAO): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= limite) return limpo;

  let corte = limpo.slice(0, limite - 1);
  const proximo = limpo.charAt(limite - 1);
  // Só corta no espaço: se o caractere seguinte não é espaço, recua até o último espaço.
  if (proximo !== ' ') {
    const espaco = corte.lastIndexOf(' ');
    corte = espaco > 0 ? corte.slice(0, espaco) : corte;
  }
  // Lacuna aberta e não fechada: recua até antes do "[".
  const abertura = corte.lastIndexOf('[');
  if (abertura > corte.lastIndexOf(']')) corte = corte.slice(0, abertura);
  const aparado = corte.replace(/[\s,;:.\-–—]+$/, '');
  return aparado === '' ? DESCRICAO_DO_SITE : `${aparado}…`;
}

/** Descrição de um artigo (P72): `descricao` do dono; senão o início do corpo; senão a do site. */
export function descricaoDoArtigo(artigo: Pick<Artigo, 'descricao' | 'corpo'>): string {
  if (artigo.descricao) return descricaoCurta(artigo.descricao);
  const primeiro = artigo.corpo?.[0];
  return primeiro ? descricaoCurta(primeiro) : DESCRICAO_DO_SITE;
}

/**
 * Canônica, Open Graph e Twitter de uma página. O merge de metadados do Next é RASO: quem define
 * `openGraph` substitui o do layout inteiro, então toda página indexável usa esta função.
 * A imagem é `IMAGEM_DE_COMPARTILHAMENTO` (repetida em og e twitter).
 */
export function metadadosDaPagina(opcoes: {
  /** Sem query: /queijos?origem=brasil tem canônica /queijos. */
  caminho: CaminhoIndexavel;
  /** null = Home (título padrão). O template do layout não vale para og:title. */
  titulo: string | null;
  descricao: string;
  tipo?: 'website' | 'article';
}): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  const { caminho, titulo, descricao, tipo = 'website' } = opcoes;
  const tituloCompleto = titulo === null ? NOME_DO_SITE : `${titulo} — ${NOME_DO_SITE}`;
  return {
    alternates: { canonical: caminho },
    openGraph: {
      title: tituloCompleto,
      description: descricao,
      url: caminho,
      siteName: NOME_DO_SITE,
      locale: 'pt_BR',
      type: tipo,
      images: [IMAGEM_DE_COMPARTILHAMENTO],
    },
    twitter: {
      card: 'summary_large_image',
      title: tituloCompleto,
      description: descricao,
      images: [IMAGEM_DE_COMPARTILHAMENTO],
    },
  };
}
