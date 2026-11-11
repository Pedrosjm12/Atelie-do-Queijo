/** Mensagem do Chrome para violação de CSP (ADR-0015): "Refused to ... Content Security Policy". Sem dependência do Playwright. */
export const ehViolacaoDeCsp = (texto: string): boolean =>
  /Content Security Policy|violates the following|Refused to (execute|load|apply|connect|frame|send)/i.test(
    texto,
  );
