/**
 * Catálogo de lançamento (spec §9), com os campos acrescentados no PLANO (etapa 3).
 * Textos literais da spec. Lacunas entre colchetes ficam visíveis até o dono preenchê-las.
 */

export type Origem = 'brasil' | 'mundo';
export type Shape = 'wide' | 'tall' | 'flat' | 'small';

import type { Centavos } from '@/lib/dinheiro';

export type { Centavos };

export interface Formato {
  /** Estável: vai para a sacola na etapa 4. */
  id: string;
  /** "Peça inteira", "Meia peça", "Fração", "Peça". "[A DEFINIR]" quando a §9 só dá o peso. */
  nome: string;
  /** Rótulo do celular (§7.6). Sem ele, usa `nome`. */
  nomeCurto?: string;
  /** Texto literal da §9: "~1 kg", "~500 g", "200 g". */
  peso: string;
  preco: Centavos;
}

export type Nivel = 1 | 2 | 3 | 4 | 5;

export interface Selo {
  tipo: 'origem' | 'maturacao';
  texto: string;
  /** Texto do celular (§7.6). */
  textoCurto?: string;
}

export interface DetalheDoQueijo {
  produtor: string;
  selos: readonly Selo[];
  descricao: string;
  descricaoCurta: string;
  perfil: Readonly<Record<'intensidade' | 'cremosidade' | 'salinidade' | 'aroma', Nivel | null>>;
  historia: readonly string[];
  harmonizacao: { vinho: string; cerveja: string; acompanhamentos: string };
  comoServir: string;
  comoGuardar: string;
  fichaTecnica: string;
}

/** Slugs do catálogo (a ordem não importa). `QUEIJOS` é checado contra este tipo. */
export type SlugDoQueijo =
  | 'canastra-curado'
  | 'canastra-meia-cura-premiado'
  | 'creme-do-marajo'
  | 'penadinho-de-bufala'
  | 'cabra-com-cinzas'
  | 'gorgonzola-dolce'
  | 'tipo-gruyere'
  | 'brie-frances'
  | 'parmigiano-reggiano'
  | 'manchego';

/** Sem dado de estoque na spec: todos começam como 'disponivel'. `restam: null` mostra "[n]". */
export type Estoque =
  | { situacao: 'disponivel' }
  | { situacao: 'ultimas'; restam: number | null }
  | { situacao: 'esgotado' };

export interface Cheese {
  slug: SlugDoQueijo;
  nome: string;
  origem: Origem;
  /** Sobretítulo do cartão, MAIÚSCULAS. */
  tag: string;
  /** Linha sensorial curta; também a meta description. */
  nota: string;
  /** Ao menos um; o primeiro é o padrão. */
  formatos: readonly [Formato, ...Formato[]];
  /** Parâmetros do gerador A.6. */
  ilustracao: { shape: Shape; side: string; top: string };
  /** Posição na vitrine "Na cave esta semana" (1 a 4). */
  destaqueSemana?: 1 | 2 | 3 | 4;
  /** Textos do cartão da Home e do chat quando diferem da §9 (§5.4). */
  vitrine?: { tag?: string; nota?: string; linhaPequena?: string };
  detalhe: DetalheDoQueijo;
  estoque: Estoque;
}

const A_DEFINIR = '[A DEFINIR]';

/** Detalhe dos queijos sem conteúdo curado (§9): tudo `[A DEFINIR]`, perfil sem valores. */
const DETALHE_A_DEFINIR = {
  produtor: A_DEFINIR,
  selos: [{ tipo: 'origem', texto: A_DEFINIR }],
  descricao: A_DEFINIR,
  descricaoCurta: A_DEFINIR,
  perfil: { intensidade: null, cremosidade: null, salinidade: null, aroma: null },
  historia: [A_DEFINIR],
  harmonizacao: { vinho: A_DEFINIR, cerveja: A_DEFINIR, acompanhamentos: A_DEFINIR },
  comoServir: A_DEFINIR,
  comoGuardar: A_DEFINIR,
  fichaTecnica: A_DEFINIR,
} as const satisfies DetalheDoQueijo;

const DISPONIVEL = { situacao: 'disponivel' } as const satisfies Estoque;

export const QUEIJOS = [
  {
    slug: 'canastra-curado',
    nome: 'Canastra curado',
    origem: 'brasil',
    tag: 'BRASIL · SERRA DA CANASTRA, MG',
    nota: 'Intenso, amanteigado, final picante.',
    formatos: [
      { id: 'inteira', nome: 'Peça inteira', nomeCurto: 'Inteira', peso: '~1 kg', preco: 13600 },
      { id: 'meia', nome: 'Meia peça', nomeCurto: 'Meia', peso: '~500 g', preco: 7800 },
      { id: 'fracao', nome: 'Fração', peso: '~250 g', preco: 4900 },
    ],
    ilustracao: { shape: 'wide', side: '#A8642A', top: '#D9A752' },
    destaqueSemana: 1,
    vitrine: { tag: 'BRASIL · CANASTRA, MG' },
    detalhe: {
      produtor: 'Queijaria [NOME DO PRODUTOR]',
      selos: [
        { tipo: 'origem', texto: 'Selo Arte' },
        { tipo: 'maturacao', texto: 'Leite cru' },
        { tipo: 'maturacao', texto: '60 dias de cura', textoCurto: '60 dias' },
      ],
      descricao:
        'Casca firme e dourada, massa amarelada e levemente esfarelada. Sabor intenso, com notas de manteiga tostada e um final picante que fica na boca.',
      descricaoCurta:
        'Casca firme e dourada, massa levemente esfarelada. Intenso, com notas de manteiga tostada e final picante.',
      perfil: { intensidade: 4, cremosidade: 2, salinidade: 3, aroma: 4 },
      historia: [
        'Na Serra da Canastra, o queijo é feito com leite cru da ordenha do dia e o pingo, o fermento natural recolhido do soro da fornada anterior. [NOME DO PRODUTOR] mantém o método da família desde [ANO].',
        'Depois de prensado à mão, cada queijo matura 60 dias em prateleiras de madeira, virado diariamente, até a casca ficar firme e dourada.',
      ],
      harmonizacao: {
        vinho: '[Sugestão de tinto encorpado]',
        cerveja: '[Sugestão de cerveja]',
        acompanhamentos: 'Goiabada cascão, mel de laranjeira, castanhas',
      },
      comoServir:
        'Tire da geladeira 40 minutos antes de servir. Corte em lascas finas, do centro para a casca, para que cada pedaço tenha um pouco de tudo.',
      comoGuardar:
        'Embrulhe em papel manteiga e depois em filme ou pote com tampa. Guarde na gaveta de legumes e consuma em até [N] dias após aberto.',
      fichaTecnica:
        'Leite: vaca, cru · Massa: semidura · Maturação: 60 dias · Peso: ~1 kg · Registro: [SELO E NÚMERO] · Contém leite e derivados · Validade: [DATA]',
    },
    estoque: DISPONIVEL,
  },
  {
    slug: 'canastra-meia-cura-premiado',
    nome: 'Canastra meia cura premiado',
    origem: 'brasil',
    tag: 'BRASIL · SERRA DA CANASTRA, MG',
    nota: 'Macio, lácteo e delicado.',
    formatos: [
      { id: 'inteira', nome: 'Peça inteira', nomeCurto: 'Inteira', peso: '~1 kg', preco: 21499 },
      { id: 'meia', nome: 'Meia peça', nomeCurto: 'Meia', peso: '~500 g', preco: 11750 },
    ],
    ilustracao: { shape: 'wide', side: '#B98436', top: '#E8CB86' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'creme-do-marajo',
    nome: 'Creme do Marajó',
    origem: 'brasil',
    tag: 'BRASIL · ILHA DE MARAJÓ, PA',
    nota: 'Leite de búfala, cremoso e suave.',
    formatos: [{ id: 'fracao', nome: 'Fração', peso: '200 g', preco: 6490 }],
    ilustracao: { shape: 'small', side: '#CDBFA0', top: '#F3EAD8' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'penadinho-de-bufala',
    nome: 'Penadinho de búfala',
    origem: 'brasil',
    tag: 'BRASIL · FAZENDA SANTA HELENA',
    nota: 'Amanteigado, de leite de búfala.',
    formatos: [{ id: 'peca', nome: 'Peça', peso: '~420 g', preco: 11900 }],
    ilustracao: { shape: 'wide', side: '#C9B98C', top: '#EADFB9' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'cabra-com-cinzas',
    nome: 'Cabra com cinzas',
    origem: 'brasil',
    tag: 'BRASIL · SERRA DA MANTIQUEIRA, SP',
    nota: 'Fresco, cítrico, casca aveludada.',
    formatos: [{ id: 'peca', nome: 'Peça', peso: '~160 g', preco: 7400 }],
    ilustracao: { shape: 'small', side: '#3A3935', top: '#6E6C65' },
    destaqueSemana: 4,
    vitrine: { tag: 'BRASIL · LEITE DE CABRA', linhaPequena: 'a partir de' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'gorgonzola-dolce',
    nome: 'Gorgonzola Dolce',
    origem: 'brasil',
    tag: 'BRASIL · SERRA DAS ANTAS, MG',
    nota: 'Macio, adocicado, veios suaves.',
    formatos: [{ id: 'fracao', nome: 'Fração', peso: '~300 g', preco: 7600 }],
    ilustracao: { shape: 'wide', side: '#9C8F6E', top: '#E6DBB8' },
    destaqueSemana: 3,
    vitrine: { nota: 'Macio, levemente adocicado, veios suaves.' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'tipo-gruyere',
    nome: 'Tipo Gruyère',
    origem: 'brasil',
    tag: 'BRASIL · CRUZÍLIA, MG',
    nota: 'Firme, com notas de nozes.',
    formatos: [
      { id: 'meia', nome: 'Meia peça', nomeCurto: 'Meia', peso: '~500 g', preco: 9145 },
      { id: 'fracao', nome: 'Fração', peso: '~250 g', preco: 5573 },
    ],
    ilustracao: { shape: 'tall', side: '#A07A3C', top: '#D9B766' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'brie-frances',
    nome: 'Brie francês',
    origem: 'mundo',
    tag: 'FRANÇA · IMPORTADO',
    nota: 'Cremoso, notas de cogumelo.',
    formatos: [
      { id: '500g', nome: A_DEFINIR, peso: '~500 g', preco: 22495 },
      { id: '250g', nome: A_DEFINIR, peso: '~250 g', preco: 12248 },
    ],
    ilustracao: { shape: 'flat', side: '#CFC6B2', top: '#F5EFE2' },
    destaqueSemana: 2,
    vitrine: { nota: 'Cremoso, notas de cogumelo e nozes.' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'parmigiano-reggiano',
    nome: 'Parmigiano Reggiano DOP',
    origem: 'mundo',
    tag: 'ITÁLIA · IMPORTADO',
    nota: 'Granuloso, salgado, umami.',
    formatos: [
      { id: '500g', nome: A_DEFINIR, peso: '~500 g', preco: 23000 },
      { id: '250g', nome: A_DEFINIR, peso: '~250 g', preco: 12500 },
    ],
    ilustracao: { shape: 'tall', side: '#B88F3F', top: '#E2C27A' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
  {
    slug: 'manchego',
    nome: 'Manchego DOP',
    origem: 'mundo',
    tag: 'ESPANHA · IMPORTADO',
    nota: 'Leite de ovelha, firme e curado.',
    formatos: [
      { id: '500g', nome: A_DEFINIR, peso: '~500 g', preco: 23998 },
      { id: '250g', nome: A_DEFINIR, peso: '~250 g', preco: 12999 },
    ],
    ilustracao: { shape: 'wide', side: '#8C6A3A', top: '#D8B878' },
    detalhe: DETALHE_A_DEFINIR,
    estoque: DISPONIVEL,
  },
] as const satisfies readonly Cheese[];

/**
 * Paridade entre a união `SlugDoQueijo` e os slugs de `QUEIJOS`: o `tsc` falha se divergirem
 * (slug a mais ou a menos de um lado). Só tipos, sem custo no pacote. Se quebrar aqui, ajuste a
 * união ou o catálogo.
 */
type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Afirmar<T extends true> = T;
export type ParidadeDosSlugs = Afirmar<Igual<(typeof QUEIJOS)[number]['slug'], SlugDoQueijo>>;
