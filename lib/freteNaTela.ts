// Textos e auxiliares de tela que a calculadora de frete do produto e o checkout compartilham.
// Sem Zod e sem servidor: seguro para o pacote do navegador.

export const MENSAGEM_DE_FRETE_INDISPONIVEL =
  'Não conseguimos calcular agora. Tente de novo em instantes.';
export const MENSAGEM_FORA_DE_AREA =
  'Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.';

export function textoDoPrazo(prazo: number | null): string {
  if (prazo === null) return 'Chega refrigerado em até [N] dias úteis.';
  return `Chega refrigerado em até ${prazo} ${prazo === 1 ? 'dia útil' : 'dias úteis'}.`;
}
