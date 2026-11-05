'use client';

import { usePathname } from 'next/navigation';
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  ContextoDoAtendimento,
  useAtendimento,
  type OpcoesDeFechamento,
  type ValorDoAtendimento,
} from './atendimento.contexto';
import { Button } from './Button';

export { useAtendimento };
export type { OpcoesDeFechamento };

type DestinoDoFoco = 'gatilho' | 'conteudo' | 'nenhum';

// O painel (conversa, fila de entradas e <SupportPanel/>) é um chunk tardio (ADR-0012): sai do
// pacote global e só monta na primeira abertura. O chunk é baixado em tempo ocioso, para o painel
// aparecer na hora; nada disso entra nos <script> do HTML.
const importarPainel = () => import('./PainelDoAtendimento');
const criarPainel = () => lazy(importarPainel);

/**
 * Borda de erro mínima: se o chunk do painel não carregar (sem rede, deploy novo), o lazy lança no
 * render. Sem ela o erro derrubaria o site; com ela, só o painel desiste (ADR-0012).
 */
class BordaDoPainel extends Component<
  { aoFalhar: () => void; children: ReactNode },
  { falhou: boolean }
> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch() {
    this.props.aoFalhar();
  }

  render() {
    return this.state.falhou ? null : this.props.children;
  }
}

/**
 * Estado do painel de atendimento (ADR-0005): envolve o conteúdo do <body>. Guarda se está aberto
 * e o gatilho que o abriu, para devolver o foco a ele ao fechar, inclusive onde o <dialog> nativo
 * não faria isso sozinho. A conversa e o painel vivem em `PainelDoAtendimento` (ADR-0012). O
 * número do WhatsApp chega pronto do servidor (`app/layout.tsx`); nenhum Client Component o resolve.
 */
export function AtendimentoProvider({
  children,
  numeroDoWhatsApp,
}: {
  children: ReactNode;
  numeroDoWhatsApp: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  // Vira `true` na primeira abertura e não volta: o painel segue montado, com a conversa.
  const [painelPedido, setPainelPedido] = useState(false);
  // Cada tentativa recria o lazy: um import que rejeitou fica rejeitado para sempre no mesmo lazy.
  const [tentativa, setTentativa] = useState(0);
  const [PainelDoAtendimento, setPainelDoAtendimento] = useState(criarPainel);
  const gatilho = useRef<HTMLElement | null>(null);
  const destinoDoFoco = useRef<DestinoDoFoco>('gatilho');

  // Baixa o painel quando o navegador estiver ocioso (depois do carregamento da página).
  useEffect(() => {
    const baixar = () => void importarPainel().catch(() => undefined);
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(baixar, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(baixar, 2000);
    return () => clearTimeout(id);
  }, []);

  const abrir = useCallback((origem?: HTMLElement) => {
    // O Safari não foca o botão ao clicar: por isso o gatilho vem do evento, com o foco como reserva.
    const ativo = document.activeElement;
    gatilho.current = origem ?? (ativo instanceof HTMLElement ? ativo : null);
    destinoDoFoco.current = 'gatilho';
    setAberto(true);
    setPainelPedido(true);
  }, []);

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

  // O chunk do painel não carregou: fecha, devolve o foco ao gatilho e deixa a próxima abertura
  // tentar de novo com um lazy novo.
  const aoFalharOPainel = useCallback(() => {
    const alvo = gatilho.current;
    gatilho.current = null;
    setAberto(false);
    setPainelPedido(false);
    setTentativa((t) => t + 1);
    setPainelDoAtendimento(criarPainel);
    if (alvo?.isConnected) alvo.focus();
  }, []);

  // Fecha ao mudar de rota (inclusive voltar/avançar). Só o caminho conta: searchParams não.
  const caminho = usePathname();
  const caminhoAnterior = useRef(caminho);
  useEffect(() => {
    if (caminhoAnterior.current === caminho) return;
    caminhoAnterior.current = caminho;
    // Sincroniza com o roteador (sistema externo): fechar() é a única saída do painel.
    if (aberto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fechar({ focarConteudo: true });
      // Com o chunk ainda baixando não há <dialog> para chamar aoFechado: não guarda o gatilho.
      gatilho.current = null;
    }
  }, [caminho, aberto, fechar]);

  const valor = useMemo<ValorDoAtendimento>(
    () => ({ aberto, abrir, fechar, numeroDoWhatsApp }),
    [aberto, abrir, fechar, numeroDoWhatsApp],
  );

  return (
    <ContextoDoAtendimento value={valor}>
      {children}
      {painelPedido && (
        // Abriu antes do chunk chegar: avisa por leitor de tela (sem mudar o visual). O foco segue
        // no gatilho até o diálogo montar e o showModal() levá-lo para dentro.
        <BordaDoPainel key={tentativa} aoFalhar={aoFalharOPainel}>
          <Suspense
            fallback={
              aberto ? (
                <p role="status" className="sr-only">
                  Abrindo o atendimento…
                </p>
              ) : null
            }
          >
            <PainelDoAtendimento
              aberto={aberto}
              aoSolicitarFechamento={fechar}
              aoFechado={aoFechado}
            />
          </Suspense>
        </BordaDoPainel>
      )}
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
