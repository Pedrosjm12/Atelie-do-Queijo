import type { SlugDoQueijo } from '@/data/cheeses';

export type Sabor = 'suaves' | 'equilibrados' | 'intensos';
export type Uso = 'tabua' | 'presente' | 'para-mim';
export type Acompanhamento = 'tinto' | 'branco-espumante' | 'cerveja' | 'cafe-mel';

export interface RespostasDoQuiz {
  sabor: Sabor;
  uso: Uso;
  acompanhamento: Acompanhamento;
}

export interface PerguntaDoQuiz {
  chave: keyof RespostasDoQuiz;
  titulo: string;
  opcoes: readonly { valor: string; rotulo: string }[];
}

/** Textos literais da spec §5.6, na ordem em que aparecem. */
export const PERGUNTAS = [
  {
    chave: 'sabor',
    titulo: 'Você prefere sabores…',
    opcoes: [
      { valor: 'suaves', rotulo: 'Suaves e amanteigados' },
      { valor: 'equilibrados', rotulo: 'Equilibrados' },
      { valor: 'intensos', rotulo: 'Intensos e marcantes' },
    ],
  },
  {
    chave: 'uso',
    titulo: 'Vai servir como…',
    opcoes: [
      { valor: 'tabua', rotulo: 'Tábua para receber' },
      { valor: 'presente', rotulo: 'Presente' },
      { valor: 'para-mim', rotulo: 'Para mim, com calma' },
    ],
  },
  {
    chave: 'acompanhamento',
    titulo: 'Vai acompanhar com…',
    opcoes: [
      { valor: 'tinto', rotulo: 'Vinho tinto' },
      { valor: 'branco-espumante', rotulo: 'Vinho branco ou espumante' },
      { valor: 'cerveja', rotulo: 'Cerveja' },
      { valor: 'cafe-mel', rotulo: 'Café ou mel' },
    ],
  },
] as const satisfies readonly PerguntaDoQuiz[];

// Critérios da spec §10.4. Os slugs são checados pelo compilador contra o catálogo.
const POR_SABOR: Record<Sabor, readonly SlugDoQueijo[]> = {
  suaves: ['creme-do-marajo', 'penadinho-de-bufala', 'brie-frances'],
  equilibrados: ['gorgonzola-dolce', 'tipo-gruyere', 'canastra-meia-cura-premiado'],
  intensos: ['canastra-curado', 'parmigiano-reggiano', 'manchego', 'cabra-com-cinzas'],
};

/** "tábua → queijos de casca bonita (Brie, Canastra, Cabra)": os dois Canastras (P7). */
const POR_TABUA: readonly SlugDoQueijo[] = [
  'brie-frances',
  'canastra-curado',
  'canastra-meia-cura-premiado',
  'cabra-com-cinzas',
];

const POR_ACOMPANHAMENTO: Record<Acompanhamento, readonly SlugDoQueijo[]> = {
  tinto: ['canastra-curado', 'manchego', 'parmigiano-reggiano'],
  'branco-espumante': ['brie-frances', 'cabra-com-cinzas'],
  cerveja: ['tipo-gruyere', 'gorgonzola-dolce'],
  'cafe-mel': ['gorgonzola-dolce', 'canastra-meia-cura-premiado'],
};

/** Peso mínimo, em gramas, do maior formato para valer o ponto de "presente" (P7). */
const PESO_MINIMO_DE_PRESENTE = 500;

/** O que a pontuação precisa saber de cada queijo (a página monta; o catálogo não vai ao cliente). */
export interface QueijoDoQuiz {
  slug: SlugDoQueijo;
  maiorFormatoEmGramas: number;
}

/**
 * Lê o peso dos textos da §9 e devolve gramas: "~1 kg" → 1000, "~500 g" → 500, "200 g" → 200,
 * "1,5 kg" → 1500 (vírgula decimal) e "1.000 g" → 1000 (ponto de milhar). O til inicial é
 * ignorado. Texto fora desse padrão ("[A DEFINIR]") → 0.
 */
export function pesoEmGramas(peso: string): number {
  const achado = /(\d+(?:[.,]\d+)*)\s*(kg|g)\b/i.exec(peso);
  if (!achado) return 0;
  const bruto = achado[1] ?? '';
  const milhar = /^\d{1,3}(\.\d{3})+$/.test(bruto);
  const numero = Number(milhar ? bruto.replace(/\./g, '') : bruto.replace(',', '.'));
  if (Number.isNaN(numero)) return 0;
  return achado[2]?.toLowerCase() === 'kg' ? numero * 1000 : numero;
}

/** Peso do maior formato, em gramas, para montar o `QueijoDoQuiz`. */
export function maiorFormatoEmGramas(formatos: readonly { peso: string }[]): number {
  return Math.max(0, ...formatos.map((f) => pesoEmGramas(f.peso)));
}

function pontosDe(queijo: QueijoDoQuiz, r: RespostasDoQuiz): number {
  let pontos = 0;
  if (POR_SABOR[r.sabor].includes(queijo.slug)) pontos += 1;
  if (r.uso === 'tabua' && POR_TABUA.includes(queijo.slug)) pontos += 1;
  if (r.uso === 'presente' && queijo.maiorFormatoEmGramas >= PESO_MINIMO_DE_PRESENTE) pontos += 1;
  // "para mim → qualquer": não pontua.
  if (POR_ACOMPANHAMENTO[r.acompanhamento].includes(queijo.slug)) pontos += 1;
  return pontos;
}

/**
 * Queijo com mais pontos (+1 por critério atendido, spec §10.4). A lista vem na ordem do
 * catálogo e o empate é desfeito por ela: só pontuação estritamente maior passa à frente.
 */
export function recomendarQueijo(
  r: RespostasDoQuiz,
  queijos: readonly QueijoDoQuiz[],
): SlugDoQueijo {
  let melhor: { slug: SlugDoQueijo; pontos: number } | null = null;
  for (const queijo of queijos) {
    const pontos = pontosDe(queijo, r);
    if (melhor === null || pontos > melhor.pontos) melhor = { slug: queijo.slug, pontos };
  }
  if (melhor === null) throw new Error('Lista de queijos vazia');
  return melhor.slug;
}

function ehOpcao<T extends string>(validos: readonly T[], valor: string | undefined): valor is T {
  return valor !== undefined && validos.some((v) => v === valor);
}

const SABORES: readonly Sabor[] = ['suaves', 'equilibrados', 'intensos'];
const USOS: readonly Uso[] = ['tabua', 'presente', 'para-mim'];
const ACOMPANHAMENTOS: readonly Acompanhamento[] = [
  'tinto',
  'branco-espumante',
  'cerveja',
  'cafe-mel',
];

/** Valida respostas soltas (valores de `<button>`): só devolve se as três forem opções válidas. */
export function respostasCompletas(
  soltas: Partial<Record<keyof RespostasDoQuiz, string>>,
): RespostasDoQuiz | null {
  const { sabor, uso, acompanhamento } = soltas;
  if (!ehOpcao(SABORES, sabor) || !ehOpcao(USOS, uso) || !ehOpcao(ACOMPANHAMENTOS, acompanhamento))
    return null;
  return { sabor, uso, acompanhamento };
}
