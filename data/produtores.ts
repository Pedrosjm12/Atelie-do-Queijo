import type { SlugDoQueijo } from './cheeses';
import { ANO_PRODUTOR_CANASTRA_FICTICIO, PRODUTOR_CANASTRA_FICTICIO } from './ficticio';

export interface Produtor {
  id: string;
  /** Igual ao `detalhe.produtor` dos queijos dele (conferido em teste). */
  nome: string;
  /** Texto visível, ex.: "Serra da Canastra, MG". */
  regiao: string;
  /** Texto do ano, sem o "desde": o componente monta "desde {ano}". Lacuna: "[ano]". */
  desde: string;
  /** Descrição do `[FOTO: …]`. */
  foto: string;
  queijos: readonly [SlugDoQueijo, ...SlugDoQueijo[]];
}

/**
 * Produtores conhecidos. Nome e ano do Canastra vêm de `data/ficticio.ts` (D29): a troca dos dados
 * fictícios continua num lugar só.
 */
export const PRODUTORES: readonly Produtor[] = [
  {
    id: 'canastra',
    nome: `Queijaria ${PRODUTOR_CANASTRA_FICTICIO}`,
    regiao: 'Serra da Canastra, MG',
    desde: ANO_PRODUTOR_CANASTRA_FICTICIO,
    foto: 'produtor na câmara de maturação, Serra da Canastra',
    queijos: ['canastra-curado'],
  },
];
