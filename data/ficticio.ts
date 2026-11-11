/**
 * ÚNICO lugar com os dados de negócio FICTÍCIOS (decisões D26 a D29 do dono, 2026-11-03).
 * Nenhum valor daqui é real e nenhum pode ir para produção: o dono troca tudo antes da publicação
 * (item do checklist de aceite da etapa 9). Ver o aviso em docs/PLANO.md.
 * Só importa tipos (apagados na compilação): seguro para o servidor, o navegador e o `next.config.ts`.
 */

import type { Centavos } from '../lib/dinheiro';

// --- Trava de produção -------------------------------------------------------------------------

/**
 * Enquanto houver qualquer dado fictício neste arquivo, fica `true`. O `next.config.ts` faz o build
 * FALHAR com `VERCEL_ENV === 'production'` e este valor `true`. O dono remove a trava (e esta
 * constante) ao trocar os dados reais (checklist da etapa 9).
 */
// FICTÍCIO: substituir antes da publicação
export const DADOS_FICTICIOS_ATIVOS = true;

/** Lança erro em português se um build de produção (Vercel) tentar usar dados fictícios. */
export function exigirSemDadosFicticiosEmProducao(
  ambiente: string | undefined,
  ficticiosAtivos: boolean = DADOS_FICTICIOS_ATIVOS,
): void {
  if (ambiente === 'production' && ficticiosAtivos) {
    throw new Error(
      'Build de produção bloqueado: data/ficticio.ts ainda tem dados fictícios (WhatsApp, CNPJ, endereço, frete, parcelas, produtor). Troque pelos dados reais e remova DADOS_FICTICIOS_ATIVOS e esta trava.',
    );
  }
}

/** Variáveis que decidem se os dados fictícios podem ser usados (P74 = B). */
export interface AmbienteDosFicticios {
  NODE_ENV?: string | undefined;
  VERCEL_ENV?: string | undefined;
  PERMITIR_DADOS_FICTICIOS?: string | undefined;
}

function ambienteAtual(): AmbienteDosFicticios {
  return {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    PERMITIR_DADOS_FICTICIOS: process.env.PERMITIR_DADOS_FICTICIOS,
  };
}

/**
 * Verdadeiro em `next dev` (NODE_ENV=development), no Vitest (NODE_ENV=test) ou com
 * `PERMITIR_DADOS_FICTICIOS=1`; NUNCA com `VERCEL_ENV=production`.
 */
export function dadosFicticiosPermitidos(
  ambiente: AmbienteDosFicticios = ambienteAtual(),
): boolean {
  if (ambiente.VERCEL_ENV === 'production') return false;
  return (
    ambiente.NODE_ENV === 'development' ||
    ambiente.NODE_ENV === 'test' ||
    ambiente.PERMITIR_DADOS_FICTICIOS === '1'
  );
}

/**
 * Trava de `next build` (qualquer ambiente): com dados fictícios ativos e sem permissão, falha dizendo
 * o que definir. IGNORA `NODE_ENV` (o `next build` aceita `test` e `development`): na fase de build só
 * vale `PERMITIR_DADOS_FICTICIOS=1`. Com `VERCEL_ENV=production` não faz nada: a trava `exigirSemDadosFicticiosEmProducao`
 * (também no `next.config.ts`) já cobre, com a mensagem de produção.
 */
export function exigirDadosFicticiosPermitidos(
  ambiente: AmbienteDosFicticios = ambienteAtual(),
  ficticiosAtivos: boolean = DADOS_FICTICIOS_ATIVOS,
): void {
  if (!ficticiosAtivos || dadosFicticiosPermitidos({ ...ambiente, NODE_ENV: 'production' })) return;
  if (ambiente.VERCEL_ENV === 'production') return;
  throw new Error(
    'Build bloqueado: data/ficticio.ts ainda tem dados fictícios (WhatsApp, CNPJ, endereço, frete, parcelas, produtor). Para buildar localmente ou na CI, defina PERMITIR_DADOS_FICTICIOS=1 (no .env.local, no ambiente do comando ou, na Vercel, só em Preview; nunca em Production). Para publicar, troque os dados pelos reais e remova DADOS_FICTICIOS_ATIVOS.',
  );
}

// --- WhatsApp (spec §8.3: formato internacional, só dígitos) ----------------------------------

// FICTÍCIO: substituir antes da publicação (DDD 20 não existe: o número não pode ser de ninguém)
export const NUMERO_WHATSAPP_FICTICIO = '5520900000000';

// --- Rodapé (spec §4.9) -----------------------------------------------------------------------

// FICTÍCIO: substituir antes da publicação
export const CNPJ_FICTICIO = '00.000.000/0001-00';

// FICTÍCIO: substituir antes da publicação
export const ENDERECO_FICTICIO = 'Rua Exemplo, 123, São Paulo, SP';

// --- Pagamento ----------------------------------------------------------------------------------

// FICTÍCIO: substituir antes da publicação
export const PARCELAS_SEM_JUROS_FICTICIAS = 3;

// --- Frete (tabela simulada por faixa de CEP; faixas atendidas definidas em calcularFrete) -----

export interface FaixaDeFrete {
  /** Primeiro CEP da faixa (8 dígitos, como número), inclusive. */
  de: number;
  /** Último CEP da faixa, inclusive. */
  ate: number;
  /** Prazo em dias úteis. */
  prazoDiasUteis: number;
  /** Valor em centavos para pedidos abaixo de R$ 180 (a partir disso o frete é grátis). */
  valor: Centavos;
}

// FICTÍCIO: substituir antes da publicação
export const FAIXAS_DE_FRETE_FICTICIAS: readonly FaixaDeFrete[] = [
  { de: 1_000_000, ate: 19_999_999, prazoDiasUteis: 3, valor: 2490 },
  { de: 20_000_000, ate: 39_999_999, prazoDiasUteis: 4, valor: 3290 },
  { de: 40_000_000, ate: 99_999_999, prazoDiasUteis: 5, valor: 4590 },
];

// --- Produtor do Canastra (spec §7.3) ----------------------------------------------------------

// FICTÍCIO: substituir antes da publicação
export const PRODUTOR_CANASTRA_FICTICIO = 'Produtor Exemplo';

// FICTÍCIO: substituir antes da publicação
export const ANO_PRODUTOR_CANASTRA_FICTICIO = '1985';
