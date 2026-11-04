import {
  RESPOSTAS_INICIAIS,
  TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE,
  type AcaoDoAssistente,
  type Assistente,
  type EntradaDoCliente,
  type EstadoDaConversa,
  type EtapaDoRoteiro,
  type MensagemDoChat,
  type RespostaDoAssistente,
  type RespostaRapida,
} from './assistant';
import {
  CARTOES_DO_CHAT,
  FORMATOS_DO_CANASTRA_NO_CHAT,
  QUEIJOS_DO_QUIZ_NO_CHAT,
} from './cartoesDoChat';
import type { SlugDoQueijo } from '@/data/cheeses';
import {
  PERGUNTAS,
  POR_ACOMPANHAMENTO,
  recomendarQueijo,
  textoPorQueCombina,
  type RespostasDoQuiz,
} from './quiz';
import { AVISO_DE_NOVA_ABA, lerNumeroDoPedido, type MotivoDoContato } from './whatsapp';

/**
 * Motor determinístico do assistente (spec §8.2; ADR-0010): máquina de estados pura, sem React,
 * rede, armazenamento nem relógio. Carregado só por `carregarAssistente()`.
 *
 * TEXTOS: todo texto visível do roteiro está em `TEXTOS_DO_ROTEIRO` (ou vem de `lib/quiz.ts`, dos
 * rótulos das respostas rápidas e dos dados dos cartões). Os que a spec não traz ficam como
 * `[A DEFINIR: …]` até o dono escrever (P52, decidido em 2026-11-03). O agente não propõe texto.
 */

const A_DEFINIR = (descricao: string) => `[A DEFINIR: ${descricao}]`;

export const TEXTOS_DO_ROTEIRO = {
  // --- Literais da spec (§8.2) ---
  /** Item 4 do roteiro do protótipo. */
  sugestaoDoPresente:
    'Ótima ocasião! Com tinto, um queijo curado e intenso costuma brilhar. Minha sugestão:',
  /** Item 6 do roteiro do protótipo. */
  perguntaDoPresente: 'Quer que eu inclua embalagem de presente e um cartão com mensagem?',
  rotuloComCartao: 'Sim, com cartão',
  rotuloOutrasOpcoes: 'Ver outras opções',
  /** Regras do assistente: mensagem de passagem para humano. */
  passagemParaHumano:
    'Vou chamar um queijista da nossa equipe. Continue pelo WhatsApp, já com o resumo desta conversa.',

  // --- Lacunas do P52: o dono escreve; até lá ficam visíveis ---
  transicaoSugestao: A_DEFINIR('transição antes da primeira pergunta do quiz no chat'),
  tabua: A_DEFINIR('texto antes dos cartões da tábua'),
  pedidoPedirNumero: A_DEFINIR('pedir o número do pedido, no formato AQ-123456'),
  pedidoNumeroInvalido: A_DEFINIR('número de pedido fora do formato'),
  pedidoEncaminhar: A_DEFINIR('número válido: sem consulta real, encaminhar ao WhatsApp'),
  harmonizar: A_DEFINIR('texto antes da pergunta "Vai acompanhar com…" e dos cartões'),
  outrasOpcoes: A_DEFINIR('texto ao escolher "Ver outras opções" (Manchego DOP e Parmigiano)'),
  presenteFormato: A_DEFINIR('pergunta do formato antes de pôr o presente na sacola'),
  depoisDaAcao: A_DEFINIR('texto depois de pôr na sacola'),
  continuar: A_DEFINIR('texto depois de cada sugestão, antes das respostas rápidas iniciais'),
  naoEntendi: A_DEFINIR('texto quando a mensagem não é reconhecida'),
  saude: A_DEFINIR(
    'resposta a perguntas de saúde (só o dono escreve; precisa recomendar consultar um médico e nada além)',
  ),
  /** Definido em `lib/whatsapp.ts` (o link fica no pacote global); aqui para o dono achar todos os textos. */
  avisoNovaAba: AVISO_DE_NOVA_ABA,
} as const;

// --- Texto livre -------------------------------------------------------------------------------

/** Minúsculas, sem acento (NFD) e espaços normalizados. */
export function normalizar(texto: string): string {
  // Limite antes de qualquer regex: entrada enorme não pode custar tempo (ReDoS).
  return limitar(texto)
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export type Intencao =
  | 'saude'
  | 'humano'
  | 'pedido'
  | 'presente-tinto'
  | 'tabua'
  | 'harmonizar'
  | 'sugerir'
  | 'nao-entendi';

// Tabela de palavras-chave (P48), sobre o texto normalizado. O dono pode revisar as listas.
// A lista de saúde é ampla de propósito: na dúvida, vale responder como saúde (sem recomendar).
const PALAVRAS_DE_SAUDE =
  /\b(gravid\w*|gestan\w*|gestac\w*|amament\w*|lactante|leite cru|alergi\w*|intoleran\w*|lactose|diabet\w*|colesterol|hipertens\w*|pressao alta|listeri\w*|imunossuprim\w*|imunidade baixa|quimioterapia|doenca\w*|doent\w*|intoxic\w*|pass(e\w*|ou|ar|a) mal|mal estar|enjo\w*|vomit\w*|diarreia|bebe\w*|crianca\w*|gluten|celiac\w*|idos\w*|saude|faz mal|fazer mal|posso comer|pode comer|remedio\w*|medicament\w*)\b/;

const PALAVRAS_DE_CORPORATIVO =
  /\b(empres\w*|corporativ\w*|cnpj|funcionari\w*|atacado|revenda|orcamento\w*)\b/;

const PALAVRAS_DE_HUMANO = [
  /\b(atendente|humano|queijista|vendedor|gerente|responsavel)\b/,
  /\b(falar|conversar|chamar|passar|ligar)\b.*\b(pessoa|alguem|gente|equipe|time)\b/,
  /\b(reclam\w*|insatisf\w*|decepcion\w*|pessimo|horrivel|absurdo)\b/,
  /\b(problema\w*|atras\w*|extravi\w*|estragad\w*|danificad\w*|quebrad\w*|nao chegou|nao recebi)\b/,
  /\b(entrega\w*|prazo\w*|frete)\b/,
  /\b(troca\w*|trocar|devolu\w*|devolver|reembolso|cancel\w*|estorn\w*)\b/,
  PALAVRAS_DE_CORPORATIVO,
];

const NUMERO_DO_PEDIDO_NO_TEXTO = /\baq[-\s]?\d{6}(?!\d)/;
// Exige posse ou consulta ("meu pedido", "status", "rastreio"): "fazer um pedido de presente" é compra.
const PALAVRAS_DE_PEDIDO =
  /\b(meus? pedidos?|minhas? encomendas?|status|rastre\w*|onde esta)\b|^(pedidos?|encomendas?)$/;
const PALAVRAS_DE_PRESENTE = /\b(presente\w*)\b/;
const PALAVRAS_DE_TINTO = /\btintos?\b/;
const PALAVRAS_DE_TABUA = /\b(tabua\w*|frios|petisco\w*)\b/;
const PALAVRAS_DE_HARMONIZACAO =
  /\b(harmoniz\w*|combin\w*|acompanh\w*|vinho\w*|tinto\w*|espumante\w*|cerveja\w*|champagne)\b/;
const PALAVRAS_DE_SUGESTAO =
  /\b(sugir\w*|sugest\w*|sugiro|recomend\w*|indic\w*|escolh\w*|queijo\w*)\b/;

/**
 * Intenção do texto livre. Prioridade fixa: a primeira que casar vence: saúde, passagem para
 * humano, pedido, presente com vinho tinto (roteiro do protótipo), tábua, harmonização, sugestão.
 * Não é IA: sem reconhecimento, devolve `nao-entendi`.
 */
export function reconhecerIntencao(texto: string): Intencao {
  const t = normalizar(texto);
  if (PALAVRAS_DE_SAUDE.test(t)) return 'saude';
  if (PALAVRAS_DE_HUMANO.some((r) => r.test(t))) return 'humano';
  if (NUMERO_DO_PEDIDO_NO_TEXTO.test(t) || PALAVRAS_DE_PEDIDO.test(t)) return 'pedido';
  if (PALAVRAS_DE_PRESENTE.test(t) && PALAVRAS_DE_TINTO.test(t) && !/\bnao\b/.test(t)) {
    return 'presente-tinto';
  }
  if (PALAVRAS_DE_TABUA.test(t)) return 'tabua';
  if (PALAVRAS_DE_HARMONIZACAO.test(t)) return 'harmonizar';
  if (PALAVRAS_DE_SUGESTAO.test(t) || PALAVRAS_DE_PRESENTE.test(t)) return 'sugerir';
  return 'nao-entendi';
}

// --- Construção da resposta ---------------------------------------------------------------------

type Saida = {
  etapa: EtapaDoRoteiro;
  respostasDoQuiz?: Partial<RespostasDoQuiz>;
  contato?: MotivoDoContato;
  transferir?: MotivoDoContato;
  acoes?: readonly AcaoDoAssistente[];
};

/** Acumula as mensagens novas; os ids saem do contador do estado (sem `Math.random`). */
function criarConstrutor(estado: EstadoDaConversa) {
  let proximoId = estado.proximoId;
  const mensagens: MensagemDoChat[] = [];
  const id = () => `m${proximoId++}`;
  return {
    mensagens,
    proximoId: () => proximoId,
    assistente(texto: string) {
      mensagens.push({ id: id(), tipo: 'assistente', texto });
    },
    cliente(texto: string) {
      mensagens.push({ id: id(), tipo: 'cliente', texto });
    },
    produto(slug: SlugDoQueijo) {
      mensagens.push({ id: id(), tipo: 'produto', slug, cartao: CARTOES_DO_CHAT[slug] });
    },
    respostas(opcoes: readonly RespostaRapida[]) {
      mensagens.push({ id: id(), tipo: 'respostas-rapidas', opcoes });
    },
  };
}
type Construtor = ReturnType<typeof criarConstrutor>;

function montar(c: Construtor, estado: EstadoDaConversa, saida: Saida): RespostaDoAssistente {
  return {
    mensagens: c.mensagens,
    acoes: saida.acoes ?? [],
    ...(saida.transferir ? { transferirParaHumano: saida.transferir } : {}),
    estado: {
      etapa: saida.etapa,
      respostasDoQuiz: saida.respostasDoQuiz ?? {},
      contato: saida.contato ?? estado.contato,
      proximoId: c.proximoId(),
    },
  };
}

/** Entrada que não vale (resposta rápida antiga, texto vazio): nada muda. */
function ignorar(estado: EstadoDaConversa): RespostaDoAssistente {
  return { mensagens: [], acoes: [], estado };
}

const idDaOpcao = (chave: string, valor: string) => `${chave}:${valor}`;

function opcoesRapidas<V extends string>(
  chave: string,
  opcoes: readonly { valor: V; rotulo: string }[],
): RespostaRapida[] {
  return opcoes.map((o) => ({ id: idDaOpcao(chave, o.valor), rotulo: o.rotulo }));
}

function acharOpcao<V extends string>(
  chave: string,
  opcoes: readonly { valor: V; rotulo: string }[],
  id: string,
): { valor: V; rotulo: string } | undefined {
  return opcoes.find((o) => idDaOpcao(chave, o.valor) === id);
}

const [PERGUNTA_DE_SABOR, PERGUNTA_DE_USO, PERGUNTA_DE_ACOMPANHAMENTO] = PERGUNTAS;

// --- Ações do roteiro ---------------------------------------------------------------------------

/** "Continue" depois de uma sugestão: texto + respostas rápidas iniciais. */
function oferecerOInicio(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.continuar);
  c.respostas(RESPOSTAS_INICIAIS);
  return { etapa: 'inicio' };
}

function comecarOQuiz(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.transicaoSugestao);
  c.assistente(PERGUNTA_DE_SABOR.titulo);
  c.respostas(opcoesRapidas(PERGUNTA_DE_SABOR.chave, PERGUNTA_DE_SABOR.opcoes));
  return { etapa: 'quiz-sabor', respostasDoQuiz: {} };
}

const SLUGS_DA_TABUA: readonly SlugDoQueijo[] = [
  'brie-frances',
  'canastra-curado',
  'cabra-com-cinzas',
];

function mostrarATabua(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.tabua);
  for (const slug of SLUGS_DA_TABUA) c.produto(slug);
  return oferecerOInicio(c);
}

function pedirONumero(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.pedidoPedirNumero);
  return { etapa: 'pedido-numero' };
}

function comecarAHarmonizacao(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.harmonizar);
  c.assistente(PERGUNTA_DE_ACOMPANHAMENTO.titulo);
  c.respostas(opcoesRapidas(PERGUNTA_DE_ACOMPANHAMENTO.chave, PERGUNTA_DE_ACOMPANHAMENTO.opcoes));
  return { etapa: 'harmonizar' };
}

/** Roteiro do protótipo (§8.2, itens 4 a 7): sugere o Canastra curado e pergunta do presente. */
function sugerirOCanastraParaPresente(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.sugestaoDoPresente);
  c.produto('canastra-curado');
  c.assistente(TEXTOS_DO_ROTEIRO.perguntaDoPresente);
  c.respostas([
    { id: 'com-cartao', rotulo: TEXTOS_DO_ROTEIRO.rotuloComCartao, sugerida: true },
    { id: 'outras-opcoes', rotulo: TEXTOS_DO_ROTEIRO.rotuloOutrasOpcoes },
  ]);
  return {
    etapa: 'presente',
    contato: { tipo: 'produto', nomeDoQueijo: CARTOES_DO_CHAT['canastra-curado'].nome },
  };
}

/** Decisão 5 do ADR-0010: o texto digitado nunca vai para a URL; o motivo vem só de dados validados. */
function passarParaHumano(c: Construtor, motivo: MotivoDoContato, antes?: string): Saida {
  if (antes !== undefined) c.assistente(antes);
  c.assistente(TEXTOS_DO_ROTEIRO.passagemParaHumano);
  return { etapa: 'livre', contato: motivo, transferir: motivo };
}

function responderSobreSaude(c: Construtor): Saida {
  // Só o texto do dono: nenhum cartão, nenhuma recomendação (§8.2).
  c.assistente(TEXTOS_DO_ROTEIRO.saude);
  return { etapa: 'livre' };
}

function naoEntendi(c: Construtor): Saida {
  c.assistente(TEXTOS_DO_ROTEIRO.naoEntendi);
  c.respostas(RESPOSTAS_INICIAIS);
  return { etapa: 'inicio' };
}

// --- Resposta rápida ----------------------------------------------------------------------------

function responderComRespostaRapida(estado: EstadoDaConversa, id: string): RespostaDoAssistente {
  const c = criarConstrutor(estado);

  switch (estado.etapa) {
    case 'inicio': {
      const opcao = RESPOSTAS_INICIAIS.find((o) => o.id === id);
      if (!opcao) return ignorar(estado);
      c.cliente(opcao.rotulo);
      if (id === 'sugerir-queijo') return montar(c, estado, comecarOQuiz(c));
      if (id === 'montar-tabua') return montar(c, estado, mostrarATabua(c));
      return montar(c, estado, pedirONumero(c));
    }

    case 'quiz-sabor': {
      const opcao = acharOpcao(PERGUNTA_DE_SABOR.chave, PERGUNTA_DE_SABOR.opcoes, id);
      if (!opcao) return ignorar(estado);
      c.cliente(opcao.rotulo);
      c.assistente(PERGUNTA_DE_USO.titulo);
      c.respostas(opcoesRapidas(PERGUNTA_DE_USO.chave, PERGUNTA_DE_USO.opcoes));
      return montar(c, estado, { etapa: 'quiz-uso', respostasDoQuiz: { sabor: opcao.valor } });
    }

    case 'quiz-uso': {
      const opcao = acharOpcao(PERGUNTA_DE_USO.chave, PERGUNTA_DE_USO.opcoes, id);
      const { sabor } = estado.respostasDoQuiz;
      if (!opcao) return ignorar(estado);
      c.cliente(opcao.rotulo);
      if (!sabor) return montar(c, estado, comecarOQuiz(c));
      c.assistente(PERGUNTA_DE_ACOMPANHAMENTO.titulo);
      c.respostas(
        opcoesRapidas(PERGUNTA_DE_ACOMPANHAMENTO.chave, PERGUNTA_DE_ACOMPANHAMENTO.opcoes),
      );
      return montar(c, estado, {
        etapa: 'quiz-acompanhamento',
        respostasDoQuiz: { sabor, uso: opcao.valor },
      });
    }

    case 'quiz-acompanhamento': {
      const opcao = acharOpcao(
        PERGUNTA_DE_ACOMPANHAMENTO.chave,
        PERGUNTA_DE_ACOMPANHAMENTO.opcoes,
        id,
      );
      const { sabor, uso } = estado.respostasDoQuiz;
      if (!opcao) return ignorar(estado);
      c.cliente(opcao.rotulo);
      if (!sabor || !uso) return montar(c, estado, comecarOQuiz(c));
      const respostas: RespostasDoQuiz = { sabor, uso, acompanhamento: opcao.valor };
      const slug = recomendarQueijo(respostas, QUEIJOS_DO_QUIZ_NO_CHAT);
      const cartao = CARTOES_DO_CHAT[slug];
      c.assistente(textoPorQueCombina(respostas, cartao.nome));
      c.produto(slug);
      const saida = oferecerOInicio(c);
      return montar(c, estado, {
        ...saida,
        contato: { tipo: 'produto', nomeDoQueijo: cartao.nome },
      });
    }

    case 'harmonizar': {
      const opcao = acharOpcao(
        PERGUNTA_DE_ACOMPANHAMENTO.chave,
        PERGUNTA_DE_ACOMPANHAMENTO.opcoes,
        id,
      );
      if (!opcao) return ignorar(estado);
      c.cliente(opcao.rotulo);
      for (const slug of POR_ACOMPANHAMENTO[opcao.valor]) c.produto(slug);
      return montar(c, estado, oferecerOInicio(c));
    }

    case 'presente': {
      if (id === 'com-cartao') {
        c.cliente(TEXTOS_DO_ROTEIRO.rotuloComCartao);
        c.assistente(TEXTOS_DO_ROTEIRO.presenteFormato);
        c.respostas(
          FORMATOS_DO_CANASTRA_NO_CHAT.map((f) => ({
            id: idDaOpcao('formato', f.id),
            rotulo: f.rotulo,
          })),
        );
        return montar(c, estado, { etapa: 'presente-formato' });
      }
      if (id === 'outras-opcoes') {
        c.cliente(TEXTOS_DO_ROTEIRO.rotuloOutrasOpcoes);
        c.assistente(TEXTOS_DO_ROTEIRO.outrasOpcoes);
        c.produto('manchego');
        c.produto('parmigiano-reggiano');
        return montar(c, estado, oferecerOInicio(c));
      }
      return ignorar(estado);
    }

    case 'presente-formato': {
      const formato = FORMATOS_DO_CANASTRA_NO_CHAT.find((f) => idDaOpcao('formato', f.id) === id);
      if (!formato) return ignorar(estado);
      c.cliente(formato.rotulo);
      c.assistente(TEXTOS_DO_ROTEIRO.depoisDaAcao);
      c.respostas(RESPOSTAS_INICIAIS);
      return montar(c, estado, {
        etapa: 'inicio',
        acoes: [
          {
            tipo: 'adicionar-a-sacola',
            slug: 'canastra-curado',
            formatoId: formato.id,
            quantidade: 1,
            presente: true,
          },
        ],
      });
    }

    case 'pedido-numero':
    case 'livre':
      // Não há resposta rápida pendente: um clique antigo é ignorado.
      return ignorar(estado);
  }
}

// --- Texto digitado -----------------------------------------------------------------------------

/** Corta em pontos de código (não parte emoji). O `slice` prévio evita espalhar uma string enorme. */
function limitar(texto: string): string {
  const max = TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE;
  return [...texto.slice(0, max * 2)].slice(0, max).join('');
}

function responderComTexto(estado: EstadoDaConversa, bruto: string): RespostaDoAssistente {
  if (typeof bruto !== 'string') return ignorar(estado);
  const texto = limitar(bruto.slice(0, TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE * 4).trim());
  if (texto === '') return ignorar(estado);

  const c = criarConstrutor(estado);
  c.cliente(texto);

  const normal = normalizar(texto);
  const intencao = reconhecerIntencao(texto);
  const numeroAchado = NUMERO_DO_PEDIDO_NO_TEXTO.exec(normal)?.[0];
  const numero = numeroAchado === undefined ? null : lerNumeroDoPedido(numeroAchado);
  const esperandoONumero = estado.etapa === 'pedido-numero';

  switch (intencao) {
    case 'saude':
      return montar(c, estado, responderSobreSaude(c));

    case 'humano': {
      // Só o número validado ou o tipo fixo chegam ao contato; o texto digitado nunca.
      const motivo: MotivoDoContato = numero
        ? { tipo: 'pedido', numero }
        : PALAVRAS_DE_CORPORATIVO.test(normal)
          ? { tipo: 'corporativo' }
          : estado.contato;
      return montar(c, estado, passarParaHumano(c, motivo));
    }

    case 'pedido':
      if (numero) {
        return montar(
          c,
          estado,
          passarParaHumano(c, { tipo: 'pedido', numero }, TEXTOS_DO_ROTEIRO.pedidoEncaminhar),
        );
      }
      if (esperandoONumero) {
        c.assistente(TEXTOS_DO_ROTEIRO.pedidoNumeroInvalido);
        return montar(c, estado, { etapa: 'pedido-numero' });
      }
      return montar(c, estado, pedirONumero(c));

    case 'presente-tinto':
      return montar(c, estado, sugerirOCanastraParaPresente(c));
    case 'tabua':
      return montar(c, estado, mostrarATabua(c));
    case 'harmonizar':
      return montar(c, estado, comecarAHarmonizacao(c));
    case 'sugerir':
      return montar(c, estado, comecarOQuiz(c));

    case 'nao-entendi':
      if (esperandoONumero) {
        c.assistente(TEXTOS_DO_ROTEIRO.pedidoNumeroInvalido);
        return montar(c, estado, { etapa: 'pedido-numero' });
      }
      return montar(c, estado, naoEntendi(c));
  }
}

export const assistenteDeterministico: Assistente = {
  responder(estado: EstadoDaConversa, entrada: EntradaDoCliente): Promise<RespostaDoAssistente> {
    return Promise.resolve(
      entrada.tipo === 'texto'
        ? responderComTexto(estado, entrada.texto)
        : responderComRespostaRapida(estado, entrada.id),
    );
  },
};
