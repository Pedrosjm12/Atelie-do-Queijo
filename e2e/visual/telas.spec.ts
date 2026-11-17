import { expect, test, type Page } from '../_apoio/teste';
import { semearSacola } from '../_apoio/checkout';
import { estabilizar, fixarRelogio, ocultarFixos } from '../_apoio/visual';

/**
 * Regressão visual (etapa 8, tarefa 19). As imagens de referência são do Linux e só valem na imagem
 * Docker oficial do Playwright: gere e confira com `npm run test:visual:docker`.
 */

const TAMANHOS = [
  { sufixo: '1440', viewport: { width: 1440, height: 900 } },
  { sufixo: '390', viewport: { width: 390, height: 844 } },
] as const;

const painel = (page: Page) => page.getByRole('dialog', { name: 'Assistente do Ateliê' });

type Tela = {
  nome: string;
  rota: string;
  /** Prepara o estado antes de navegar (ex.: sacola semeada). */
  antes?: (page: Page) => Promise<void>;
  /** Depois de estabilizar: interage até o estado a capturar. */
  depois?: (page: Page) => Promise<void>;
  paginaInteira?: boolean;
};

const telas: Tela[] = [
  { nome: 'home', rota: '/' },
  { nome: 'catalogo', rota: '/queijos' },
  { nome: 'produto-canastra', rota: '/queijos/canastra-curado' },
  {
    // Estado do protótipo (§8.2): conversa até "Ver outras opções"; só o painel, em tela cheia.
    nome: 'atendimento',
    rota: '/',
    paginaInteira: false,
    depois: async (page) => {
      await page.getByRole('button', { name: 'Abrir atendimento' }).click();
      const campo = painel(page).getByLabel('Escreva sua mensagem');
      await campo.fill('Quero presentear alguém que adora vinho tinto.');
      await campo.press('Enter');
      await expect(painel(page).getByRole('button', { name: 'Ver outras opções' })).toBeVisible();
    },
  },
  { nome: 'sacola', rota: '/sacola', antes: (page) => semearSacola(page) },
  { nome: 'checkout-etapa-1', rota: '/checkout', antes: (page) => semearSacola(page) },
  { nome: 'presentes', rota: '/presentes' },
  { nome: 'aprenda', rota: '/aprenda' },
  { nome: 'artigo', rota: '/aprenda/como-montar-uma-tabua-de-queijos' },
  { nome: 'produtores', rota: '/produtores' },
  { nome: '404', rota: '/esta-pagina-nao-existe' },
];

for (const { sufixo, viewport } of TAMANHOS) {
  test.describe(`${sufixo} px`, () => {
    test.use({ viewport });

    for (const tela of telas) {
      test(`${tela.nome}`, async ({ page }) => {
        await fixarRelogio(page);
        await tela.antes?.(page);
        await page.goto(tela.rota);
        await estabilizar(page);
        await tela.depois?.(page);
        if (tela.paginaInteira ?? true) await ocultarFixos(page);

        await expect(page).toHaveScreenshot(`${tela.nome}-${sufixo}.png`, {
          fullPage: tela.paginaInteira ?? true,
        });
      });
    }
  });
}
