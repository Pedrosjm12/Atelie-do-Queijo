import * as z from 'zod/mini';
import { normalizarCep } from './commerce';
import type { Cep } from './commerce';
import { TAMANHO_MAXIMO_DO_ID } from './formatosDaSacola';
import { MAXIMO_DE_LINHAS, QUANTIDADE_MAXIMA_POR_ITEM } from './sacola';

// Esquemas compartilhados entre o navegador (mensagens imediatas) e as Server Actions (a validação
// que conta). Só validam o FORMATO; a referência ao catálogo é conferida à parte (ADR-0007).

export const UFS = Object.freeze([
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const);
export type Uf = (typeof UFS)[number];

export type CampoDoCheckout =
  | 'nome'
  | 'email'
  | 'telefone'
  | 'cep'
  | 'logradouro'
  | 'numero'
  | 'complemento'
  | 'bairro'
  | 'cidade'
  | 'uf'
  | 'mensagem'
  | 'dataDeEntrega'
  | 'pagamento';

export const TAMANHO_MAXIMO_DA_MENSAGEM = 200;
export const LINHAS_MAXIMAS_DA_MENSAGEM = 6;
export const DIAS_MAXIMOS_DA_ENTREGA = 60;
const FUSO = 'America/Sao_Paulo';

/**
 * Mensagens em pt-BR por campo, no padrão do P17 ("Informe …, por exemplo …"). Fixas: nunca
 * interpolam o valor digitado (nem texto do Zod). Textos de nome, e-mail, telefone e CEP vêm do
 * P25; os demais seguem o mesmo padrão e aguardam conferência do dono.
 */
export const MENSAGENS_DE_ERRO: Readonly<Record<CampoDoCheckout, string>> = Object.freeze({
  nome: 'Informe seu nome.',
  email: 'Informe um e-mail válido, por exemplo voce@email.com.',
  telefone: 'Informe um telefone com DDD, por exemplo (11) 91234-5678.',
  cep: 'Informe um CEP com 8 números, por exemplo 01310-100.',
  logradouro: 'Informe a rua ou avenida, por exemplo Avenida Paulista.',
  numero: 'Informe o número, por exemplo 1578.',
  complemento: 'Use até 60 caracteres no complemento, por exemplo apto 42.',
  bairro: 'Informe o bairro, por exemplo Bela Vista.',
  cidade: 'Informe a cidade, por exemplo São Paulo.',
  uf: 'Escolha o estado, por exemplo SP.',
  mensagem: 'Escreva uma mensagem de até 200 caracteres e 6 linhas, por exemplo Feliz aniversário.',
  dataDeEntrega: 'Escolha uma data de entrega a partir de amanhã e em até 60 dias.',
  pagamento: 'Escolha Pix ou cartão.',
});

// --- Texto -----------------------------------------------------------------------------------

/**
 * Proibidos em qualquer texto: controle (Cc, inclusive `\n`), substitutos soltos (Cs), uso privado
 * (Co), separadores de linha e parágrafo (Zl, Zp), invisíveis de largura zero e marcas de direção
 * (U+200B, U+200C, U+200E, U+200F, U+061C, U+FEFF, U+2060–U+2064, U+00AD), a faixa de tags
 * (U+E0000–U+E007F) e os bidirecionais (U+202A–U+202E, U+2066–U+2069). Sempre em ESCAPE: nunca
 * escreva esses caracteres literais, que ficam invisíveis no código.
 */
const BASE_DE_PROIBIDOS = String.raw`\p{Cc}\p{Cs}\p{Co}\p{Zl}\p{Zp}\u200B\u200C\u200E\u200F\u061C\uFEFF\u2060-\u2064\u00AD\u{E0000}-\u{E007F}\u202A-\u202E\u2066-\u2069`;

/** Fora da `mensagem`, também são proibidos o ZWJ (U+200D) e o seletor de emoji VS16 (U+FE0F). */
const PROIBIDOS = new RegExp(String.raw`[${BASE_DE_PROIBIDOS}\u200D\uFE0F]`, 'u');
/** Na `mensagem`, ZWJ e VS16 são liberados (emoji compostos); `\n` é tratado à parte. */
const PROIBIDOS_NA_MENSAGEM = new RegExp(String.raw`[${BASE_DE_PROIBIDOS}]`, 'u');

const TEM_LETRA_OU_NUMERO = /[\p{L}\p{N}]/u;

/** Conta por ponto de código: um emoji conta 1. */
function contarPontosDeCodigo(texto: string): number {
  return Array.from(texto).length;
}

interface OpcoesDoTexto {
  /** Texto de várias linhas (só a `mensagem`): `\n` liberado, até LINHAS_MAXIMAS_DA_MENSAGEM. */
  readonly multilinha?: boolean;
  /** Exige ao menos uma letra ou número (nome, logradouro, bairro, cidade). */
  readonly exigeLetraOuNumero?: boolean;
}

/**
 * Texto livre: o tamanho BRUTO é conferido antes de qualquer outra coisa (com `abort`, as demais
 * verificações nem rodam em entrada gigante); depois trim e NFC (e, na mensagem, `\r\n` e `\r`
 * viram `\n` ANTES de contar); depois UTF-16 bem formado, proibidos e faixa de tamanho contada em
 * pontos de código. O teto bruto (8×) cobre NFD e emoji (2 unidades).
 */
function texto(minimo: number, maximo: number, opcoes: OpcoesDoTexto = {}) {
  const { multilinha = false, exigeLetraOuNumero = false } = opcoes;
  const proibidos = multilinha ? PROIBIDOS_NA_MENSAGEM : PROIBIDOS;
  return z.string().check(
    z.maxLength(maximo * 8, { abort: true }),
    z.overwrite((s: string) => {
      const limpo = s.trim().normalize('NFC');
      return multilinha ? limpo.replace(/\r\n?/g, '\n') : limpo;
    }),
    z.refine((s: string) => s.isWellFormed()),
    z.refine((s: string) => !proibidos.test(multilinha ? s.replace(/\n/g, '') : s)),
    z.refine((s: string) => {
      const n = contarPontosDeCodigo(s);
      return n >= minimo && n <= maximo;
    }),
    z.refine((s: string) => !multilinha || s.split('\n').length <= LINHAS_MAXIMAS_DA_MENSAGEM),
    z.refine((s: string) => !exigeLetraOuNumero || TEM_LETRA_OU_NUMERO.test(s)),
  );
}

const TAMANHO_MAXIMO_DO_EMAIL = 254;
// Lista PERMITIDA, só ASCII (IDN só em punycode, "xn--"): local de 1 a 64 caracteres do conjunto
// atext da RFC 5322 e domínio em rótulos de 1 a 63 letras, números e hífen separados por ponto.
// Classes disjuntas em torno de `@` e `.`: tempo linear, sem backtracking catastrófico.
const FORMATO_DO_EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9-]{1,63}\.)+[A-Za-z0-9-]{1,63}$/;
// Ponto no começo/fim do local ou duplicado; hífen no começo ou no fim de um rótulo do domínio.
const PONTUACAO_MAL_COLOCADA_NO_EMAIL = /^\.|\.\.|\.@|@-|-\.|\.-|-$/;

const email = z.string().check(
  z.maxLength(TAMANHO_MAXIMO_DO_EMAIL * 8, { abort: true }),
  z.overwrite((s: string) => s.trim().toLowerCase()),
  z.maxLength(TAMANHO_MAXIMO_DO_EMAIL, { abort: true }),
  z.refine((s: string) => FORMATO_DO_EMAIL.test(s) && !PONTUACAO_MAL_COLOCADA_NO_EMAIL.test(s)),
);

/** DDD sem zero (11 a 99) + 8 ou 9 dígitos. Aceita a máscara; guarda só os dígitos. */
const telefone = z.pipe(
  z.pipe(
    z.string().check(
      z.maxLength(32, { abort: true }),
      z.refine((s: string) => /^[\d\s()-]+$/.test(s)),
    ),
    z.transform((s: string) => s.replace(/\D/g, '')),
  ),
  z.string().check(z.regex(/^[1-9][1-9]\d{8,9}$/)),
);

/** Aceita CEP com ou sem hífen (até 9 caracteres); a saída é o `Cep` de 8 dígitos. */
const cep = z.pipe(
  z.pipe(
    z.string().check(z.maxLength(9, { abort: true })),
    z.transform((s: string) => normalizarCep(s)),
  ),
  z.custom<Cep>((v) => v !== null),
);

// --- Data de entrega (America/Sao_Paulo) ------------------------------------------------------

function somarDias(ymd: string, dias: number): string {
  const [a = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** "AAAA-MM-DD" de hoje no fuso de São Paulo, qualquer que seja o fuso do servidor. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${pegar('year')}-${pegar('month')}-${pegar('day')}`;
}

/** De amanhã até +60 dias, inclusive (P34). Serve para o `min`/`max` do `<input type="date">`. */
export function intervaloDeEntrega(agora: Date = new Date()): { min: string; max: string } {
  const hoje = hojeEmSaoPaulo(agora);
  return { min: somarDias(hoje, 1), max: somarDias(hoje, DIAS_MAXIMOS_DA_ENTREGA) };
}

function ehDataValida(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [a = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
}

const dataDeEntrega = z.string().check(
  z.maxLength(10, { abort: true }),
  z.refine((s: string) => {
    if (!ehDataValida(s)) return false;
    const { min, max } = intervaloDeEntrega(); // lê o relógio na hora da validação
    return s >= min && s <= max;
  }),
);

// --- Esquemas ---------------------------------------------------------------------------------

export const esquemaCliente = z.object({
  nome: texto(2, 100, { exigeLetraOuNumero: true }),
  email,
  telefone,
});

export const esquemaEndereco = z.object({
  cep,
  logradouro: texto(1, 120, { exigeLetraOuNumero: true }),
  numero: texto(1, 10),
  complemento: z.optional(texto(0, 60)),
  bairro: texto(1, 60, { exigeLetraOuNumero: true }),
  cidade: texto(1, 60, { exigeLetraOuNumero: true }),
  uf: z.enum(UFS),
});

export const esquemaPresente = z.object({
  mensagem: texto(0, TAMANHO_MAXIMO_DA_MENSAGEM, { multilinha: true }),
  dataDeEntrega,
});

/** Cliente + endereço + presente (`null` se o pedido não for presente). */
export const esquemaEntrega = z.object({
  cliente: esquemaCliente,
  endereco: esquemaEndereco,
  presente: z.nullable(esquemaPresente),
});

export const esquemaPagamento = z.enum(['pix', 'cartao']);

/** Item como o servidor o aceita: quantidade inteira de 1 a 10, sem "consertar" em silêncio. */
export const esquemaItemDoPedido = z.object({
  slug: z.string().check(z.maxLength(TAMANHO_MAXIMO_DO_ID)),
  formatoId: z.string().check(z.maxLength(TAMANHO_MAXIMO_DO_ID)),
  quantidade: z.int().check(z.minimum(1), z.maximum(QUANTIDADE_MAXIMA_POR_ITEM)),
});

export const esquemaEntradaDoPedido = z.object({
  // ATENÇÃO: o Zod valida os ELEMENTOS antes de conferir `maxLength(30)`, então um array gigante
  // seria percorrido inteiro antes de ser recusado. A pré-checagem de `itens.length` (tarefa 13,
  // antes de chamar `safeParse`) é OBRIGATÓRIA; este limite é só a segunda barreira.
  itens: z.array(esquemaItemDoPedido).check(z.minLength(1), z.maxLength(MAXIMO_DE_LINHAS)),
  presente: z.boolean(),
  entrega: esquemaEntrega,
  pagamento: esquemaPagamento,
});

export type EntradaDoPedido = z.infer<typeof esquemaEntradaDoPedido>;
export type Entrega = z.infer<typeof esquemaEntrega>;
export type ItemDoPedido = z.infer<typeof esquemaItemDoPedido>;

// --- Erros ------------------------------------------------------------------------------------

const CAMPOS: ReadonlySet<string> = new Set<CampoDoCheckout>(
  Object.keys(MENSAGENS_DE_ERRO) as CampoDoCheckout[],
);

/** Campos que a etapa de entrega exige (para o caso de a entrada nem ser um objeto). */
const CAMPOS_OBRIGATORIOS_DA_ENTREGA: readonly CampoDoCheckout[] = [
  'nome',
  'email',
  'telefone',
  'cep',
  'logradouro',
  'numero',
  'bairro',
  'cidade',
  'uf',
];

/**
 * Quando o problema está no OBJETO inteiro (ex.: `cliente: null`), o último trecho do `path` é o
 * nome do grupo, não de um campo. Cada grupo vira os seus campos (nunca um erro genérico).
 */
const CAMPOS_POR_GRUPO: ReadonlyMap<string, readonly CampoDoCheckout[]> = new Map([
  ['cliente', ['nome', 'email', 'telefone']],
  ['endereco', ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf']],
  ['presente', ['mensagem', 'dataDeEntrega']],
  ['entrega', CAMPOS_OBRIGATORIOS_DA_ENTREGA],
]);

/**
 * Converte os problemas do Zod em `{ campo: mensagem fixa }`. Usa só o ÚLTIMO trecho do `path`:
 * se estiver na lista fixa de `CampoDoCheckout`, é o campo; se for `cliente`, `endereco`,
 * `presente` ou `entrega`, vale para os campos do grupo. Ignora `message`, `input` e o resto.
 * Problemas fora disso (ex.: `itens`) ficam de fora: quem chama decide (ex.: `sacola-invalida`).
 */
export function errosDoCheckout(
  problemas: readonly { readonly path: readonly PropertyKey[] }[],
): Partial<Record<CampoDoCheckout, string>> {
  const erros: Partial<Record<CampoDoCheckout, string>> = {};
  for (const { path } of problemas) {
    const ultimo = path[path.length - 1];
    if (typeof ultimo !== 'string') continue;
    const campos = CAMPOS.has(ultimo)
      ? [ultimo as CampoDoCheckout]
      : (CAMPOS_POR_GRUPO.get(ultimo) ?? []);
    for (const campo of campos) erros[campo] ??= MENSAGENS_DE_ERRO[campo];
  }
  return erros;
}

/** Nunca lança. Erros só com chaves de `CampoDoCheckout` e valores de `MENSAGENS_DE_ERRO`. */
export function validarEntrega(
  bruto: unknown,
): { ok: true; valor: Entrega } | { ok: false; erros: Partial<Record<CampoDoCheckout, string>> } {
  try {
    const resultado = z.safeParse(esquemaEntrega, bruto);
    if (resultado.success) return { ok: true, valor: resultado.data };
    const erros = errosDoCheckout(resultado.error.issues);
    if (Object.keys(erros).length > 0) return { ok: false, erros };
  } catch {
    // cai no retorno genérico abaixo
  }
  const erros: Partial<Record<CampoDoCheckout, string>> = {};
  for (const campo of CAMPOS_OBRIGATORIOS_DA_ENTREGA) erros[campo] = MENSAGENS_DE_ERRO[campo];
  return { ok: false, erros };
}
