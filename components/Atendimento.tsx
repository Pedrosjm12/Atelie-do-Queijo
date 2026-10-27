'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button } from './Button';
import { SupportPanel } from './SupportPanel';

export type OpcoesDeFechamento = {
  /** `false` quando a ação já leva o foco a outro lugar (ex.: navegar para o produto). */
  devolverFoco?: boolean;
};

type ValorDoAtendimento = {
  aberto: boolean;
  /** `origem` é o gatilho que recebe o foco ao fechar; sem ela vale o elemento ativo. */
  abrir: (origem?: HTMLElement) => void;
  fechar: (opcoes?: OpcoesDeFechamento) => void;
};

const ContextoDoAtendimento = createContext<ValorDoAtendimento | null>(null);

/**
 * Estado do painel de atendimento (ADR-0005): envolve o conteúdo do <body> e renderiza o
 * <SupportPanel/> uma única vez. Guarda o gatilho que abriu o painel para devolver o foco a
 * ele ao fechar, inclusive onde o <dialog> nativo não faria isso sozinho.
 */
export function AtendimentoProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const gatilho = useRef<HTMLElement | null>(null);
  const devolverFoco = useRef(true);

  const abrir = useCallback((origem?: HTMLElement) => {
    // O Safari não foca o botão ao clicar: por isso o gatilho vem do evento, com o foco como reserva.
    const ativo = document.activeElement;
    gatilho.current = origem ?? (ativo instanceof HTMLElement ? ativo : null);
    devolverFoco.current = true;
    setAberto(true);
  }, []);

  const fechar = useCallback((opcoes?: OpcoesDeFechamento) => {
    devolverFoco.current = opcoes?.devolverFoco !== false;
    setAberto(false);
  }, []);

  // Chamado quando o <dialog> terminou de fechar (botão, Esc ou fechar()).
  const aoFechado = useCallback(() => {
    setAberto(false);
    const alvo = gatilho.current;
    gatilho.current = null;
    if (devolverFoco.current && alvo?.isConnected) alvo.focus();
  }, []);

  const valor = useMemo(() => ({ aberto, abrir, fechar }), [aberto, abrir, fechar]);

  return (
    <ContextoDoAtendimento value={valor}>
      {children}
      <SupportPanel aberto={aberto} aoSolicitarFechamento={fechar} aoFechado={aoFechado} />
    </ContextoDoAtendimento>
  );
}

export function useAtendimento(): ValorDoAtendimento {
  const valor = useContext(ContextoDoAtendimento);
  if (valor === null) {
    throw new Error('useAtendimento precisa estar dentro de <AtendimentoProvider>.');
  }
  return valor;
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
