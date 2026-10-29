/** Ids estáveis: só há um checkout por página, e o resumo de erros liga a eles. */
export const ID_DO_TITULO_DO_CHECKOUT = 'titulo-do-checkout';

export function idDoCampo(campo: string): string {
  return `checkout-${campo}`;
}

/** Título (h2) da etapa em curso: recebe o foco ao trocar de etapa e nomeia a região. */
export const ID_DO_TITULO_DA_ETAPA = 'titulo-da-etapa';
