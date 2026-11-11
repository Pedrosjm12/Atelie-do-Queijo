import { createContext, useContext } from 'react';

/** O aviso em exibição. `id` muda a cada nova adição para reiniciar o tempo e o anúncio. */
export type AvisoAtual = { texto: string; id: number; duracaoMs?: number };

export const ContextoDoAviso = createContext<AvisoAtual | null>(null);

/**
 * Põe um texto na região de aviso (`role="status"`) fora do painel, a mesma do "Adicionado à
 * sacola". Sem provider, não faz nada.
 */
export type Anunciar = (texto: string, opcoes?: { duracaoMs?: number }) => void;

export const ContextoDoAnunciador = createContext<Anunciar>(() => undefined);

export function useAnunciar(): Anunciar {
  return useContext(ContextoDoAnunciador);
}
