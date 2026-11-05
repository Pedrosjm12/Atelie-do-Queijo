/**
 * Horário do atendimento humano (spec §8.2, §8.3 e §10.5; ADR-0010). Separado de `lib/whatsapp.ts`
 * (ADR-0012): só o painel de atendimento, carregado sob demanda, usa o horário; os links do
 * WhatsApp ficam no pacote das páginas.
 */

// --- Horário ----------------------------------------------------------------------------------

export const FUSO_DO_ATENDIMENTO = 'America/Sao_Paulo';

/** Minutos desde 0h, intervalo meio aberto `[abre, fecha)`. */
export type IntervaloDoDia = Readonly<{ abre: number; fecha: number }>;

const MINUTOS_POR_HORA = 60;

/**
 * Seg a sex 9h–18h, sáb 9h–15h, domingo fechado (§8.3). Índice 0 = domingo; `null` = fechado.
 * Feriados não contam (pendência P50, decidido em 2026-11-03): para tratá-los, some aqui uma
 * tabela de datas e consulte-a em `atendimentoHumanoAberto`.
 */
export const HORARIO_DO_ATENDIMENTO: Readonly<
  [
    IntervaloDoDia | null,
    IntervaloDoDia | null,
    IntervaloDoDia | null,
    IntervaloDoDia | null,
    IntervaloDoDia | null,
    IntervaloDoDia | null,
    IntervaloDoDia | null,
  ]
> = [
  null,
  { abre: 9 * MINUTOS_POR_HORA, fecha: 18 * MINUTOS_POR_HORA },
  { abre: 9 * MINUTOS_POR_HORA, fecha: 18 * MINUTOS_POR_HORA },
  { abre: 9 * MINUTOS_POR_HORA, fecha: 18 * MINUTOS_POR_HORA },
  { abre: 9 * MINUTOS_POR_HORA, fecha: 18 * MINUTOS_POR_HORA },
  { abre: 9 * MINUTOS_POR_HORA, fecha: 18 * MINUTOS_POR_HORA },
  { abre: 9 * MINUTOS_POR_HORA, fecha: 15 * MINUTOS_POR_HORA },
];

const DIA_DA_SEMANA: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Criado uma vez: o fuso é explícito, então não depende da máquina nem do momento. */
const FORMATADOR_DO_ATENDIMENTO = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_DO_ATENDIMENTO,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * `true` se a cave atende na hora `agora` (padrão: agora). Dia da semana, hora e minuto são lidos
 * com `Intl.DateTimeFormat` no fuso de São Paulo, qualquer que seja o fuso da máquina. `hourCycle:
 * 'h23'` evita o "24" da meia-noite de `hour12: false` em alguns motores.
 */
export function atendimentoHumanoAberto(agora: Date = new Date()): boolean {
  if (Number.isNaN(agora.getTime())) return false;
  const partes = FORMATADOR_DO_ATENDIMENTO.formatToParts(agora);
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value;

  const diaTexto = pegar('weekday');
  const horaTexto = pegar('hour');
  const minutoTexto = pegar('minute');
  if (diaTexto === undefined || !horaTexto || !minutoTexto) return false;

  const dia = DIA_DA_SEMANA[diaTexto];
  const hora = Number(horaTexto) % 24;
  const minuto = Number(minutoTexto);
  if (dia === undefined || Number.isNaN(hora) || Number.isNaN(minuto)) return false;

  const intervalo = HORARIO_DO_ATENDIMENTO[dia];
  if (!intervalo) return false;
  const minutos = hora * MINUTOS_POR_HORA + minuto;
  return minutos >= intervalo.abre && minutos < intervalo.fecha;
}

/** Linha do horário na faixa de passagem e na aba do queijista (§8.2). */
export const TEXTO_DO_HORARIO = 'Seg a sex, 9h às 18h · sáb, 9h às 15h';

/** Mensagem de cave fechada (§8.3). */
export const TEXTO_DA_CAVE_FECHADA =
  'Nossa cave está fechada agora. Atendemos de segunda a sexta, das 9h às 18h, e aos sábados, das 9h às 15h. Se preferir, o Assistente do Ateliê responde na hora pelo site.';
