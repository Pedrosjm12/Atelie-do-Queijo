'use server';

import * as z from 'zod/mini';
import { calcularTotais, valorDoFrete } from '@/lib/commerce';
import type { PedidoPrecificado, ResultadoDoPedido } from '@/lib/commerce';
import { resumoParaSacola } from '@/lib/catalogo';
import { ehFormatoValido } from '@/lib/formatosDaSacola';
import { errosDoCheckout, esquemaEntradaDoPedido, validarEntrega } from '@/lib/pedido';
import type { CampoDoCheckout } from '@/lib/pedido';
import { calcularFrete, criarPedido } from '@/lib/pedido.server';
import { MAXIMO_DE_LINHAS, QUANTIDADE_MAXIMA_POR_ITEM, precificarSacola } from '@/lib/sacola';
import type { ItemDaSacola } from '@/lib/sacola';

// Este arquivo exporta SÓ `confirmarPedido`: todo export de um arquivo 'use server' vira um
// endpoint POST público (ADR-0008 §3). Nada de constantes, tipos ou auxiliares exportados aqui.
// Quem precisa do tipo do retorno usa `Awaited<ReturnType<typeof confirmarPedido>>`.

type Erros = Partial<Record<CampoDoCheckout, string>>;

type RespostaDoPedido =
  | Extract<ResultadoDoPedido, { ok: true }>
  | { ok: false; motivo: 'dados-invalidos'; erros: Erros }
  | { ok: false; motivo: 'pagamento-recusado' | 'fora-de-area' | 'sacola-invalida' }
  // Falha interna (ex.: exceção inesperada): a interface mostra a mensagem genérica e permite tentar de novo.
  | { ok: false; motivo: 'indisponivel' };

const SACOLA_INVALIDA = { ok: false, motivo: 'sacola-invalida' } as const;

/** Objeto simples (literal ou sem protótipo): recusa `null`, array, `Map`, instância de classe. */
function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null) return false;
  const proto: unknown = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
}

/**
 * Confirma o pedido (SIMULADO). Endpoint público: `entrada` pode ser qualquer coisa. Recalcula TUDO
 * no servidor a partir do catálogo (preço, subtotal, frete, desconto do Pix, total); preço ou total
 * vindos do cliente são ignorados. Nunca lança, não registra nada em log e não repete a entrada na
 * resposta (só o e-mail, que a confirmação exibe). Item inválido, inexistente, fora do índice ou
 * esgotado → `sacola-invalida`, sem consertar em silêncio.
 */
export async function confirmarPedido(entrada: unknown): Promise<RespostaDoPedido> {
  try {
    // Pré-checagem ANTES do Zod: ele valida os elementos antes de conferir `maxLength` do array.
    if (!ehObjetoSimples(entrada)) {
      const geral = validarEntrega(undefined);
      return { ok: false, motivo: 'dados-invalidos', erros: geral.ok ? {} : geral.erros };
    }
    // Desestruturar lê cada propriedade UMA vez: um getter não pode devolver outra coisa depois.
    const { itens: brutos, entrega: entregaBruta, ...resto } = entrada;
    if (!Array.isArray(brutos) || brutos.length < 1 || brutos.length > MAXIMO_DE_LINHAS) {
      return SACOLA_INVALIDA;
    }

    // Sem a marca de presente, mensagem e data são descartadas ANTES do Zod e, portanto, nunca
    // recusam o pedido.
    const entregaParaValidar =
      resto.presente === false && ehObjetoSimples(entregaBruta)
        ? { ...entregaBruta, presente: null }
        : entregaBruta;
    const analise = z.safeParse(esquemaEntradaDoPedido, {
      ...resto,
      itens: brutos,
      entrega: entregaParaValidar,
    });
    if (!analise.success) {
      const problemas = analise.error.issues;
      const daSacola = (p: { path: readonly PropertyKey[] }) =>
        p.path[0] === 'itens' || p.path[0] === 'presente';
      const erros = errosDoCheckout(problemas.filter((p) => !daSacola(p)));
      if (Object.keys(erros).length > 0) return { ok: false, motivo: 'dados-invalidos', erros };
      return SACOLA_INVALIDA;
    }
    const { itens, entrega, pagamento } = analise.data;

    // Presente: sem a marca, a mensagem e a data são descartadas; com a marca, os dados são exigidos.
    const presente = analise.data.presente ? entrega.presente : null;
    if (analise.data.presente && presente === null) {
      return {
        ok: false,
        motivo: 'dados-invalidos',
        erros: errosDoCheckout([{ path: ['presente', 'dataDeEntrega'] }]),
      };
    }

    // Soma linhas repetidas; recusa se alguma passar do limite. Map: chave nunca vira propriedade.
    const somadas = new Map<string, ItemDaSacola>();
    for (const { slug, formatoId, quantidade } of itens) {
      if (!ehFormatoValido(slug, formatoId)) return SACOLA_INVALIDA; // fora do índice ou esgotado
      const chave = JSON.stringify([slug, formatoId]);
      const soma = (somadas.get(chave)?.quantidade ?? 0) + quantidade;
      if (soma > QUANTIDADE_MAXIMA_POR_ITEM) return SACOLA_INVALIDA;
      somadas.set(chave, { slug, formatoId, quantidade: soma });
    }

    // Preço sempre do catálogo; qualquer item não encontrado ou esgotado recusa o pedido todo.
    const { linhas, subtotal, ignorados } = precificarSacola(
      { itens: [...somadas.values()], presente: presente !== null },
      resumoParaSacola(),
    );
    if (ignorados > 0 || linhas.length !== somadas.size) return SACOLA_INVALIDA;

    const resultadoDoFrete = await calcularFrete(entrega.endereco.cep);
    if (resultadoDoFrete.situacao === 'fora-de-area') return { ok: false, motivo: 'fora-de-area' };
    const frete = valorDoFrete(resultadoDoFrete, subtotal);
    const totais = calcularTotais(subtotal, frete, pagamento);

    const { nome, email, telefone } = entrega.cliente;
    const pedido: PedidoPrecificado = {
      cliente: { nome, email, telefone },
      endereco: entrega.endereco,
      presente,
      pagamento,
      linhas,
      totais,
    };
    const criado = await criarPedido(pedido);
    if (!criado.ok) return { ok: false, motivo: criado.motivo };
    return { ok: true, numero: criado.numero, email: criado.email, totais: criado.totais };
  } catch {
    return { ok: false, motivo: 'indisponivel' };
  }
}
