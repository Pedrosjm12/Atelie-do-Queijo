import type { SlugDoQueijo } from '@/data/cheeses';

export type RespostaRapida = {
  id: string;
  rotulo: string;
  /** A sugerida tem borda `--ouro` e peso 600 (spec §8.2). */
  sugerida?: boolean;
};

export type MensagemDoChat =
  | { id: string; tipo: 'assistente'; texto: string }
  | { id: string; tipo: 'cliente'; texto: string }
  | { id: string; tipo: 'produto'; slug: SlugDoQueijo }
  | { id: string; tipo: 'respostas-rapidas'; opcoes: readonly RespostaRapida[] };

/**
 * Spec §8.2, itens 1 a 7, literais. Provisório até a etapa 6 (pendência P4): lá a conversa
 * passa a começar só com a saudação e as respostas rápidas, e o roteiro determinístico
 * produz esta mesma lista de mensagens.
 */
export const ROTEIRO_DO_PROTOTIPO: readonly MensagemDoChat[] = [
  {
    id: 'saudacao',
    tipo: 'assistente',
    texto:
      'Olá! Sou o assistente do Ateliê do Queijo. Posso sugerir um queijo, montar uma tábua, indicar uma harmonização ou ver o status do seu pedido. Por onde começamos?',
  },
  {
    id: 'respostas-iniciais',
    tipo: 'respostas-rapidas',
    opcoes: [
      { id: 'sugerir-queijo', rotulo: 'Sugira um queijo' },
      { id: 'montar-tabua', rotulo: 'Montar uma tábua' },
      { id: 'status-do-pedido', rotulo: 'Onde está meu pedido?' },
    ],
  },
  {
    id: 'pedido-do-cliente',
    tipo: 'cliente',
    texto: 'Quero presentear alguém que adora vinho tinto.',
  },
  {
    id: 'sugestao',
    tipo: 'assistente',
    texto: 'Ótima ocasião! Com tinto, um queijo curado e intenso costuma brilhar. Minha sugestão:',
  },
  { id: 'produto-sugerido', tipo: 'produto', slug: 'canastra-curado' },
  {
    id: 'pergunta-do-presente',
    tipo: 'assistente',
    texto: 'Quer que eu inclua embalagem de presente e um cartão com mensagem?',
  },
  {
    id: 'respostas-do-presente',
    tipo: 'respostas-rapidas',
    opcoes: [
      { id: 'com-cartao', rotulo: 'Sim, com cartão', sugerida: true },
      { id: 'outras-opcoes', rotulo: 'Ver outras opções' },
    ],
  },
];
