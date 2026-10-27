import type { SlugDoQueijo } from '@/data/cheeses';

/**
 * Índice estático do catálogo para a sacola (ADR-0008 §2): `slug` → ids de formato válidos.
 * Escrito à mão e SEM importar `data/cheeses` (só o tipo), para o provider da sacola, que fica no
 * pacote global, não arrastar o catálogo inteiro. `formatosDaSacola.test.ts` compara este índice
 * com `QUEIJOS` e falha se os dois divergirem.
 */
const FORMATOS = {
  'canastra-curado': ['inteira', 'meia', 'fracao'],
  'canastra-meia-cura-premiado': ['inteira', 'meia'],
  'creme-do-marajo': ['fracao'],
  'penadinho-de-bufala': ['peca'],
  'cabra-com-cinzas': ['peca'],
  'gorgonzola-dolce': ['fracao'],
  'tipo-gruyere': ['meia', 'fracao'],
  'brie-frances': ['500g', '250g'],
  'parmigiano-reggiano': ['500g', '250g'],
  manchego: ['500g', '250g'],
} as const satisfies Readonly<Record<SlugDoQueijo, readonly string[]>>;

/** Congela o objeto e cada array, mantendo os tipos literais. */
function congelar<T extends Readonly<Record<string, readonly string[]>>>(indice: T): T {
  for (const formatos of Object.values(indice)) Object.freeze(formatos);
  return Object.freeze(indice);
}

export const FORMATOS_POR_QUEIJO = congelar(FORMATOS);

/** Queijos esgotados (hoje nenhum; P15). O teste de paridade compara com `estoque` do catálogo. */
export const ESGOTADOS: ReadonlySet<SlugDoQueijo> = new Set<SlugDoQueijo>();

/** Tamanho máximo aceito para `slug` e `formatoId` vindos de fora. */
export const TAMANHO_MAXIMO_DO_ID = 64;

/**
 * `true` só se `slug` é um queijo do índice, não esgotado, e `formatoId` é um formato dele.
 * Aceita qualquer valor (dados externos). A busca usa `Object.hasOwn`, nunca `in` nem acesso
 * direto, para `constructor`, `toString`, `hasOwnProperty` e `__proto__` não passarem.
 */
export function ehFormatoValido(slug: unknown, formatoId: unknown): slug is SlugDoQueijo {
  if (typeof slug !== 'string' || typeof formatoId !== 'string') return false;
  if (slug.length > TAMANHO_MAXIMO_DO_ID || formatoId.length > TAMANHO_MAXIMO_DO_ID) return false;
  if (!Object.hasOwn(FORMATOS_POR_QUEIJO, slug)) return false;
  const chave = slug as SlugDoQueijo;
  if (ESGOTADOS.has(chave)) return false;
  const formatos: readonly string[] = FORMATOS_POR_QUEIJO[chave];
  return formatos.includes(formatoId);
}
