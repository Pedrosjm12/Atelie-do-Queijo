import type { SlugDoQueijo } from '@/data/cheeses';

/**
 * Dados do cartão do Canastra curado no chat (spec §8.2). Cópia estática e mínima, para o
 * painel de atendimento (que fica no pacote global) não arrastar `data/cheeses` nem
 * `lib/catalogo`. `cartaoDoChat.test.ts` garante que continua igual a
 * `dadosDoCartao(obterQueijo('canastra-curado'), 'chat')`. A ilustração (Apêndice A.7) tem
 * suas cores fixas em `MiniaturaDoChat`.
 */
export const CARTAO_DO_CHAT = {
  slug: 'canastra-curado',
  nome: 'Canastra curado',
  tag: 'BRASIL · CANASTRA, MG',
  linhaPequena: 'a partir de',
  preco: 4900,
} as const satisfies {
  slug: SlugDoQueijo;
  nome: string;
  tag: string;
  linhaPequena: string;
  preco: number;
};
