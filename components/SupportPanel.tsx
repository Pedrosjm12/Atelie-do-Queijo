'use client';

import Link from 'next/link';
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import type { SlugDoQueijo } from '@/data/cheeses';
import {
  TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE,
  type CartaoDoChat as DadosDoCartao,
  type MensagemDoChat,
} from '@/lib/assistant';
import { formatarPreco } from '@/lib/format';
import { atendimentoHumanoAberto, TEXTO_DA_CAVE_FECHADA, TEXTO_DO_HORARIO } from '@/lib/whatsapp';
import { useAtendimento, type OpcoesDeFechamento } from './atendimento.contexto';
import { Icone } from './icons';
import { MiniaturaDoChat } from './ilustracoes/MiniaturaDoChat';
import { LinkDoWhatsApp } from './LinkDoWhatsApp';
import { useAbas } from './useAbas';
import estilos from './SupportPanel.module.css';

const ABAS = ['assistente', 'queijista'] as const;

// O gerador A.6 só é necessário para os cartões que não são o do Canastra (A.7): fica fora do
// pacote global (orçamento da etapa 6) e é baixado na primeira vez que um deles aparece.
const importarIlustracao = () => import('./CheeseIllustration');

const IlustracaoDoQueijo = lazy(() =>
  importarIlustracao().then((m) => ({ default: m.CheeseIllustration })),
);

/** Começa a baixar o gerador A.6 ao abrir o painel (sem entrar no HTML inicial). Nunca rejeita. */
export function preaquecerIlustracao(): void {
  importarIlustracao().catch(() => undefined);
}

/**
 * Limite de erro mínimo: se o chunk da ilustração falhar (rede), o cartão mostra a reserva vazia
 * em vez de derrubar o painel inteiro. A conversa e o link do produto continuam funcionando.
 */
class LimiteDaIlustracao extends Component<
  { children: ReactNode; reserva: ReactNode },
  { falhou: boolean }
> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  render() {
    return this.state.falhou ? this.props.reserva : this.props.children;
  }
}

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
 * enquanto o painel está aberto, então o DOM da página não carrega a árvore do painel fechado
 * (a conversa, essa, vive no provider e sobrevive ao fechamento, P51). O código do painel está
 * no pacote global (o provider fica no layout); por isso o cartão do chat viaja dentro da
 * mensagem (`mensagem.cartao`), sem o catálogo inteiro.
 */
export function SupportPanel({ aberto, aoSolicitarFechamento, aoFechado }: SupportPanelProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idDoTitulo = useId();
  // Alvo do pointerdown: um arrasto que começa no campo e termina no fundo não fecha o painel.
  const inicioDoToque = useRef<EventTarget | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberto && !el.open) {
      el.showModal();
      rolarConversaAteOFim(el.querySelector<HTMLElement>('[role="log"]'));
    }
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
 * Leva a conversa à última mensagem. Só a área do log rola: cabeçalho, abas e campo continuam
 * visíveis. Suave apenas se a pessoa não pediu menos movimento.
 */
function rolarConversaAteOFim(conversa: HTMLElement | null) {
  if (!conversa) return;
  const reduzir =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  conversa.scrollTo({ top: conversa.scrollHeight, behavior: reduzir ? 'auto' : 'smooth' });
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

function ConteudoDoPainel({
  idDoTitulo,
  aoSolicitarFechamento,
}: {
  idDoTitulo: string;
  aoSolicitarFechamento: AoSolicitarFechamento;
}) {
  const { conversa, enviar, numeroDoWhatsApp } = useAtendimento();
  const abas = useAbas(ABAS, 'assistente');
  const idDoCampo = useId();
  const log = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState('');
  const textoEmEnvio = useRef(false);

  // O horário é calculado ao abrir (este componente só existe com o painel aberto, então não há
  // HTML do servidor para divergir) e ao trocar de aba; nunca enquanto a pessoa lê.
  const [horario, setHorario] = useState(() => ({
    aba: abas.ativa,
    humanoAberto: atendimentoHumanoAberto(),
  }));
  if (horario.aba !== abas.ativa) {
    setHorario({ aba: abas.ativa, humanoAberto: atendimentoHumanoAberto() });
  }

  // Cada resposta nova leva a conversa ao fim. A abertura é rolada por SupportPanel (o diálogo
  // ainda está fechado quando este efeito roda pela primeira vez).
  const primeiraRolagem = useRef(true);
  useEffect(() => {
    if (primeiraRolagem.current) {
      primeiraRolagem.current = false;
      return;
    }
    rolarConversaAteOFim(log.current);
  }, [conversa.mensagens]);

  const classeDaAba = (id: (typeof ABAS)[number]) =>
    abas.ativa === id ? `${estilos.aba} ${estilos.abaAtiva}` : estilos.aba;

  function escolherResposta(id: string) {
    // O foco vai para o campo (estável e previsível): o grupo clicado sai da conversa.
    campo.current?.focus();
    void enviar({ tipo: 'resposta-rapida', id });
  }

  async function enviarTexto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const digitado = texto.trim();
    if (digitado === '' || textoEmEnvio.current) return;
    textoEmEnvio.current = true;
    campo.current?.focus();
    const entregue = await enviar({ tipo: 'texto', texto: digitado });
    textoEmEnvio.current = false;
    // Só limpa no sucesso, e só se a pessoa não mexeu no campo enquanto esperava: o que ela
    // digitou nunca se perde (falha ao baixar o motor deixa o texto para tentar de novo).
    if (entregue) setTexto((atual) => (atual === texto ? '' : atual));
  }

  const botaoDoWhatsapp = (
    <LinkDoWhatsApp motivo={conversa.estado.contato} className={estilos.botaoWhatsapp}>
      <Icone nome="conversa" tamanho={16} espessura={1.8} />
      Falar com um queijista
    </LinkDoWhatsApp>
  );

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
        {/* Região rolável: precisa de foco para rolar por teclado (WCAG 2.1.1) quando sem botões. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div ref={log} className={estilos.mensagens} role="log" aria-label="Conversa" tabIndex={0}>
          {conversa.mensagens.map((mensagem) => (
            <Mensagem
              key={mensagem.id}
              mensagem={mensagem}
              aoEscolher={escolherResposta}
              aoIrParaOProduto={() => aoSolicitarFechamento({ devolverFoco: false })}
            />
          ))}
        </div>

        {/* Sem número do WhatsApp não há para onde passar a conversa: a faixa inteira sai. */}
        {numeroDoWhatsApp !== null && (
          <div className={estilos.passagem}>
            <p className={estilos.passagemTexto}>
              Prefere falar com uma pessoa?
              <span className={estilos.horarioPequeno}>{TEXTO_DO_HORARIO}</span>
            </p>
            {botaoDoWhatsapp}
          </div>
        )}

        <form className={estilos.formulario} onSubmit={(evento) => void enviarTexto(evento)}>
          <label htmlFor={idDoCampo} className="sr-only">
            Escreva sua mensagem
          </label>
          <input
            ref={campo}
            id={idDoCampo}
            type="text"
            className={estilos.campo}
            placeholder="Escreva sua mensagem…"
            autoComplete="off"
            maxLength={TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
          <button type="submit" className={estilos.enviar} aria-label="Enviar">
            <Icone nome="enviar" tamanho={18} espessura={1.75} />
          </button>
        </form>
      </div>

      <div
        {...abas.propsDoPainel('queijista')}
        tabIndex={undefined}
        className={estilos.painelDoQueijista}
      >
        <p className={estilos.horario}>
          {horario.humanoAberto ? TEXTO_DO_HORARIO : TEXTO_DA_CAVE_FECHADA}
        </p>
        {botaoDoWhatsapp}
      </div>
    </>
  );
}

function Mensagem({
  mensagem,
  aoEscolher,
  aoIrParaOProduto,
}: {
  mensagem: MensagemDoChat;
  aoEscolher: (id: string) => void;
  aoIrParaOProduto: () => void;
}) {
  // Todo texto entra como filho do React (escapado): nada de innerHTML, nem para o texto digitado.
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
            <button
              key={opcao.id}
              type="button"
              className={
                opcao.sugerida ? `${estilos.resposta} ${estilos.sugerida}` : estilos.resposta
              }
              onClick={() => aoEscolher(opcao.id)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      );
    case 'produto':
      return (
        <CartaoDoChat
          slug={mensagem.slug}
          cartao={mensagem.cartao}
          aoIrParaOProduto={aoIrParaOProduto}
        />
      );
  }
}

function CartaoDoChat({
  slug,
  cartao,
  aoIrParaOProduto,
}: {
  slug: SlugDoQueijo;
  cartao: DadosDoCartao;
  aoIrParaOProduto: () => void;
}) {
  const { nome, tag, linhaPequena, preco, ilustracao } = cartao;

  return (
    <article className={estilos.cartao}>
      {/* A.7 só para o Canastra curado; os demais usam o gerador A.6 a 84 px (decisão da etapa 3). */}
      {slug === 'canastra-curado' ? (
        <MiniaturaDoChat />
      ) : (
        <span className={estilos.miniatura}>
          <LimiteDaIlustracao reserva={<span className={estilos.miniaturaVazia} />}>
            <Suspense fallback={<span className={estilos.miniaturaVazia} />}>
              <IlustracaoDoQueijo {...ilustracao} label={nome} decorativa />
            </Suspense>
          </LimiteDaIlustracao>
        </span>
      )}
      <div className={estilos.cartaoTexto}>
        <p className={estilos.cartaoTag}>{tag}</p>
        <h3 className={estilos.cartaoNome}>{nome}</h3>
        <p className={estilos.cartaoPreco}>
          {linhaPequena} {formatarPreco(preco)}
        </p>
      </div>
      <Link
        href={`/queijos/${slug}`}
        className={estilos.cartaoLink}
        aria-label={`Ver ${nome} em 3D`}
        onClick={aoIrParaOProduto}
      >
        <Icone nome="seta-direita" tamanho={18} espessura={1.75} />
      </Link>
    </article>
  );
}
