/** Valor em centavos, sempre inteiro: 13600 = R$ 136,00. */
export type Centavos = number;

/** Teto de qualquer valor monetário: R$ 1.000.000,00. Barra estouro e entrada absurda. */
export const TETO_EM_CENTAVOS: Centavos = 100_000_000;

/**
 * Lança `RangeError` se `valor` não for inteiro entre 0 e o teto. A mensagem nunca traz o valor
 * recebido (pode vir de fora).
 */
export function exigirCentavos(valor: number, nome: string): void {
  if (!Number.isSafeInteger(valor) || valor < 0 || valor > TETO_EM_CENTAVOS) {
    throw new RangeError(`${nome} inválido (esperado inteiro de 0 a ${TETO_EM_CENTAVOS} centavos)`);
  }
}
