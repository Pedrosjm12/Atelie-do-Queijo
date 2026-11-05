import type { Page } from '@playwright/test';

/** Coleta erros e avisos do console e da página; o teste confere `toEqual([])` no fim. */
export function vigiarConsole(page: Page): string[] {
  const problemas: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problemas.push(m.text());
  });
  page.on('pageerror', (e) => problemas.push(e.message));
  return problemas;
}
