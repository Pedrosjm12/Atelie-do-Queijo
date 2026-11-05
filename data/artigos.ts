import type { SlugDoQueijo } from './cheeses';

export type CategoriaDoArtigo =
  'primeiros-passos' | 'harmonizacao' | 'servir-e-guardar' | 'regioes-e-produtores';

/** Ordem e nomes literais da spec §12. O sobretítulo em MAIÚSCULAS vem do CSS do `Overline`. */
export const CATEGORIAS: readonly { id: CategoriaDoArtigo; nome: string }[] = [
  { id: 'primeiros-passos', nome: 'Primeiros passos' },
  { id: 'harmonizacao', nome: 'Harmonização' },
  { id: 'servir-e-guardar', nome: 'Servir e guardar' },
  { id: 'regioes-e-produtores', nome: 'Regiões e produtores' },
];

export type SlugDoArtigo =
  'como-montar-uma-tabua-de-queijos' | 'queijo-e-vinho' | 'como-guardar-queijo-na-geladeira';

export interface Artigo {
  /** Técnico (sem acento); pode mudar sem afetar texto visível. */
  slug: SlugDoArtigo;
  /** Spec §5.8, literal. */
  titulo: string;
  categoria: CategoriaDoArtigo;
  /** Descrição do `[FOTO: …]` da spec §5.8. */
  foto: string;
  /** `null` = lacuna "[TEXTO DO ARTIGO]". */
  corpo: readonly [string, ...string[]] | null;
  /** `null` = lacuna (P60). Lista não vazia quando o dono definir. */
  queijosCitados: readonly [SlugDoQueijo, ...SlugDoQueijo[]] | null;
}

/** Artigos da Escola do Ateliê, na ordem da spec §5.8. */
export const ARTIGOS: readonly Artigo[] = [
  {
    slug: 'como-montar-uma-tabua-de-queijos',
    titulo: 'Como montar uma tábua de queijos',
    categoria: 'primeiros-passos',
    foto: 'tábua montada',
    corpo: null,
    queijosCitados: null,
  },
  {
    slug: 'queijo-e-vinho',
    titulo: 'Queijo e vinho: um guia sem regras chatas',
    categoria: 'harmonizacao',
    foto: 'queijo e taça de vinho',
    corpo: null,
    queijosCitados: null,
  },
  {
    slug: 'como-guardar-queijo-na-geladeira',
    titulo: 'Como guardar queijo na geladeira',
    categoria: 'servir-e-guardar',
    foto: 'queijo embrulhado em papel',
    corpo: null,
    queijosCitados: null,
  },
];

export function obterArtigo(slug: string): Artigo | undefined {
  return ARTIGOS.find((a) => a.slug === slug);
}

/** Nome literal da categoria (spec §12). */
export function nomeDaCategoria(id: CategoriaDoArtigo): string {
  return CATEGORIAS.find((c) => c.id === id)?.nome ?? id;
}
