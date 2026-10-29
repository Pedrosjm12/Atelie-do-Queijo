import { createContext } from 'react';

/** O aviso em exibição. `id` muda a cada nova adição para reiniciar o tempo e o anúncio. */
export type AvisoAtual = { texto: string; id: number };

export const ContextoDoAviso = createContext<AvisoAtual | null>(null);
