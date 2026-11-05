import type { Shape, SlugDoQueijo } from '@/data/cheeses';
import { exigirCentavos } from './dinheiro';
import type { Centavos } from './dinheiro';
import type { ItemDaSacola, Sacola } from './sacola';

// Fica fora de `lib/sacola.ts` (ADR-0012): só /sacola, /checkout e o servidor precificam; o
// provider da sacola, no pacote global, não precisa deste código.

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
