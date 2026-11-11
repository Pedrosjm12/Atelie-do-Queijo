/**
 * Dados estruturados (JSON-LD, schema.org). Módulo de servidor, puro. Nenhum arquivo `'use client'`
 * pode importá-lo (teste em `servidor.fronteira.test.ts`).
 *
 * Regra única (P71 = A, ADR-0011): nenhum campo recebe texto com `[` (lacuna) nem valor de
 * `data/ficticio.ts`; o construtor OMITE o campo em vez de publicá-lo. Nunca `Offer` com preço nulo.
 */

import type { Artigo } from '@/data/artigos';
import type { Cheese } from '@/data/cheeses';
import * as ficticio from '@/data/ficticio';
import { descricaoDoArtigo, NOME_DO_SITE } from '@/lib/seo';

export type Json =
  string | number | boolean | null | readonly Json[] | { readonly [chave: string]: Json };

export type DadoEstruturado = {
  '@context': 'https://schema.org';
  '@type': string;
  [chave: string]: Json;
};

export type ItemDeTrilha = { href: string; texto: string };

const CONTEXTO = 'https://schema.org' as const;

/** Ícone A.1 (P70): `app/icon.svg`, servido em `/icon.svg`. */
const CAMINHO_DO_LOGO = '/icon.svg';

/**
 * Só os TEXTOS exportados por `data/ficticio.ts` (número do WhatsApp, CNPJ, endereço, produtor...),
 * lidos das exportações para não duplicar literais. Números e listas (parcelas, faixas de frete) ficam
 * de fora. Ignora textos curtos (o ano, por exemplo), que dariam falso
 * positivo; o ano só aparece junto do produtor, que já é barrado.
 */
const VALORES_FICTICIOS: readonly string[] = Object.values(
  ficticio as Record<string, unknown>,
).filter((v): v is string => typeof v === 'string' && v.length >= 5);

/**
 * Texto verdadeiro: devolve `undefined` (o campo é omitido) quando vazio, com `[` (lacuna) ou
 * contendo qualquer valor de `data/ficticio.ts`.
 */
function textoVerdadeiro(texto: string | null | undefined): string | undefined {
  if (texto == null) return undefined;
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo === '' || limpo.includes('[')) return undefined;
  return VALORES_FICTICIOS.some((f) => limpo.includes(f)) ? undefined : limpo;
}

/** Objeto sem as chaves `undefined`. */
function compacto(campos: Record<string, Json | undefined>): { [chave: string]: Json } {
  const saida: { [chave: string]: Json } = {};
  for (const [chave, valor] of Object.entries(campos)) {
    if (valor !== undefined) saida[chave] = valor;
  }
  return saida;
}

function dado(tipo: string, campos: Record<string, Json | undefined>): DadoEstruturado {
  return { '@context': CONTEXTO, '@type': tipo, ...compacto(campos) };
}

function absoluta(caminho: string, site: URL): string {
  return new URL(caminho, site).href;
}

/** `13600` -> `"136.00"` (ponto e duas casas, só aritmética inteira). */
function precoEmTexto(centavos: number): string {
  const inteiro = Math.trunc(centavos / 100);
  const resto = centavos % 100;
  return `${inteiro}.${String(resto).padStart(2, '0')}`;
}

export function organizacao(site: URL): DadoEstruturado {
  return dado('Organization', {
    name: NOME_DO_SITE,
    url: absoluta('/', site),
    logo: absoluta(CAMINHO_DO_LOGO, site),
  });
}

/** Sem `SearchAction`: o site não tem busca (D19). */
export function siteWeb(site: URL): DadoEstruturado {
  return dado('WebSite', {
    name: NOME_DO_SITE,
    url: absoluta('/', site),
    inLanguage: 'pt-BR',
  });
}

/**
 * `Product` sem `brand` e `image` (sem produtor real nem foto). Um `Offer` por formato com preço
 * maior que zero. Sem `name` verdadeiro, devolve `null` (nada é publicado).
 */
export function produto(queijo: Cheese, site: URL): DadoEstruturado | null {
  const nome = textoVerdadeiro(queijo.nome);
  if (nome === undefined) return null;
  const url = absoluta(`/queijos/${queijo.slug}`, site);
  const disponibilidade =
    queijo.estoque.situacao === 'esgotado'
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';

  const ofertas = queijo.formatos.flatMap((formato) => {
    const preco: number | null = formato.preco;
    if (preco === null || !Number.isInteger(preco) || preco <= 0) return [];
    return [
      compacto({
        '@type': 'Offer',
        name: textoVerdadeiro(`${formato.nome} (${formato.peso})`),
        price: precoEmTexto(preco),
        priceCurrency: 'BRL',
        availability: disponibilidade,
        url,
      }),
    ];
  });

  return dado('Product', {
    name: nome,
    description: textoVerdadeiro(queijo.nota),
    url,
    offers: ofertas.length > 0 ? ofertas : undefined,
  });
}

/** `BreadcrumbList` com os mesmos itens da `Trilha` (os com link, mais a página atual). */
export function trilhaDeNavegacao(
  itens: readonly ItemDeTrilha[],
  atual: ItemDeTrilha,
  site: URL,
): DadoEstruturado | null {
  const todos = [...itens, atual].flatMap((item) => {
    const nome = textoVerdadeiro(item.texto);
    return nome === undefined ? [] : [{ nome, item: absoluta(item.href, site) }];
  });
  if (todos.length === 0) return null;
  return dado('BreadcrumbList', {
    itemListElement: todos.map((entrada, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: entrada.nome,
      item: entrada.item,
    })),
  });
}

/** `Article` só com corpo real; enquanto `corpo === null` devolve `null` (nada é publicado). */
export function artigo(artigo: Artigo, site: URL): DadoEstruturado | null {
  const titulo = textoVerdadeiro(artigo.titulo);
  if (titulo === undefined) return null;
  if (!artigo.corpo || artigo.corpo.every((p) => textoVerdadeiro(p) === undefined)) return null;
  const url = absoluta(`/aprenda/${artigo.slug}`, site);
  return dado('Article', {
    headline: titulo,
    description: textoVerdadeiro(descricaoDoArtigo(artigo)),
    inLanguage: 'pt-BR',
    mainEntityOfPage: url,
    url,
  });
}

/** `JSON.stringify` com `<` trocado por `\u003c`: nada consegue fechar o `<script>`. */
export function serializar(dados: DadoEstruturado | readonly DadoEstruturado[]): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}
