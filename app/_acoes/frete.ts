'use server';

import { normalizarCep, type ResultadoDoFrete } from '@/lib/commerce';
import { calcularFrete } from '@/lib/pedido.server';

// Este arquivo exporta SÓ `consultarFrete`: todo export de um arquivo 'use server' vira um
// endpoint POST público (ADR-0008 §3). Nada de constantes, tipos ou auxiliares exportados aqui.

/** Maior CEP digitado válido: "01310-100". Conferido antes de qualquer regex. */
const TAMANHO_MAXIMO_DA_ENTRADA = 9;

/**
 * Consulta o frete de um CEP (SIMULADO, via `calcularFrete`). Endpoint público: `entrada` pode ser
 * qualquer coisa. Confere `typeof` e tamanho antes de normalizar. Nunca lança, não registra nada
 * em log e devolve só `{ ok, resultado | erro }`, sem repetir a entrada. Falha interna →
 * `indisponivel` (a interface mostra a mensagem genérica e permite tentar de novo).
 */
export async function consultarFrete(
  entrada: unknown,
): Promise<
  { ok: true; resultado: ResultadoDoFrete } | { ok: false; erro: 'cep-invalido' | 'indisponivel' }
> {
  try {
    if (typeof entrada !== 'string' || entrada.length > TAMANHO_MAXIMO_DA_ENTRADA) {
      return { ok: false, erro: 'cep-invalido' };
    }
    const cep = normalizarCep(entrada);
    if (cep === null) return { ok: false, erro: 'cep-invalido' };
    return { ok: true, resultado: await calcularFrete(cep) };
  } catch {
    return { ok: false, erro: 'indisponivel' };
  }
}
