import { exigirCentavos } from './dinheiro';
import type { Centavos } from './dinheiro';
import type { Entrega } from './pedido';
import type { LinhaPrecificada } from './sacola';

// Só tipos vêm de `pedido` e `sacola` (sem ciclo em tempo de execução): este módulo é importável
// no cliente (`precoNoPix`, `mascararCep`, `faltaParaFreteGratis`, `valorDoFrete`,
// `calcularTotais`), então não pode puxar o Zod. As implementações SIMULADAS que um dia falarão
// com a rede (`calcularFrete`, `criarPedido`) ficam em `pedido.server.ts`.

/** Desconto de 5% no Pix (spec §1). */
export const DESCONTO_PIX_PERCENTUAL = 5;

/**
 * Preço × 0,95 em centavos, arredondado ao centavo (meio para cima).
 * Usa só aritmética inteira (centavos × 95 ÷ 100), sem ponto flutuante. Aceita de 0 ao teto de
 * R$ 1.000.000; fora disso lança `RangeError` (sem repetir o valor na mensagem).
 */
export function precoNoPix(centavos: Centavos): Centavos {
  exigirCentavos(centavos, 'Preço');
  const numerador = centavos * (100 - DESCONTO_PIX_PERCENTUAL);
  return Math.floor((numerador + 50) / 100);
}

// --- Frete grátis -----------------------------------------------------------------------------

/** Frete grátis a partir de R$ 180,00 (≥, P29), sobre o subtotal ANTES do desconto do Pix (§1, §10.1). */
export const FRETE_GRATIS_A_PARTIR_DE: Centavos = 18000;

/** `max(0, 18000 − subtotal)`. 0 → "Frete grátis garantido." */
export function faltaParaFreteGratis(subtotal: Centavos): Centavos {
  exigirCentavos(subtotal, 'Subtotal');
  return Math.max(0, FRETE_GRATIS_A_PARTIR_DE - subtotal);
}

// --- CEP --------------------------------------------------------------------------------------

/** CEP só com os 8 dígitos. Marca nominal: só nasce de `normalizarCep`. */
export type Cep = string & { readonly __marca: 'Cep' };

/** Tamanho máximo de um CEP digitado: "01310-100". */
const TAMANHO_MAXIMO_DO_CEP_DIGITADO = 9;

/**
 * Mais de 9 caracteres (ou não texto) → `null` antes de qualquer outra operação. Depois do `trim`,
 * só aceita `NNNNN-NNN` ou `NNNNNNNN` (dígitos ASCII); qualquer outra coisa → `null`.
 */
export function normalizarCep(entrada: string): Cep | null {
  if (typeof entrada !== 'string' || entrada.length > TAMANHO_MAXIMO_DO_CEP_DIGITADO) return null;
  const limpo = entrada.trim();
  if (!/^\d{5}-?\d{3}$/.test(limpo)) return null;
  return limpo.replace('-', '') as Cep;
}

/**
 * Máscara progressiva para o campo: "0131" → "0131", "01310100" → "01310-100". No máximo 9
 * caracteres; dígitos além do oitavo são descartados. Só olha os 32 primeiros caracteres (colar
 * um texto enorme não custa nada).
 */
export function mascararCep(entrada: string): string {
  if (typeof entrada !== 'string') return '';
  const digitos = entrada.slice(0, 32).replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// --- Frete (SIMULADO) -------------------------------------------------------------------------

export type ResultadoDoFrete =
  | { situacao: 'atendido'; prazoDiasUteis: number | null; valor: Centavos | null } // null = lacuna [N] / [PREÇO] (P27)
  | { situacao: 'fora-de-area' };

/** Aplica o frete grátis: subtotal ≥ R$ 180 → 0; senão o valor do resultado (pode ser `null`). */
export function valorDoFrete(
  resultado: Extract<ResultadoDoFrete, { situacao: 'atendido' }>,
  subtotal: Centavos,
): Centavos | null {
  exigirCentavos(subtotal, 'Subtotal');
  return subtotal >= FRETE_GRATIS_A_PARTIR_DE ? 0 : resultado.valor;
}

// --- Totais -----------------------------------------------------------------------------------

export type FormaDePagamento = 'pix' | 'cartao';

export interface TotaisDoPedido {
  subtotal: Centavos;
  /** `null` → "R$ [PREÇO]". */
  frete: Centavos | null;
  /** `subtotal − precoNoPix(subtotal)` se Pix; 0 se cartão (P30). Só sobre os produtos. */
  descontoPix: Centavos;
  /** `null` se o frete for `null` (a interface mostra "R$ [PREÇO]", nunca R$ 0,00 nem NaN). */
  total: Centavos | null;
}

export function calcularTotais(
  subtotal: Centavos,
  frete: Centavos | null,
  pagamento: FormaDePagamento,
): TotaisDoPedido {
  exigirCentavos(subtotal, 'Subtotal');
  if (frete !== null) exigirCentavos(frete, 'Frete');
  const descontoPix = pagamento === 'pix' ? subtotal - precoNoPix(subtotal) : 0;
  const total = frete === null ? null : subtotal - descontoPix + frete;
  if (total !== null) exigirCentavos(total, 'Total');
  return { subtotal, frete, descontoPix, total };
}

// --- Pedido (tipos; a implementação SIMULADA está em `pedido.server.ts`) ----------------------

/** O que `criarPedido` recebe: já validado (`lib/pedido.ts`) e precificado no servidor. */
export interface PedidoPrecificado {
  cliente: Pick<Entrega['cliente'], 'nome' | 'email' | 'telefone'>;
  endereco: Entrega['endereco'];
  presente: Entrega['presente'];
  pagamento: FormaDePagamento;
  linhas: readonly LinhaPrecificada[];
  totais: TotaisDoPedido;
}

export type ResultadoDoPedido =
  | { ok: true; numero: string; email: string; totais: TotaisDoPedido }
  | { ok: false; motivo: 'pagamento-recusado' | 'fora-de-area' | 'sacola-invalida' };
