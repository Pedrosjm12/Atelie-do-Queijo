import { createContext, useContext } from 'react';
import type { EntradaDoCliente, EstadoDaConversa, MensagemDoChat } from '@/lib/assistant';

/**
 * Contexto do painel de atendimento, separado do provider para `LinkDoWhatsApp` e `SupportPanel`
 * o lerem sem importar `Atendimento.tsx` (que importa o painel): evita ciclo de módulos.
 */

export type OpcoesDeFechamento = {
  /** `false` quando a ação já leva o foco a outro lugar (ex.: navegar para o produto). */
  devolverFoco?: boolean;
  /**
   * Fechamento por mudança de rota: o foco vai para #conteudo depois do close() nativo, que
   * senão o devolveria ao gatilho por cima do que o FocoNoConteudo fez com o diálogo ainda aberto.
   */
  focarConteudo?: boolean;
};

/** A conversa vive só na memória do provider (P51): fechar a aba do navegador apaga tudo. */
export type ConversaDoChat = {
  mensagens: readonly MensagemDoChat[];
  estado: EstadoDaConversa;
};

export type ValorDoAtendimento = {
  aberto: boolean;
  /** `origem` é o gatilho que recebe o foco ao fechar; sem ela vale o elemento ativo. */
  abrir: (origem?: HTMLElement) => void;
  fechar: (opcoes?: OpcoesDeFechamento) => void;
  /** Resolvido no servidor (ADR-0010, decisão 4). `null`: os links do WhatsApp não existem. */
  numeroDoWhatsApp: string | null;
  conversa: ConversaDoChat;
  /**
   * Entrega a entrada ao assistente e acrescenta a resposta à conversa. Nunca rejeita: devolve
   * `false` quando não conseguiu (ex.: o motor não carregou), para quem digitou manter o texto.
   */
  enviar: (entrada: EntradaDoCliente) => Promise<boolean>;
};

export const ContextoDoAtendimento = createContext<ValorDoAtendimento | null>(null);

export function useAtendimento(): ValorDoAtendimento {
  const valor = useContext(ContextoDoAtendimento);
  if (valor === null) {
    throw new Error('useAtendimento precisa estar dentro de <AtendimentoProvider>.');
  }
  return valor;
}
