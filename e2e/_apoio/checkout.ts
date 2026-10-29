import type { Locator, Page } from '@playwright/test';

export const CHAVE_DA_SACOLA = 'atelie:sacola:v1';

/** Dados digitados nos testes: nenhum deles pode aparecer na URL, no storage nem em cookies. */
export const DADOS = {
  nome: 'Maria Souza',
  email: 'maria.souza@exemplo.com',
  telefone: '11912345678',
  cep: '01310100',
  logradouro: 'Avenida Paulista',
  numero: '1578',
  bairro: 'Bela Vista',
  cidade: 'Sao Paulo',
} as const;

/** Põe um Brie na sacola (e, se pedido, marca como presente) antes de a página carregar. */
export async function semearSacola(page: Page, presente = false) {
  await page.addInitScript(
    ([chave, marcado]) => {
      window.localStorage.setItem(
        chave as string,
        JSON.stringify({
          v: 1,
          itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }],
          presente: marcado,
        }),
      );
    },
    [CHAVE_DA_SACOLA, presente] as const,
  );
}

export const campo = (page: Page, nome: string) => page.getByLabel(nome, { exact: true });

/** Tab até o elemento receber o foco (falha se passar de 60 teclas). */
export async function tabAte(page: Page, alvo: Locator) {
  for (let i = 0; i < 60; i++) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('O foco não chegou ao elemento com Tab.');
}

/** Preenche a etapa 1 usando só o teclado (Tab para chegar, digitar para preencher). */
export async function preencherComTeclado(page: Page) {
  await tabAte(page, campo(page, 'Nome completo'));
  await page.keyboard.type(DADOS.nome);
  await tabAte(page, campo(page, 'E-mail'));
  await page.keyboard.type(DADOS.email);
  await tabAte(page, campo(page, 'Telefone'));
  await page.keyboard.type(DADOS.telefone);
  await tabAte(page, campo(page, 'CEP'));
  await page.keyboard.type(DADOS.cep);
  await tabAte(page, campo(page, 'Rua ou avenida'));
  await page.keyboard.type(DADOS.logradouro);
  await tabAte(page, campo(page, 'Número'));
  await page.keyboard.type(DADOS.numero);
  await tabAte(page, campo(page, 'Bairro'));
  await page.keyboard.type(DADOS.bairro);
  await tabAte(page, campo(page, 'Cidade'));
  await page.keyboard.type(DADOS.cidade);
  await tabAte(page, campo(page, 'Estado'));
  await page.keyboard.type('SP');
}
