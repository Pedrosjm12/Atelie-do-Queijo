'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  carregarAssistente,
  ESTADO_INICIAL,
  MENSAGENS_INICIAIS,
  type Assistente,
  type EntradaDoCliente,
  type MensagemDoChat,
} from '@/lib/assistant';
import {
  ContextoDaConversa,
  type ConversaDoChat,
  type OpcoesDeFechamento,
} from './atendimento.contexto';
import { TEXTO_ADICIONADO, useAcoesDaSacola } from './SacolaProvider';
import { preaquecerIlustracao, SupportPanel } from './SupportPanel';

const CONVERSA_INICIAL: ConversaDoChat = {
  mensagens: MENSAGENS_INICIAIS,
  estado: ESTADO_INICIAL,
};

type PainelDoAtendimentoProps = {
  aberto: boolean;
  aoSolicitarFechamento: (opcoes?: OpcoesDeFechamento) => void;
  aoFechado: () => void;
};

/**
 * Parte do atendimento que só existe depois da primeira abertura (ADR-0012): a conversa, a fila
 * de entradas, a entrega ao assistente (ADR-0010) e o <SupportPanel/>. O `AtendimentoProvider`,
 * que fica no layout, importa este módulo por `import()` e o mantém montado depois de aberto,
 * então a conversa (só em memória, P51) sobrevive ao fechamento do painel.
 */
export default function PainelDoAtendimento({
  aberto,
  aoSolicitarFechamento,
  aoFechado,
}: PainelDoAtendimentoProps) {
  const { adicionar } = useAcoesDaSacola();
  const [conversa, setConversa] = useState<ConversaDoChat>(CONVERSA_INICIAL);
  // Espelho síncrono da conversa: entradas em sequência rápida leem o estado mais recente.
  const conversaAtual = useRef<ConversaDoChat>(CONVERSA_INICIAL);
  const assistente = useRef<Promise<Assistente> | null>(null);
  // Uma entrada por vez: a resposta de uma é aplicada antes de a seguinte ser calculada.
  const fila = useRef<Promise<void>>(Promise.resolve());

  /** Importa o motor uma só vez (chunk tardio). Se a importação falhar, a próxima tentativa refaz. */
  const obterAssistente = useCallback((): Promise<Assistente> => {
    const existente = assistente.current;
    if (existente) return existente;
    const nova = carregarAssistente();
    assistente.current = nova;
    nova.catch(() => {
      if (assistente.current === nova) assistente.current = null;
    });
    return nova;
  }, []);

  // Começa a baixar o motor e o gerador de ilustrações assim que o painel monta já aberto (a
  // primeira abertura); um clique que chegue antes do fim espera a mesma promessa.
  useEffect(() => {
    obterAssistente().catch(() => undefined);
    preaquecerIlustracao();
  }, [obterAssistente]);

  const enviar = useCallback(
    (entrada: EntradaDoCliente): Promise<boolean> => {
      let entregue = false;
      const tarefa = fila.current
        .then(async () => {
          const motor = await obterAssistente();
          const resposta = await motor.responder(conversaAtual.current.estado, entrada);
          // Entrada ignorada (resposta rápida antiga, texto vazio): nada muda, nada a reenviar.
          if (resposta.mensagens.length === 0) {
            entregue = true;
            return;
          }
          // Só o último grupo de respostas rápidas aceita clique: os antigos saem da conversa.
          let mensagens: readonly MensagemDoChat[] = [
            ...conversaAtual.current.mensagens.filter((m) => m.tipo !== 'respostas-rapidas'),
            ...resposta.mensagens,
          ];
          // Ações só nascem de uma resposta rápida escolhida pela pessoa (ADR-0010, decisão 2).
          for (const acao of resposta.acoes) {
            if (acao.tipo !== 'adicionar-a-sacola') continue;
            const adicionado = adicionar({
              slug: acao.slug,
              formatoId: acao.formatoId,
              quantidade: acao.quantidade,
              presente: acao.presente,
            });
            // O aviso visual fica fora do <dialog> (inerte): quem usa leitor de tela o recebe aqui.
            if (adicionado) {
              mensagens = [
                ...mensagens,
                {
                  id: `adicionado-${resposta.estado.proximoId}-${mensagens.length}`,
                  tipo: 'assistente',
                  texto: TEXTO_ADICIONADO,
                },
              ];
            }
          }
          const proxima: ConversaDoChat = { mensagens, estado: resposta.estado };
          conversaAtual.current = proxima;
          setConversa(proxima);
          entregue = true;
        })
        // Falha ao baixar o motor: a conversa fica como estava e a próxima entrada tenta de novo.
        .catch((erro: unknown) => {
          if (process.env.NODE_ENV !== 'production') console.error(erro);
        })
        .then(() => entregue);
      // A fila segue por `Promise<void>`: uma falha nunca trava as entradas seguintes.
      fila.current = tarefa.then(() => undefined);
      return tarefa;
    },
    [adicionar, obterAssistente],
  );

  const valor = useMemo(() => ({ conversa, enviar }), [conversa, enviar]);

  return (
    <ContextoDaConversa value={valor}>
      <SupportPanel
        aberto={aberto}
        aoSolicitarFechamento={aoSolicitarFechamento}
        aoFechado={aoFechado}
      />
    </ContextoDaConversa>
  );
}
