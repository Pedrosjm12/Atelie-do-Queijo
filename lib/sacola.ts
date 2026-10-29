import type { Shape, SlugDoQueijo } from '@/data/cheeses';
import { exigirCentavos } from './dinheiro';
import type { Centavos } from './dinheiro';
import { TAMANHO_MAXIMO_DO_ID, ehFormatoValido } from './formatosDaSacola';

// Este arquivo só importa TIPOS de `data/` (nunca valores): ele roda no navegador, no pacote global.

export const CHAVE_DA_SACOLA = 'atelie:sacola:v1';
export const VERSAO_DA_SACOLA = 1;
export const QUANTIDADE_MAXIMA_POR_ITEM = 10; // P35
export const MAXIMO_DE_LINHAS = 30;
export const TAMANHO_MAXIMO_SALVO = 8 * 1024; // caracteres do JSON salvo

export interface ItemDaSacola {
  slug: SlugDoQueijo;
  formatoId: string;
  quantidade: number;
}

export interface Sacola {
  itens: readonly ItemDaSacola[];
  presente: boolean;
}

export const SACOLA_VAZIA: Sacola = Object.freeze({ itens: Object.freeze([]), presente: false });

export type AcaoDaSacola =
  | {
      tipo: 'adicionar';
      slug: SlugDoQueijo;
      formatoId: string;
      quantidade: number;
      presente?: boolean;
    }
  | { tipo: 'alterar-quantidade'; slug: SlugDoQueijo; formatoId: string; quantidade: number }
  | { tipo: 'remover'; slug: SlugDoQueijo; formatoId: string }
  | { tipo: 'definir-presente'; presente: boolean }
  | { tipo: 'limpar' }
  | { tipo: 'substituir'; sacola: Sacola }; // leitura do storage e evento de outra aba

/** Limita a 1..QUANTIDADE_MAXIMA_POR_ITEM. Só vale para inteiros. */
function limitar(quantidade: number): number {
  return Math.min(QUANTIDADE_MAXIMA_POR_ITEM, Math.max(1, quantidade));
}

function mesmaLinha(i: ItemDaSacola, slug: string, formatoId: string): boolean {
  return i.slug === slug && i.formatoId === formatoId;
}

/**
 * Puro. Soma linhas iguais, limita a 1..QUANTIDADE_MAXIMA_POR_ITEM e ignora formato inexistente,
 * esgotado ou quantidade que não seja inteiro (devolve a mesma sacola, sem lançar).
 */
export function reduzirSacola(s: Sacola, a: AcaoDaSacola): Sacola {
  switch (a.tipo) {
    case 'adicionar': {
      if (!ehFormatoValido(a.slug, a.formatoId) || !Number.isSafeInteger(a.quantidade)) return s;
      const existente = s.itens.find((i) => mesmaLinha(i, a.slug, a.formatoId));
      if (!existente && s.itens.length >= MAXIMO_DE_LINHAS) return s;
      const presente = s.presente || a.presente === true;
      // Linha já em 10 e marca de presente igual: nada muda, devolve a MESMA referência.
      if (existente) {
        const quantidade = limitar(existente.quantidade + limitar(a.quantidade));
        if (quantidade === existente.quantidade && presente === s.presente) return s;
      }
      const itens = existente
        ? s.itens.map((i) =>
            i === existente
              ? { ...i, quantidade: limitar(i.quantidade + limitar(a.quantidade)) }
              : i,
          )
        : [...s.itens, { slug: a.slug, formatoId: a.formatoId, quantidade: limitar(a.quantidade) }];
      return { itens, presente };
    }
    case 'alterar-quantidade': {
      if (!Number.isSafeInteger(a.quantidade)) return s;
      const existente = s.itens.find((i) => mesmaLinha(i, a.slug, a.formatoId));
      if (!existente) return s;
      const quantidade = limitar(a.quantidade);
      if (quantidade === existente.quantidade) return s;
      return { ...s, itens: s.itens.map((i) => (i === existente ? { ...i, quantidade } : i)) };
    }
    case 'remover': {
      if (!s.itens.some((i) => mesmaLinha(i, a.slug, a.formatoId))) return s;
      const itens = s.itens.filter((i) => !mesmaLinha(i, a.slug, a.formatoId));
      // Sacola sem itens não carrega a marca de presente para a próxima compra.
      return itens.length === 0 ? SACOLA_VAZIA : { ...s, itens };
    }
    case 'definir-presente':
      // Sacola vazia não carrega a marca de presente (mesma regra de `remover` e da leitura).
      if (s.itens.length === 0) return s;
      return typeof a.presente === 'boolean' && a.presente !== s.presente
        ? { ...s, presente: a.presente }
        : s;
    case 'limpar':
      return SACOLA_VAZIA;
    case 'substituir':
      return a.sacola;
  }
}

/** Soma das quantidades (contador do cabeçalho, §10.1). */
export function totalDeItens(s: Sacola): number {
  return s.itens.reduce((soma, i) => soma + i.quantidade, 0);
}

/** Grava só `v`, `itens[{ slug, formatoId, quantidade }]` e `presente`: nunca preço, nome ou dado pessoal. */
export function serializarSacola(s: Sacola): string {
  return JSON.stringify({
    v: VERSAO_DA_SACOLA,
    itens: s.itens.map(({ slug, formatoId, quantidade }) => ({ slug, formatoId, quantidade })),
    presente: s.presente,
  });
}

// Validação escrita à mão (ADR-0007 §orçamento): o Zod não entra no pacote global. Só lê as chaves
// `slug`, `formatoId` e `quantidade`; qualquer outra (preço, nome, `__proto__`) é ignorada.
function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehItemSalvo(
  valor: unknown,
): valor is { slug: string; formatoId: string; quantidade: number } {
  return (
    ehObjeto(valor) &&
    typeof valor.slug === 'string' &&
    valor.slug.length <= TAMANHO_MAXIMO_DO_ID &&
    typeof valor.formatoId === 'string' &&
    valor.formatoId.length <= TAMANHO_MAXIMO_DO_ID &&
    typeof valor.quantidade === 'number' &&
    Number.isSafeInteger(valor.quantidade)
  );
}

/**
 * Nunca lança. Aplica a sanitização do ADR-0008 §1: mais de 8 KB, JSON inválido, outra versão ou
 * formato inesperado → sacola vazia; item inválido, inexistente, esgotado ou com quantidade que
 * não é inteiro → só ele é descartado; quantidade fora de 1..10 é limitada; linhas repetidas
 * são somadas; no máximo MAXIMO_DE_LINHAS linhas. `corrigida` indica que a versão limpa difere
 * do que estava salvo e precisa ser regravada (`null` nunca é corrigida).
 */
export function lerSacolaSalva(bruto: string | null): { sacola: Sacola; corrigida: boolean } {
  if (bruto === null) return { sacola: SACOLA_VAZIA, corrigida: false };
  const vazia = { sacola: SACOLA_VAZIA, corrigida: true };
  // O limite é conferido em `length` ANTES do JSON.parse.
  if (typeof bruto !== 'string' || bruto.length > TAMANHO_MAXIMO_SALVO) return vazia;

  let json: unknown;
  try {
    json = JSON.parse(bruto);
  } catch {
    return vazia;
  }

  if (!ehObjeto(json) || json.v !== VERSAO_DA_SACOLA || !Array.isArray(json.itens)) return vazia;

  const itens: ItemDaSacola[] = [];
  for (const candidato of json.itens as unknown[]) {
    if (!ehItemSalvo(candidato)) continue;
    const { slug, formatoId, quantidade } = candidato;
    if (!ehFormatoValido(slug, formatoId)) continue;
    const existente = itens.findIndex((i) => mesmaLinha(i, slug, formatoId));
    if (existente >= 0) {
      const atual = itens[existente];
      if (atual)
        itens[existente] = {
          ...atual,
          quantidade: limitar(atual.quantidade + limitar(quantidade)),
        };
    } else if (itens.length < MAXIMO_DE_LINHAS) {
      itens.push({ slug, formatoId, quantidade: limitar(quantidade) });
    }
  }

  const sacola: Sacola =
    itens.length === 0 ? SACOLA_VAZIA : { itens, presente: json.presente === true };
  return { sacola, corrigida: serializarSacola(sacola) !== bruto };
}

/** O que /sacola e /checkout recebem do servidor (sem textos de detalhe). */
export interface ResumoParaSacola {
  slug: SlugDoQueijo;
  nome: string;
  esgotado: boolean;
  ilustracao: { shape: Shape; side: string; top: string };
  formatos: readonly { id: string; nome: string; peso: string; preco: Centavos }[];
}

export interface LinhaPrecificada extends ItemDaSacola {
  nome: string;
  formatoNome: string;
  peso: string;
  precoUnitario: Centavos;
  total: Centavos;
}

/**
 * Junta itens e catálogo; o preço vem sempre do catálogo, nunca da sacola. Itens sem queijo ou
 * formato correspondente, ou de queijo esgotado, vão para `ignorados` (não quebram a página).
 */
export function precificarSacola(
  s: Sacola,
  catalogo: readonly ResumoParaSacola[],
): { linhas: readonly LinhaPrecificada[]; subtotal: Centavos; ignorados: number } {
  const porSlug = new Map(catalogo.map((q) => [q.slug as string, q]));
  const linhas: LinhaPrecificada[] = [];
  let ignorados = 0;
  for (const item of s.itens) {
    const queijo = porSlug.get(item.slug);
    const formato = queijo?.formatos.find((f) => f.id === item.formatoId);
    if (!queijo || !formato || queijo.esgotado) {
      ignorados += 1;
      continue;
    }
    exigirCentavos(formato.preco, 'Preço do formato'); // catálogo com preço fracionário/negativo: falha alto
    linhas.push({
      ...item,
      nome: queijo.nome,
      formatoNome: formato.nome,
      peso: formato.peso,
      precoUnitario: formato.preco,
      total: formato.preco * item.quantidade,
    });
  }
  const subtotal = linhas.reduce((soma, l) => soma + l.total, 0);
  exigirCentavos(subtotal, 'Subtotal');
  return { linhas, subtotal, ignorados };
}
