import type { Page } from '@playwright/test';

/** Prefetch (`?_rsc=`) de rotas que ainda não existem (etapas 4 e 7): 404 esperado.
 * Remover da lista cada rota quando ela for criada (blocos D/E do plano). */
const ROTA_AINDA_INEXISTENTE = /\/(checkout|presentes|aprenda|produtores)(\/|\?|$)/;

/** Coleta erros e avisos do console e da página; o teste confere `toEqual([])` no fim. */
export function vigiarConsole(page: Page): string[] {
  const problemas: string[] = [];
  page.on('console', (m) => {
    const { url } = m.location();
    const prefetchDeRotaInexistente =
      m.text().startsWith('Failed to load resource') &&
      m.text().includes('404') &&
      url.includes('_rsc=') &&
      ROTA_AINDA_INEXISTENTE.test(url);
    if (prefetchDeRotaInexistente) return;
    if (m.type() === 'error' || m.type() === 'warning') problemas.push(m.text());
  });
  page.on('pageerror', (e) => problemas.push(e.message));
  return problemas;
}
