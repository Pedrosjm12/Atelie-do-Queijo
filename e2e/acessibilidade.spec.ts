import type { Page } from '@playwright/test';
import { expect, test } from './_apoio/teste';
import { conferirAcessibilidade } from './_apoio/acessibilidade';
import { DADOS, campo, semearSacola } from './_apoio/checkout';

/**
 * Varredura com axe (tarefa 10 da etapa 8) em todas as rotas e estados do plano, a 1440 e a 390 px.
 * Roda no build de produção, depois do gate de hidratação da fixture.
 */

const LARGURAS = [
  { largura: 1440, altura: 900 },
  { largura: 390, altura: 844 },
] as const;

/**
 * Achados conhecidos, sem correção. Hoje vazio; use só com decisão do dono registrada. Chave:
 * `<cenário>@<largura>`; valor: a explicação. Um caso aqui é executado com `test.fail`: se o
 * achado sumir, o teste falha e avisa para remover a linha daqui.
 */
const ACHADOS_CONHECIDOS: Readonly<Record<string, string>> = {};

type Cenario = { nome: string; preparar: (page: Page, largura: number) => Promise<void> };

const painel = (page: Page) => page.getByRole('dialog', { name: 'Assistente do Ateliê' });
const abrirPainel = (page: Page) => page.getByRole('button', { name: 'Abrir atendimento' }).click();

async function preencherEntrega(page: Page, email: string) {
  await campo(page, 'Nome completo').fill(DADOS.nome);
  await campo(page, 'E-mail').fill(email);
  await campo(page, 'Telefone').fill(DADOS.telefone);
  await campo(page, 'CEP').fill(DADOS.cep);
  await campo(page, 'Rua ou avenida').fill(DADOS.logradouro);
  await campo(page, 'Número').fill(DADOS.numero);
  await campo(page, 'Bairro').fill(DADOS.bairro);
  await campo(page, 'Cidade').fill(DADOS.cidade);
  await campo(page, 'Estado').selectOption('SP');
  await expect(page.getByText('Chega refrigerado em até 3 dias úteis.')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();
}

async function irParaPagamento(page: Page, email: string = DADOS.email) {
  await semearSacola(page);
  await page.goto('/checkout');
  await preencherEntrega(page, email);
}

const escolherPix = (page: Page) =>
  page.locator('label').filter({ hasText: 'Pix (5% de desconto)' }).click();

const rotas = (...lista: [string, string][]): Cenario[] =>
  lista.map(([nome, rota]) => ({
    nome,
    preparar: async (page) => {
      await page.goto(rota);
    },
  }));

const abaDoQueijista = (page: Page) =>
  painel(page).getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });

const CENARIOS: Cenario[] = [
  ...rotas(
    ['Home', '/'],
    ['catálogo', '/queijos'],
    ['catálogo filtrado por origem Brasil', '/queijos?origem=brasil'],
    ['produto Canastra curado', '/queijos/canastra-curado'],
    ['produto Brie francês (ficha em lacuna)', '/queijos/brie-frances'],
    ['sacola vazia', '/sacola'],
  ),
  {
    nome: 'sacola com um item',
    preparar: async (page) => {
      await semearSacola(page);
      await page.goto('/sacola');
      await expect(page.getByRole('link', { name: 'Finalizar compra' })).toBeVisible();
    },
  },
  {
    nome: 'sacola com um item e embalagem para presente',
    preparar: async (page) => {
      await semearSacola(page, true);
      await page.goto('/sacola');
      await expect(page.getByText('Embalagem para presente')).toBeVisible();
    },
  },
  {
    nome: 'checkout, etapa 1 com o resumo de erros',
    preparar: async (page) => {
      await semearSacola(page);
      await page.goto('/checkout');
      await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
      await expect(page.getByRole('region', { name: 'Revise os campos abaixo' })).toBeVisible();
    },
  },
  {
    nome: 'checkout, etapa 2 (pagamento)',
    preparar: async (page) => {
      await irParaPagamento(page);
    },
  },
  {
    nome: 'checkout, confirmação',
    preparar: async (page) => {
      await irParaPagamento(page);
      await escolherPix(page);
      await page.getByRole('button', { name: 'Confirmar pedido' }).click();
      await expect(
        page.getByRole('heading', { level: 2, name: 'Seu queijo já está sendo preparado.' }),
      ).toBeFocused();
    },
  },
  {
    nome: 'checkout, erro de pagamento',
    preparar: async (page) => {
      await irParaPagamento(page, 'recusa@exemplo.com');
      await escolherPix(page);
      await page.getByRole('button', { name: 'Confirmar pedido' }).click();
      await expect(page.locator('form [role="alert"]')).toContainText(
        'Não conseguimos confirmar o pagamento.',
      );
    },
  },
  ...rotas(
    ['Presentes', '/presentes'],
    ['Aprenda', '/aprenda'],
    ['artigo Queijo e vinho', '/aprenda/queijo-e-vinho'],
    ['Produtores', '/produtores'],
    ['404', '/nao-existe'],
  ),
  {
    nome: 'painel aberto, Assistente no início',
    preparar: async (page) => {
      await page.goto('/');
      await abrirPainel(page);
      await expect(painel(page)).toBeVisible();
    },
  },
  {
    nome: 'painel aberto, Assistente no estado do protótipo (§8.2)',
    preparar: async (page) => {
      await page.goto('/');
      await abrirPainel(page);
      const campoDeTexto = painel(page).getByLabel('Escreva sua mensagem');
      await campoDeTexto.fill('Quero presentear alguém que adora vinho tinto.');
      await campoDeTexto.press('Enter');
      await expect(painel(page).getByRole('button', { name: 'Ver outras opções' })).toBeVisible();
    },
  },
  {
    nome: 'painel aberto, Queijista dentro do horário',
    preparar: async (page) => {
      await page.clock.setFixedTime(new Date('2026-11-10T10:00:00-03:00'));
      await page.goto('/');
      await abrirPainel(page);
      await painel(page).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
      await expect(abaDoQueijista(page)).toBeVisible();
    },
  },
  {
    nome: 'painel aberto, Queijista com a cave fechada',
    preparar: async (page) => {
      await page.clock.setFixedTime(new Date('2026-11-08T11:00:00-03:00'));
      await page.goto('/');
      await abrirPainel(page);
      await painel(page).getByRole('tab', { name: 'Queijista (WhatsApp)' }).click();
      await expect(abaDoQueijista(page)).toBeVisible();
    },
  },
  {
    nome: 'menu do celular aberto',
    preparar: async (page, largura) => {
      test.skip(largura > 768, 'o botão Menu só existe no celular');
      await page.goto('/');
      const botao = page.getByRole('button', { name: 'Menu' });
      await botao.click();
      await expect(botao).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
    },
  },
  {
    nome: 'resultado do quiz da Home',
    preparar: async (page) => {
      await page.goto('/');
      const quiz = page.locator('#quiz');
      await quiz.getByRole('button', { name: 'Intensos e marcantes' }).click();
      await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
      await quiz.getByRole('button', { name: 'Para mim, com calma' }).click();
      await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
      await quiz.getByRole('button', { name: 'Vinho tinto' }).click();
      await quiz.getByRole('button', { name: 'Ver meu queijo' }).click();
      await expect(quiz.getByText('SEU QUEIJO É')).toBeVisible();
    },
  },
  {
    nome: 'aviso "Adicionado à sacola. Boa escolha." visível',
    preparar: async (page) => {
      // O aviso expira em 4 s (P26) e a varredura não pode pegar o fade de saída. O relógio
      // pausado trava o axe, então só o temporizador de 4 s do aviso é descartado nesta página.
      await page.addInitScript(() => {
        const original = window.setTimeout.bind(window);
        window.setTimeout = ((tratador: TimerHandler, atraso?: number, ...args: unknown[]) =>
          atraso === 4000 ? 0 : original(tratador, atraso, ...args)) as typeof window.setTimeout;
      });
      await page.goto('/queijos');
      await page.getByRole('button', { name: 'Adicionar Canastra curado à sacola' }).click();
      const aviso = page.locator('[data-aviso-da-sacola]');
      await expect(aviso).toHaveText('Adicionado à sacola. Boa escolha.');
      // Espera a transição de opacidade terminar: o axe mede o contraste com a opacidade final.
      await expect
        .poll(() => aviso.evaluate((el) => getComputedStyle(el).opacity), { timeout: 3_000 })
        .toBe('1');
      await expect(aviso).toHaveText('Adicionado à sacola. Boa escolha.');
    },
  },
];

test.describe('acessibilidade automatizada (axe, WCAG 2.2 AA)', () => {
  for (const { largura, altura } of LARGURAS) {
    for (const cenario of CENARIOS) {
      const chave = `${cenario.nome}@${largura}`;
      const conhecido = ACHADOS_CONHECIDOS[chave];
      const registrar = conhecido ? test.fail : test;

      registrar(`${cenario.nome} a ${largura} px não tem violações`, async ({ page }) => {
        if (conhecido) test.info().annotations.push({ type: 'achado', description: conhecido });
        await page.setViewportSize({ width: largura, height: altura });
        await cenario.preparar(page, largura);
        await conferirAcessibilidade(page);
      });
    }
  }
});

test.describe('exceção do axe é estreita', () => {
  test('contraste ruim fora de [data-foto-pendente] ainda falha; dentro dele passa', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/queijos');
    const inserir = (extra: string) =>
      page.evaluate((atributos) => {
        const no = document.createElement('p');
        no.id = 'contraste-ruim';
        no.textContent = 'Texto de contraste ruim';
        no.style.cssText = 'color:#8c8070;background:#2a2420;position:relative;z-index:99';
        if (atributos) no.setAttribute(atributos, '');
        document.body.prepend(no);
      }, extra);

    await inserir('');
    await expect(conferirAcessibilidade(page)).rejects.toThrow(/color-contrast/);

    await page.evaluate(() => document.getElementById('contraste-ruim')?.remove());
    await inserir('data-foto-pendente');
    await conferirAcessibilidade(page);
  });
});
