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
