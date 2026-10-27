'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import type { SlugDoQueijo } from '@/data/cheeses';
import { ROTEIRO_DO_PROTOTIPO, type MensagemDoChat } from '@/lib/assistant';
import { dadosDoCartao, obterQueijo } from '@/lib/catalogo';
import { formatarPreco } from '@/lib/format';
import type { OpcoesDeFechamento } from './Atendimento';
import { Icone } from './icons';
import { MiniaturaDoChat } from './ilustracoes/MiniaturaDoChat';
import { useAbas } from './useAbas';
import estilos from './SupportPanel.module.css';

const ABAS = ['assistente', 'queijista'] as const;

type AoSolicitarFechamento = (opcoes?: OpcoesDeFechamento) => void;

type SupportPanelProps = {
  aberto: boolean;
  /** Fecha a partir de dentro (botão fechar, fundo, cartão de produto). */
  aoSolicitarFechamento: AoSolicitarFechamento;
  /** O <dialog> fechou de fato (inclusive pela tecla Esc). */
  aoFechado: () => void;
};

/**
 * Painel de atendimento (spec §8): <dialog> modal nativo (ADR-0005). O conteúdo só é montado
 * enquanto o painel está aberto, então a conversa recomeça a cada abertura e o DOM da página
 * não carrega a árvore do painel fechado. O código do painel, porém, está no pacote global
 * (o provider fica no layout): ver pendência de enxugamento na etapa 8 do PLANO.md.
 */
export function SupportPanel({ aberto, aoSolicitarFechamento, aoFechado }: SupportPanelProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idDoTitulo = useId();
  // Alvo do pointerdown: um arrasto que começa no campo e termina no fundo não fecha o painel.
  const inicioDoToque = useRef<EventTarget | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  return (
    // O <dialog> não tem padding: o alvo do clique só é o próprio elemento quando o clique cai
    // no ::backdrop (fora do painel). Esc e o botão fechar continuam sendo os meios por teclado.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      className={estilos.painel}
      aria-labelledby={idDoTitulo}
      onClose={aoFechado}
      onPointerDown={(evento) => {
        inicioDoToque.current = evento.target;
      }}
      onClick={(evento) => {
        const comecouNoFundo = inicioDoToque.current === evento.currentTarget;
        inicioDoToque.current = null;
        if (evento.target === evento.currentTarget && comecouNoFundo) aoSolicitarFechamento();
      }}
    >
      {aberto && (
        <ConteudoDoPainel idDoTitulo={idDoTitulo} aoSolicitarFechamento={aoSolicitarFechamento} />
      )}
    </dialog>
  );
}

/**
 * Símbolo do avatar (22 px): recorte do Apêndice A.1 (versão de 24 px, traço 1,8) só com o "A"
 * (triângulo e travessa) e a olhadura de cima. As duas olhaduras de baixo ficam de fora.
 */
function SimboloDoAvatar() {
  return (
    <svg width="22" height="22" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
      <path
        d="M17 3L31 30H3Z"
        fill="none"
        stroke="#C9A24B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.5 21H24.5" stroke="#C9A24B" strokeWidth="1.8" />
      <circle cx="17" cy="13.5" r="2" fill="#C9A24B" />
    </svg>
  );
}

/** Botão cuja ação chega na etapa 6: focável, visual igual, anuncia aria-disabled e o aviso. */
function SemAcao({
  className,
  idDoAviso,
  children,
  ...resto
}: {
  className?: string;
  idDoAviso: string;
  children: ReactNode;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-disabled="true"
      aria-describedby={idDoAviso}
      {...resto}
    >
      {children}
    </button>
  );
}

/** Sem ação até a etapa 6: o Enter no campo não pode recarregar a página. */
function impedirEnvio(evento: FormEvent<HTMLFormElement>) {
  evento.preventDefault();
}

function ConteudoDoPainel({
  idDoTitulo,
  aoSolicitarFechamento,
}: {
  idDoTitulo: string;
  aoSolicitarFechamento: AoSolicitarFechamento;
}) {
  const abas = useAbas(ABAS, 'assistente');
  const idDoAvisoDoChat = useId();
  const idDoAvisoDoWhatsapp = useId();
  const idDoCampo = useId();

  const classeDaAba = (id: (typeof ABAS)[number]) =>
    abas.ativa === id ? `${estilos.aba} ${estilos.abaAtiva}` : estilos.aba;

  return (
    <>
      <header className={estilos.cabecalho}>
        <div className={estilos.identidade}>
          <span className={estilos.avatar}>
            <SimboloDoAvatar />
          </span>
          <div className={estilos.titulos}>
            <h2 id={idDoTitulo} className={estilos.titulo}>
              Assistente do Ateliê
            </h2>
            <p className={estilos.status}>Responde na hora, 24 horas</p>
          </div>
          <button
            type="button"
            className={estilos.fechar}
            aria-label="Fechar atendimento"
            onClick={() => aoSolicitarFechamento()}
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <div className={estilos.abas} aria-label="Como prefere conversar?" {...abas.propsDaLista}>
          <button {...abas.propsDaAba('assistente')} className={classeDaAba('assistente')}>
            Assistente
          </button>
          <button {...abas.propsDaAba('queijista')} className={classeDaAba('queijista')}>
            <span className={estilos.iconeWhatsapp}>
              <Icone nome="conversa" tamanho={14} espessura={1.8} />
            </span>
            Queijista (WhatsApp)
          </button>
        </div>
      </header>

      {/* Os painéis já contêm elementos focáveis: sem tabIndex próprio. */}
      <div
        {...abas.propsDoPainel('assistente')}
        tabIndex={undefined}
        className={estilos.painelDoAssistente}
      >
        <div className={estilos.mensagens} role="log" aria-label="Conversa">
          {ROTEIRO_DO_PROTOTIPO.map((mensagem) => (
            <Mensagem
              key={mensagem.id}
              mensagem={mensagem}
              idDoAviso={idDoAvisoDoChat}
              aoIrParaOProduto={() => aoSolicitarFechamento({ devolverFoco: false })}
            />
          ))}
        </div>

        <div className={estilos.passagem}>
          <p className={estilos.passagemTexto}>
            Prefere falar com uma pessoa?
            <span className={estilos.horarioPequeno}>Seg a sex, 9h às 18h · sáb, 9h às 15h</span>
          </p>
          <SemAcao className={estilos.botaoWhatsapp} idDoAviso={idDoAvisoDoWhatsapp}>
            <Icone nome="conversa" tamanho={16} espessura={1.8} />
            Falar com um queijista
          </SemAcao>
        </div>

        <form className={estilos.formulario} onSubmit={impedirEnvio}>
          <label htmlFor={idDoCampo} className="sr-only">
            Escreva sua mensagem
          </label>
          <input
            id={idDoCampo}
            type="text"
            className={estilos.campo}
            placeholder="Escreva sua mensagem…"
            autoComplete="off"
          />
          <SemAcao className={estilos.enviar} idDoAviso={idDoAvisoDoChat} aria-label="Enviar">
            <Icone nome="enviar" tamanho={18} espessura={1.75} />
          </SemAcao>
        </form>
      </div>

      <div
        {...abas.propsDoPainel('queijista')}
        tabIndex={undefined}
        className={estilos.painelDoQueijista}
      >
        <p className={estilos.horario}>Seg a sex, 9h às 18h · sáb, 9h às 15h</p>
        <SemAcao className={estilos.botaoWhatsapp} idDoAviso={idDoAvisoDoWhatsapp}>
          <Icone nome="conversa" tamanho={16} espessura={1.8} />
          Falar com um queijista
        </SemAcao>
      </div>

      <span id={idDoAvisoDoChat} hidden>
        Atendimento disponível em breve
      </span>
      <span id={idDoAvisoDoWhatsapp} hidden>
        Atendimento por WhatsApp disponível em breve
      </span>
    </>
  );
}

function Mensagem({
  mensagem,
  idDoAviso,
  aoIrParaOProduto,
}: {
  mensagem: MensagemDoChat;
  idDoAviso: string;
  aoIrParaOProduto: () => void;
}) {
  switch (mensagem.tipo) {
    case 'assistente':
      return (
        <p className={estilos.doAssistente}>
          <span className="sr-only">Assistente: </span>
          {mensagem.texto}
        </p>
      );
    case 'cliente':
      return (
        <p className={estilos.doCliente}>
          <span className="sr-only">Você: </span>
          {mensagem.texto}
        </p>
      );
    case 'respostas-rapidas':
      return (
        <div className={estilos.respostas} role="group" aria-label="Respostas sugeridas">
          {mensagem.opcoes.map((opcao) => (
            <SemAcao
              key={opcao.id}
              idDoAviso={idDoAviso}
              className={
                opcao.sugerida ? `${estilos.resposta} ${estilos.sugerida}` : estilos.resposta
              }
            >
              {opcao.rotulo}
            </SemAcao>
          ))}
        </div>
      );
    case 'produto':
      return <CartaoDoChat slug={mensagem.slug} aoIrParaOProduto={aoIrParaOProduto} />;
  }
}

function CartaoDoChat({
  slug,
  aoIrParaOProduto,
}: {
  slug: SlugDoQueijo;
  aoIrParaOProduto: () => void;
}) {
  const queijo = obterQueijo(slug);
  if (!queijo) return null;
  const { tag, linhaPequena, preco } = dadosDoCartao(queijo, 'chat');

  return (
    <article className={estilos.cartao}>
      <MiniaturaDoChat />
      <div className={estilos.cartaoTexto}>
        <p className={estilos.cartaoTag}>{tag}</p>
        <h3 className={estilos.cartaoNome}>{queijo.nome}</h3>
        <p className={estilos.cartaoPreco}>
          {linhaPequena} {formatarPreco(preco)}
        </p>
      </div>
      <Link
        href={`/queijos/${queijo.slug}`}
        className={estilos.cartaoLink}
        aria-label={`Ver ${queijo.nome} em 3D`}
        onClick={aoIrParaOProduto}
      >
        <Icone nome="seta-direita" tamanho={18} espessura={1.75} />
      </Link>
    </article>
  );
}
