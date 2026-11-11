// Auxiliares de cursor para campos com máscara. Sem Zod e sem servidor.

/** Quantos dígitos há antes da posição `ate`. */
export function digitosAte(texto: string, ate: number): number {
  return texto.slice(0, ate).replace(/\D/g, '').length;
}

/** Posição logo depois do `n`-ésimo dígito do texto mascarado (a pontuação fica para trás do cursor). */
export function posicaoAposDigitos(mascarado: string, n: number): number {
  if (n <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < mascarado.length; i++) {
    const c = mascarado.charCodeAt(i);
    if (c >= 48 && c <= 57 && ++vistos === n) return i + 1;
  }
  return mascarado.length;
}

/**
 * Resultado de colar `colado` no lugar da seleção `[inicio, fim)` de `atual`: o texto já com a
 * máscara e a posição do cursor logo depois do último dígito colado. A máscara tira o que não é
 * dígito (ex.: colar "CEP 01310-100" resulta em "01310-100").
 */
export function colarComMascara(
  atual: string,
  inicio: number,
  fim: number,
  colado: string,
  mascara: (texto: string) => string,
): { texto: string; cursor: number } {
  const bruto = atual.slice(0, inicio) + colado + atual.slice(fim);
  const texto = mascara(bruto);
  return { texto, cursor: posicaoAposDigitos(texto, digitosAte(bruto, inicio + colado.length)) };
}
