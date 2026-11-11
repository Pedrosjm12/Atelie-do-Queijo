import type { Shape, SlugDoQueijo } from '@/data/cheeses';
import type { Centavos } from './dinheiro';
import type { RespostasDoQuiz } from './quiz';
import type { MotivoDoContato } from './whatsapp';

/**
 * Ponto de integração do assistente (spec §8.2; ADR-0010). O painel só conhece estes tipos e
 * `carregarAssistente()`: trocar o roteiro determinístico pela IA futura não muda o painel.
 * Módulo leve (vai no pacote global): o motor e os dados dos 10 cartões ficam em `lib/roteiro.ts`
 * e `lib/cartoesDoChat.ts`, carregados sob demanda.
 */

export type RespostaRapida = {
  id: string;
  rotulo: string;
  /** A sugerida tem borda `--ouro` e peso 600 (spec §8.2). */
  sugerida?: boolean;
};

/**
 * Dados mínimos do cartão de produto no chat. Viajam dentro da mensagem: o painel não importa o
 * catálogo. A ilustração (A.6) é a do queijo; o Canastra curado usa a A.7 no painel.
 */
export type CartaoDoChat = {
  nome: string;
  tag: string;
  linhaPequena: string;
  preco: Centavos;
  ilustracao: { shape: Shape; side: string; top: string };
};

export type MensagemDoChat =
  /** `aposAcao`: só vale se a ação da mesma resposta tiver sucesso (o painel descarta se falhar). */
  | { id: string; tipo: 'assistente'; texto: string; aposAcao?: true }
  | { id: string; tipo: 'cliente'; texto: string }
  | { id: string; tipo: 'produto'; slug: SlugDoQueijo; cartao: CartaoDoChat }
  | { id: string; tipo: 'respostas-rapidas'; opcoes: readonly RespostaRapida[] };

/** Texto livre ou clique numa resposta rápida (a única origem de ações que alteram dados). */
export type EntradaDoCliente =
  { tipo: 'resposta-rapida'; id: string } | { tipo: 'texto'; texto: string };

/** Ações descritas pelo motor e executadas pelo painel (ADR-0010, decisão 2). */
export type AcaoDoAssistente = {
  tipo: 'adicionar-a-sacola';
  slug: SlugDoQueijo;
  formatoId: string;
  quantidade: 1;
  presente: boolean;
};

export type EtapaDoRoteiro =
  /** As respostas rápidas iniciais estão na tela. */
  | 'inicio'
  | 'quiz-sabor'
  | 'quiz-uso'
  | 'quiz-acompanhamento'
  | 'harmonizar'
  | 'pedido-numero'
  /** "Quer que eu inclua embalagem de presente…?" (Canastra curado, spec §8.2 item 6). */
  | 'presente'
  /** Pergunta do formato antes de pôr o presente na sacola (P46). */
  | 'presente-formato'
  /** Nenhuma resposta rápida pendente (ex.: depois de passar para humano). */
  | 'livre';

export interface EstadoDaConversa {
  etapa: EtapaDoRoteiro;
  respostasDoQuiz: Partial<RespostasDoQuiz>;
  /** Motivo usado pelos botões verdes enquanto a conversa estiver neste estado (P47). */
  contato: MotivoDoContato;
  /** Contador dos ids das mensagens: sem `Math.random` nem relógio, para testes estáveis. */
  proximoId: number;
}

export interface RespostaDoAssistente {
  /** Já inclui o eco do cliente. Vazio quando a entrada é ignorada. */
  mensagens: readonly MensagemDoChat[];
  acoes: readonly AcaoDoAssistente[];
  /** Presente quando o assistente passa para humano (§8.2). */
  transferirParaHumano?: MotivoDoContato;
  estado: EstadoDaConversa;
}

export interface Assistente {
  responder(estado: EstadoDaConversa, entrada: EntradaDoCliente): Promise<RespostaDoAssistente>;
}

/** Limite do texto digitado (o campo usa como `maxLength`; o motor corta o que passar). */
export const TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE = 500;

/** Spec §8.2, item 2, literais (P4: a conversa começa só com a saudação e estas respostas). */
export const RESPOSTAS_INICIAIS: readonly RespostaRapida[] = [
  { id: 'sugerir-queijo', rotulo: 'Sugira um queijo' },
  { id: 'montar-tabua', rotulo: 'Montar uma tábua' },
  { id: 'status-do-pedido', rotulo: 'Onde está meu pedido?' },
];

/** Spec §8.2, itens 1 e 2, literais. Estáticas: aparecem sem esperar o motor. */
export const MENSAGENS_INICIAIS: readonly MensagemDoChat[] = [
  {
    id: 'saudacao',
    tipo: 'assistente',
    texto:
      'Olá! Sou o assistente do Ateliê do Queijo. Posso sugerir um queijo, montar uma tábua, indicar uma harmonização ou ver o status do seu pedido. Por onde começamos?',
  },
  { id: 'respostas-iniciais', tipo: 'respostas-rapidas', opcoes: RESPOSTAS_INICIAIS },
];

export const ESTADO_INICIAL: EstadoDaConversa = {
  etapa: 'inicio',
  respostasDoQuiz: {},
  contato: { tipo: 'geral' },
  proximoId: 1,
};

/**
 * Ponto de integração da §8.2. Hoje carrega o roteiro determinístico sob demanda; a IA futura
 * troca só esta função (exigirá ADR próprio).
 */
export async function carregarAssistente(): Promise<Assistente> {
  const { assistenteDeterministico } = await import('./roteiro');
  return assistenteDeterministico;
}
