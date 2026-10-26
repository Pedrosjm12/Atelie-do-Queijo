export interface PropsDaIlustracao {
  /** Classe opcional para posicionamento pelo componente que usa a ilustração. */
  className?: string;
  /**
   * Quando o contexto já descreve o queijo (por exemplo, o nome ao lado), a ilustração
   * é decorativa: sai `role="img"` e o rótulo, entra `aria-hidden`.
   */
  decorativa?: boolean;
}

/** Atributos de acessibilidade do Apêndice A, ou `aria-hidden` se decorativa. */
export function atributosDeAcessibilidade(rotulo: string, decorativa?: boolean) {
  return decorativa
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': rotulo } as const);
}
