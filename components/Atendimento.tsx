'use client';

import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  carregarAssistente,
  ESTADO_INICIAL,
  MENSAGENS_INICIAIS,
  type Assistente,
  type EntradaDoCliente,
  type MensagemDoChat,
} from '@/lib/assistant';
import {
  ContextoDoAtendimento,
  useAtendimento,
  type ConversaDoChat,
  type OpcoesDeFechamento,
  type ValorDoAtendimento,
} from './atendimento.contexto';
import { Button } from './Button';
import { TEXTO_ADICIONADO, useAcoesDaSacola } from './SacolaProvider';
import { preaquecerIlustracao, SupportPanel } from './SupportPanel';

export { useAtendimento };
export type { OpcoesDeFechamento };

type DestinoDoFoco = 'gatilho' | 'conteudo' | 'nenhum';

const CONVERSA_INICIAL: ConversaDoChat = {
  mensagens: MENSAGENS_INICIAIS,
  estado: ESTADO_INICIAL,
};

/**
 * Estado do painel de atendimento (ADR-0005): envolve o conteúdo do <body> e renderiza o
 * <SupportPanel/> uma única vez. Guarda o gatilho que abriu o painel para devolver o foco a
 * ele ao fechar, inclusive onde o <dialog> nativo não faria isso sozinho.
 *
 * Também guarda a conversa (só em memória, P51) e a entrega ao assistente (ADR-0010). O número do
 * WhatsApp chega pronto do servidor (`app/layout.tsx`); nenhum Client Component o resolve.
 */
export function AtendimentoProvider({
  children,
  numeroDoWhatsApp,
}: {
  children: ReactNode;
  numeroDoWhatsApp: string | null;
}) {
  const { adicionar } = useAcoesDaSacola();
  const [aberto, setAberto] = useState(false);
  const [conversa, setConversa] = useState<ConversaDoChat>(CONVERSA_INICIAL);
  // Espelho síncrono da conversa: entradas em sequência rápida leem o estado mais recente.
  const conversaAtual = useRef<ConversaDoChat>(CONVERSA_INICIAL);
  const assistente = useRef<Promise<Assistente> | null>(null);
  // Uma entrada por vez: a resposta de uma é aplicada antes de a seguinte ser calculada.
  const fila = useRef<Promise<void>>(Promise.resolve());
  const gatilho = useRef<HTMLElement | null>(null);
  const destinoDoFoco = useRef<DestinoDoFoco>('gatilho');

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

  const abrir = useCallback(
    (origem?: HTMLElement) => {
      // O Safari não foca o botão ao clicar: por isso o gatilho vem do evento, com o foco como reserva.
      const ativo = document.activeElement;
      gatilho.current = origem ?? (ativo instanceof HTMLElement ? ativo : null);
      destinoDoFoco.current = 'gatilho';
      setAberto(true);
      // Começa a baixar o motor e o gerador de ilustrações já ao abrir; um clique que chegue antes do fim espera a promessa.
      obterAssistente().catch(() => undefined);
      preaquecerIlustracao();
    },
    [obterAssistente],
  );

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

  const fechar = useCallback((opcoes?: OpcoesDeFechamento) => {
    destinoDoFoco.current = opcoes?.focarConteudo
      ? 'conteudo'
      : opcoes?.devolverFoco === false
        ? 'nenhum'
        : 'gatilho';
    setAberto(false);
  }, []);

  // Chamado quando o <dialog> terminou de fechar (botão, Esc ou fechar()).
  const aoFechado = useCallback(() => {
    setAberto(false);
    const alvo = gatilho.current;
    gatilho.current = null;
    const destino = destinoDoFoco.current;
    if (destino === 'gatilho' && alvo?.isConnected) alvo.focus();
    if (destino === 'conteudo') document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, []);

  // Fecha ao mudar de rota (inclusive voltar/avançar). Só o caminho conta: searchParams não.
  const caminho = usePathname();
  const caminhoAnterior = useRef(caminho);
  useEffect(() => {
    if (caminhoAnterior.current === caminho) return;
    caminhoAnterior.current = caminho;
    // Sincroniza com o roteador (sistema externo): fechar() é a única saída do painel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (aberto) fechar({ focarConteudo: true });
  }, [caminho, aberto, fechar]);

  const valor = useMemo<ValorDoAtendimento>(
    () => ({ aberto, abrir, fechar, numeroDoWhatsApp, conversa, enviar }),
    [aberto, abrir, fechar, numeroDoWhatsApp, conversa, enviar],
  );

  return (
    <ContextoDoAtendimento value={valor}>
      {children}
      <SupportPanel aberto={aberto} aoSolicitarFechamento={fechar} aoFechado={aoFechado} />
    </ContextoDoAtendimento>
  );
}

type BotaoAbrirAtendimentoProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Com variante usa o `Button` (spec 4.4); sem ela, é um <button> simples estilizado por `className`. */
  variante?: 'principal' | 'secundario' | 'contorno' | 'link';
  tamanho?: 'padrao' | 'compacto';
  seta?: boolean;
};

/** Botão que abre o painel de atendimento (spec §10.5). */
export function BotaoAbrirAtendimento({
  children,
  className,
  variante,
  ...resto
}: BotaoAbrirAtendimentoProps) {
  const { abrir } = useAtendimento();

  if (variante === undefined) {
    const { style } = resto;
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-haspopup="dialog"
        onClick={(evento) => abrir(evento.currentTarget)}
      >
        {children}
      </button>
    );
  }

  return (
    <Button
      {...resto}
      variante={variante}
      className={className}
      aria-haspopup="dialog"
      onClick={(evento) => abrir(evento.currentTarget)}
    >
      {children}
    </Button>
  );
}
