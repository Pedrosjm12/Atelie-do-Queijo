import type { SlugDoQueijo } from '@/data/cheeses';
import type { CartaoDoChat } from './assistant';
import type { QueijoDoQuiz } from './quiz';

/**
 * Dados mínimos dos cartões de produto no chat (spec §8.2), um por queijo do catálogo. Cópia
 * estática, importada só pelo motor (`lib/roteiro.ts`, carregado sob demanda): o painel, que fica
 * no pacote global, não arrasta `data/cheeses` nem `lib/catalogo`. `cartoesDoChat.test.ts` garante
 * que continua igual a `dadosDoCartao(q, 'chat')` e a `q.ilustracao`. O tipo `Record` obriga a
 * ter um cartão para cada slug: o assistente nunca mostra queijo fora do catálogo.
 */
export const CARTOES_DO_CHAT: Readonly<Record<SlugDoQueijo, CartaoDoChat>> = {
  'canastra-curado': {
    nome: 'Canastra curado',
    tag: 'BRASIL · CANASTRA, MG',
    linhaPequena: 'a partir de',
    preco: 4900,
    ilustracao: { shape: 'wide', side: '#A8642A', top: '#D9A752' },
  },
  'canastra-meia-cura-premiado': {
    nome: 'Canastra meia cura premiado',
    tag: 'BRASIL · SERRA DA CANASTRA, MG',
    linhaPequena: 'a partir de',
    preco: 11750,
    ilustracao: { shape: 'wide', side: '#B98436', top: '#E8CB86' },
  },
  'creme-do-marajo': {
    nome: 'Creme do Marajó',
    tag: 'BRASIL · ILHA DE MARAJÓ, PA',
    linhaPequena: '200 g',
    preco: 6490,
    ilustracao: { shape: 'small', side: '#CDBFA0', top: '#F3EAD8' },
  },
  'penadinho-de-bufala': {
    nome: 'Penadinho de búfala',
    tag: 'BRASIL · FAZENDA SANTA HELENA',
    linhaPequena: '~420 g',
    preco: 11900,
    ilustracao: { shape: 'wide', side: '#C9B98C', top: '#EADFB9' },
  },
  'cabra-com-cinzas': {
    nome: 'Cabra com cinzas',
    tag: 'BRASIL · LEITE DE CABRA',
    linhaPequena: 'a partir de',
    preco: 7400,
    ilustracao: { shape: 'small', side: '#3A3935', top: '#6E6C65' },
  },
  'gorgonzola-dolce': {
    nome: 'Gorgonzola Dolce',
    tag: 'BRASIL · SERRA DAS ANTAS, MG',
    linhaPequena: '~300 g',
    preco: 7600,
    ilustracao: { shape: 'wide', side: '#9C8F6E', top: '#E6DBB8' },
  },
  'tipo-gruyere': {
    nome: 'Tipo Gruyère',
    tag: 'BRASIL · CRUZÍLIA, MG',
    linhaPequena: 'a partir de',
    preco: 5573,
    ilustracao: { shape: 'tall', side: '#A07A3C', top: '#D9B766' },
  },
  'brie-frances': {
    nome: 'Brie francês',
    tag: 'FRANÇA · IMPORTADO',
    linhaPequena: 'a partir de',
    preco: 12248,
    ilustracao: { shape: 'flat', side: '#CFC6B2', top: '#F5EFE2' },
  },
  'parmigiano-reggiano': {
    nome: 'Parmigiano Reggiano DOP',
    tag: 'ITÁLIA · IMPORTADO',
    linhaPequena: 'a partir de',
    preco: 12500,
    ilustracao: { shape: 'tall', side: '#B88F3F', top: '#E2C27A' },
  },
  manchego: {
    nome: 'Manchego DOP',
    tag: 'ESPANHA · IMPORTADO',
    linhaPequena: 'a partir de',
    preco: 12999,
    ilustracao: { shape: 'wide', side: '#8C6A3A', top: '#D8B878' },
  },
};

/** O que a pontuação do quiz precisa (slug + maior formato), na ordem do catálogo (§9). */
export const QUEIJOS_DO_QUIZ_NO_CHAT: readonly QueijoDoQuiz[] = [
  { slug: 'canastra-curado', maiorFormatoEmGramas: 1000 },
  { slug: 'canastra-meia-cura-premiado', maiorFormatoEmGramas: 1000 },
  { slug: 'creme-do-marajo', maiorFormatoEmGramas: 200 },
  { slug: 'penadinho-de-bufala', maiorFormatoEmGramas: 420 },
  { slug: 'cabra-com-cinzas', maiorFormatoEmGramas: 160 },
  { slug: 'gorgonzola-dolce', maiorFormatoEmGramas: 300 },
  { slug: 'tipo-gruyere', maiorFormatoEmGramas: 500 },
  { slug: 'brie-frances', maiorFormatoEmGramas: 500 },
  { slug: 'parmigiano-reggiano', maiorFormatoEmGramas: 500 },
  { slug: 'manchego', maiorFormatoEmGramas: 500 },
];

/**
 * Formatos do Canastra curado oferecidos ao pôr o presente na sacola (P46 = C): "nome peso" como
 * na §9 ("Peça inteira ~1 kg"). `cartoesDoChat.test.ts` confere ids e rótulos com o catálogo.
 */
export const FORMATOS_DO_CANASTRA_NO_CHAT: readonly { id: string; rotulo: string }[] = [
  { id: 'inteira', rotulo: 'Peça inteira ~1 kg' },
  { id: 'meia', rotulo: 'Meia peça ~500 g' },
  { id: 'fracao', rotulo: 'Fração ~250 g' },
];
