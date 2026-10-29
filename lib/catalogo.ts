import { QUEIJOS } from '@/data/cheeses';
import type { Cheese, Formato, Origem, SlugDoQueijo } from '@/data/cheeses';
import type { Centavos } from './dinheiro';
import type { ResumoParaSacola } from './sacola';

const CATALOGO: readonly Cheese[] = QUEIJOS;

const SLUGS: ReadonlySet<string> = new Set(CATALOGO.map((q) => q.slug));

/** Type guard: `true` se o valor é o slug de um queijo do catálogo. */
export function ehSlugDoQueijo(valor: unknown): valor is SlugDoQueijo {
  return typeof valor === 'string' && SLUGS.has(valor);
}

/** Type guard: `true` para 'brasil' ou 'mundo'. */
export function ehOrigem(valor: unknown): valor is Origem {
  return valor === 'brasil' || valor === 'mundo';
}

/** Todos os queijos, na ordem da §9. */
export function listarQueijos(): readonly Cheese[] {
  return CATALOGO;
}

export function obterQueijo(slug: string): Cheese | undefined {
  return CATALOGO.find((q) => q.slug === slug);
}

/** `searchParams.origem` → 'brasil' | 'mundo' | null (null = Todos; inválido ou repetido também vira null). */
export function lerOrigem(valor: string | string[] | undefined): Origem | null {
  return ehOrigem(valor) ? valor : null;
}

export function filtrarPorOrigem(origem: Origem | null): readonly Cheese[] {
  return origem === null ? CATALOGO : CATALOGO.filter((q) => q.origem === origem);
}

export function contarPorOrigem(): { todos: number; brasil: number; mundo: number } {
  return {
    todos: CATALOGO.length,
    brasil: filtrarPorOrigem('brasil').length,
    mundo: filtrarPorOrigem('mundo').length,
  };
}

/** Os queijos da vitrine "Na cave esta semana", na ordem de `destaqueSemana`. */
export function destaquesDaSemana(): readonly Cheese[] {
  return CATALOGO.filter((q) => q.destaqueSemana !== undefined).sort(
    (a, b) => (a.destaqueSemana ?? 0) - (b.destaqueSemana ?? 0),
  );
}

/** Regra da §9: mais de um formato → "a partir de" + menor preço; um só → peso + preço. */
export function precoDeVitrine(q: Cheese): { linhaPequena: string; preco: Centavos } {
  if (q.formatos.length > 1) {
    return {
      linhaPequena: 'a partir de',
      preco: Math.min(...q.formatos.map((f) => f.preco)),
    };
  }
  return { linhaPequena: q.formatos[0].peso, preco: q.formatos[0].preco };
}

/**
 * O formato que o cartão e o quiz põem na sacola (P24): aquele cujo preço o cartão mostra, ou
 * seja, o menor (no empate, o primeiro).
 */
export function formatoDeVitrine(q: Cheese): Formato {
  return q.formatos.reduce((menor, f) => (f.preco < menor.preco ? f : menor));
}

/** Textos do cartão por contexto. 'home' e 'chat' aplicam `vitrine`; 'catalogo' usa a §9 pura. */
export function dadosDoCartao(
  q: Cheese,
  contexto: 'home' | 'catalogo' | 'chat',
): { tag: string; nota: string; linhaPequena: string; preco: Centavos } {
  const base = precoDeVitrine(q);
  const vitrine = contexto === 'catalogo' ? undefined : q.vitrine;
  return {
    tag: vitrine?.tag ?? q.tag,
    nota: vitrine?.nota ?? q.nota,
    linhaPequena: vitrine?.linhaPequena ?? base.linhaPequena,
    preco: base.preco,
  };
}

/**
 * Dados mínimos que /sacola (e depois /checkout) recebem do servidor como props, para o cliente
 * não importar `data/cheeses`: nome, formatos (id, nome, peso, preço), ilustração e estoque.
 * Função pura sobre o catálogo estático.
 */
export function resumoParaSacola(): readonly ResumoParaSacola[] {
  return CATALOGO.map((q) => ({
    slug: q.slug,
    nome: q.nome,
    esgotado: q.estoque.situacao === 'esgotado',
    ilustracao: { shape: q.ilustracao.shape, side: q.ilustracao.side, top: q.ilustracao.top },
    formatos: q.formatos.map(({ id, nome, peso, preco }) => ({ id, nome, peso, preco })),
  }));
}
