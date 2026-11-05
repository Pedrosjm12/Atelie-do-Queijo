import type { Centavos } from '@/lib/dinheiro';

export type IdDoKit = 'primeira-degustacao' | 'volta-ao-mundo' | 'grande-cave';

export interface Kit {
  /** Chave estável (React key, âncora, futura sacola). */
  id: IdDoKit;
  /** Spec §5.7, literal. */
  nome: string;
  /** Spec §5.7, literal. */
  descricao: string;
  /** `null` = lacuna "R$ [PREÇO]". Nunca 0. Nada com preço `null` vai para a sacola (etapa 4). */
  preco: Centavos | null;
}

/** Kits de presente, na ordem da spec §5.7. */
export const KITS: readonly Kit[] = [
  {
    id: 'primeira-degustacao',
    nome: 'Primeira Degustação',
    descricao: '3 queijos suaves, mel de flores e guia de degustação.',
    preco: null,
  },
  {
    id: 'volta-ao-mundo',
    nome: 'Volta ao Mundo',
    descricao: '5 queijos de 5 países, com mapa de origem.',
    preco: null,
  },
  {
    id: 'grande-cave',
    nome: 'Grande Cave',
    descricao: '7 queijos, tábua de madeira maciça e faca de queijo.',
    preco: null,
  },
];
