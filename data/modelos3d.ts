// Manifesto dos modelos 3D (spec §11 e ADR-0009). Sem importações de valor: o script
// `scripts/validar-modelos.mjs` lê este arquivo direto no Node (com remoção de tipos).
import type { SlugDoQueijo } from './cheeses';

export type VarianteDoModelo = 'inteiro' | 'cortado';

/** Presença confirmada pelo validador. `inteiro` é obrigatório; `cortado` é opcional. */
export interface ModelosDoQueijo {
  inteiro: true;
  cortado: boolean;
}

/** Vazio até o dono fornecer os GLB (D21). Uma entrada só é aceita se os arquivos existirem. */
export const MODELOS_3D: Partial<Record<SlugDoQueijo, ModelosDoQueijo>> = {};

/** §11: "até ~3 MB". Decisão P43: erro acima de 3 MiB (3.145.728 bytes). */
export const LIMITE_DE_BYTES_DO_GLB = 3 * 1024 * 1024;

/** Convenção da §11: `/models/<slug>-<variante>.glb`. Único lugar que monta o caminho. */
export function caminhoDoModelo(slug: SlugDoQueijo, variante: VarianteDoModelo): string {
  return `/models/${slug}-${variante}.glb`;
}

/** Tem GLB para esta variante? (`cortado` é false quando só existe o arquivo inteiro.) */
export function temModelo(slug: SlugDoQueijo, variante: VarianteDoModelo): boolean {
  const entrada = MODELOS_3D[slug];
  if (!entrada) return false;
  return variante === 'inteiro' ? true : entrada.cortado;
}
