import type { Centavos } from './dinheiro';

/** Desconto de 5% no Pix (spec §1). */
export const DESCONTO_PIX_PERCENTUAL = 5;

/**
 * Preço × 0,95 em centavos, arredondado ao centavo (meio para cima).
 * Usa só aritmética inteira (centavos × 95 ÷ 100), sem ponto flutuante.
 * Etapa 4 acrescenta `calcularFrete` e `criarPedido` aqui.
 */
export function precoNoPix(centavos: Centavos): Centavos {
  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new RangeError(`Preço inválido (esperado inteiro não negativo em centavos): ${centavos}`);
  }
  const numerador = centavos * (100 - DESCONTO_PIX_PERCENTUAL);
  return Math.floor((numerador + 50) / 100);
}
