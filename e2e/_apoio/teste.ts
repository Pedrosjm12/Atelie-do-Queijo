import { test as base, type Page } from '@playwright/test';
import { ehViolacaoDeCsp } from './csp';

/**
 * `test` dos specs: igual ao do Playwright, mas `page.goto` e `page.reload` só devolvem depois de
 * o React hidratar a página. O app marca `<html data-hidratado>` num efeito de `FocoNoConteudo`
 * (layout raiz), que só roda após a hidratação. Sem isso, sob carga o teste clica ou aperta Tab
 * antes de os handlers existirem e falha de forma esporádica.
 */
const semEspera = new WeakSet<Page>();

/** Para testes que provam o comportamento ANTES da hidratação (ex.: JavaScript bloqueado). */
export function semAguardarHidratacao(page: Page) {
  semEspera.add(page);
}

/** Espera o React hidratar. Use depois de `goto` em páginas criadas fora da fixture `page`. */
export async function aguardarHidratacao(page: Page) {
  await page
    .waitForFunction(() => document.documentElement.hasAttribute('data-hidratado'), undefined, {
      timeout: 15_000,
    })
    .catch((erro: unknown) => {
      throw new Error('a página não hidratou (data-hidratado ausente)', { cause: erro });
    });
}

async function hidratada(page: Page) {
  if (semEspera.has(page)) return;
  await aguardarHidratacao(page);
}

export const test = base.extend<{ vigiaDeCsp: void }>({
  // Automática: nenhum e2e pode registrar violação de CSP no console.
  vigiaDeCsp: [
    async ({ page }, usar) => {
      const violacoes: string[] = [];
      page.on('console', (m) => {
        if (ehViolacaoDeCsp(m.text())) violacoes.push(m.text());
      });
      await usar();
      if (violacoes.length > 0) {
        throw new Error(['violação de CSP no console:', ...violacoes].join('\n'));
      }
    },
    { auto: true },
  ],
  page: async ({ page }, usar) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args: Parameters<Page['goto']>) => {
      const resposta = await goto(...args);
      await hidratada(page);
      return resposta;
    };
    page.reload = async (...args: Parameters<Page['reload']>) => {
      const resposta = await reload(...args);
      await hidratada(page);
      return resposta;
    };
    await usar(page);
  },
});

export { expect } from '@playwright/test';
