import type { Centavos } from './dinheiro';

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Recebe o preço em centavos (inteiro) e devolve, por ex., "R$ 136,00".
 * O espaço depois de "R$" é não separável (U+00A0) para o preço nunca quebrar em duas linhas.
 */
export function formatarPreco(centavos: Centavos): string {
  if (!Number.isSafeInteger(centavos)) {
    throw new RangeError(`Preço inválido (esperado inteiro em centavos): ${centavos}`);
  }
  return formatador.format(centavos / 100).replace(/ /g, ' ');
}

/**
 * Como `formatarPreco`, mas `null` (preço desconhecido) vira a lacuna visível "R$ [PREÇO]",
 * com o mesmo espaço não separável (U+00A0) depois de "R$".
 */
export function formatarPrecoOuLacuna(centavos: Centavos | null): string {
  if (centavos === null) return 'R$\u00A0[PREÇO]';
  return formatarPreco(centavos);
}
