/**
 * Links do WhatsApp (spec §8.2, §8.3 e §10.5; ADR-0010). O horário do atendimento está em
 * `lib/horario.ts` (ADR-0012).
 *
 * Módulo puro: não importa `data/`, não lê variável de ambiente e não usa rede. O número chega por
 * parâmetro (resolvido no servidor, ADR-0010, decisão 4). Na URL entram só o número validado, o
 * texto fixo da spec, o nome do queijo vindo do catálogo e o número de pedido validado: texto livre
 * digitado pela pessoa nunca entra (ADR-0010, decisão 5).
 */

/** Formato de lib/pedido.server.ts: "AQ-" + 6 dígitos. */
export type NumeroDoPedido = `AQ-${string}`;

export type MotivoDoContato =
  | { tipo: 'geral' }
  /** `nomeDoQueijo` vem do catálogo, nunca do usuário. */
  | { tipo: 'produto'; nomeDoQueijo: string }
  | { tipo: 'pedido'; numero: NumeroDoPedido }
  | { tipo: 'corporativo' };

const FORMATO_DO_NUMERO_DO_PEDIDO = /^AQ-\d{6}$/;
const FORMATO_DO_NUMERO_DO_WHATSAPP = /^55\d{10,11}$/;

/**
 * "aq-123456", "AQ 123456", "AQ123456" → "AQ-123456"; qualquer outra coisa (5 ou 7 dígitos, letras,
 * texto em volta) → `null`. Mesmo formato gerado por `lib/pedido.server.ts`.
 */
export function lerNumeroDoPedido(texto: string): NumeroDoPedido | null {
  const achado = /^aq[-\s]?(\d{6})$/i.exec(texto.trim());
  return achado ? `AQ-${achado[1] ?? ''}` : null;
}

/** Textos literais da §8.3. */
export function mensagemDoWhatsApp(motivo: MotivoDoContato): string {
  switch (motivo.tipo) {
    case 'geral':
      return 'Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.';
    case 'produto':
      return `Olá! Tenho uma dúvida sobre o ${motivo.nomeDoQueijo}.`;
    case 'pedido':
      // O tipo é só uma marca: confere em tempo de execução, para nada estranho chegar à URL.
      if (!FORMATO_DO_NUMERO_DO_PEDIDO.test(motivo.numero)) {
        throw new RangeError('Número de pedido inválido');
      }
      return `Olá! Quero falar sobre o pedido nº ${motivo.numero}.`;
    case 'corporativo':
      return 'Olá! Quero um orçamento de presentes para empresa.';
  }
}

/**
 * `https://wa.me/<numero>?text=<mensagem codificada>`. Lança `RangeError` se o número não casar com
 * `^55\d{10,11}$` (a mensagem do erro não repete o valor recebido).
 */
export function linkDoWhatsApp(numero: string, motivo: MotivoDoContato): string {
  if (!FORMATO_DO_NUMERO_DO_WHATSAPP.test(numero)) {
    throw new RangeError('Número do WhatsApp inválido (esperado 55 + DDD + número, só dígitos)');
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemDoWhatsApp(motivo))}`;
}

/**
 * Aviso só para leitor de tela: o link do WhatsApp abre em nova aba (P49 = A). Texto novo, que a
 * spec não traz: lacuna do P52 até o dono escrever. Mora aqui (e não em `TEXTOS_DO_ROTEIRO`, que é
 * carregado sob demanda) porque o link existe no pacote global; `TEXTOS_DO_ROTEIRO.avisoNovaAba`
 * aponta para esta constante.
 */
export const AVISO_DE_NOVA_ABA =
  '[A DEFINIR: aviso só para leitor de tela: o link do WhatsApp abre em nova aba]';
