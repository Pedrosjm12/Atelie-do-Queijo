import type { Page } from '@playwright/test';

/**
 * Aviso do Chrome, não do app: o Next emite `<link rel=preload as=style>` para o CSS de outras
 * rotas (not-found, páginas prefetchadas pelos links) e o Chrome reclama se a página fica aberta
 * por mais de ~3 s sem usá-los. Só aparece quando o teste demora (máquina sob carga). Filtra só
 * esse aviso, e só para CSS de `/_next/static/`; qualquer outro aviso ou erro continua falhando.
 */
const ehAvisoDePreloadDoNext = (texto: string) =>
  /^The resource \S*\/_next\/static\/\S+\.css was preloaded using link preload but not used/.test(
    texto,
  );

/** Coleta erros e avisos do console e da página; o teste confere `toEqual([])` no fim. */
export function vigiarConsole(page: Page): string[] {
  const problemas: string[] = [];
  page.on('console', (m) => {
    const tipo = m.type();
    if (tipo === 'warning' && ehAvisoDePreloadDoNext(m.text())) return;
    if (tipo === 'error' || tipo === 'warning') problemas.push(m.text());
  });
  page.on('pageerror', (e) => problemas.push(e.message));
  return problemas;
}
