import type { Locator, Page } from '@playwright/test';
import { expect, test } from './_apoio/teste';
import { DADOS, campo, semearSacola, tabAte } from './_apoio/checkout';

/**
 * Teclado (tarefa 12 da etapa 8): ordem de Tab e Shift+Tab, foco visível dourado em cada parada,
 * âncora `#presentes-corporativos` e contraste do foco com `opacity: .65` (D3).
 */

/** Spec §4.4: `outline: 2px solid var(--ouro)`; `--ouro` = #c9a24b. */
const OURO = 'rgb(201, 162, 75)';
const LIMITE_DE_PARADAS = 120;

type Regiao = 'pular' | 'cabecalho' | 'conteudo' | 'rodape' | 'atendimento' | 'outra';

type Parada = {
  regiao: Regiao;
  nome: string;
  ordem: number;
  outlineStyle: string;
  outlineWidth: number;
  outlineColor: string;
  boxShadow: string;
};

/** Descreve o elemento que está com o foco. Devolve `null` se o foco está em `body` (fim do ciclo). */
async function paradaAtual(page: Page): Promise<Parada | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    const regiaoDe = (): Regiao => {
      if (el.matches('.pular-conteudo')) return 'pular';
      if (el.closest('header')) return 'cabecalho';
      if (el.closest('main')) return 'conteudo';
      if (el.closest('footer')) return 'rodape';
      if (el.closest('[role="dialog"]') || el.matches('[aria-label="Abrir atendimento"]')) {
        return 'atendimento';
      }
      return 'outra';
    };
    const estilo = getComputedStyle(el);
    const todos = Array.from(document.querySelectorAll('*'));
    return {
      regiao: regiaoDe(),
      nome:
        (el.getAttribute('aria-label') ??
          (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60)) ||
        el.tagName,
      ordem: todos.indexOf(el),
      outlineStyle: estilo.outlineStyle,
      outlineWidth: parseFloat(estilo.outlineWidth),
      outlineColor: estilo.outlineColor,
      boxShadow: estilo.boxShadow,
    };
  });
}

/** Aperta a tecla até o foco voltar ao documento; falha se passar do limite (armadilha de foco). */
async function percorrer(page: Page, tecla: 'Tab' | 'Shift+Tab'): Promise<Parada[]> {
  const paradas: Parada[] = [];
  for (let i = 0; i < LIMITE_DE_PARADAS; i++) {
    await page.keyboard.press(tecla);
    const parada = await paradaAtual(page);
    if (!parada) return paradas;
    paradas.push(parada);
  }
  throw new Error(
    `Mais de ${LIMITE_DE_PARADAS} paradas com ${tecla}: possível armadilha de foco ` +
      `(últimas: ${paradas
        .slice(-4)
        .map((p) => p.nome)
        .join(' | ')})`,
  );
}

const ORDEM_DAS_REGIOES: Regiao[] = ['pular', 'cabecalho', 'conteudo', 'rodape', 'atendimento'];

const PAGINAS = [
  { nome: 'Presentes', rota: '/presentes' },
  { nome: 'Aprenda', rota: '/aprenda' },
  { nome: 'artigo Queijo e vinho', rota: '/aprenda/queijo-e-vinho' },
  { nome: 'Produtores', rota: '/produtores' },
  { nome: '404', rota: '/nao-existe' },
] as const;

test.describe('ordem de Tab, Shift+Tab e foco visível dourado', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { nome, rota } of PAGINAS) {
    test(`${nome}: Tab segue pular, cabeçalho, conteúdo, rodapé e atendimento, sem armadilha`, async ({
      page,
    }) => {
      await page.goto(rota);

      const paradas = await percorrer(page, 'Tab');

      // Começa no "Pular para o conteúdo" e termina no gatilho do atendimento.
      expect(paradas[0]).toMatchObject({ regiao: 'pular', nome: 'Pular para o conteúdo' });
      expect(paradas.at(-1)).toMatchObject({ regiao: 'atendimento', nome: 'Abrir atendimento' });

      // Ordem do DOM estritamente crescente (nenhum tabindex positivo embaralha o percurso).
      const ordens = paradas.map((p) => p.ordem);
      expect(ordens, 'Tab deve seguir a ordem do DOM').toEqual([...ordens].sort((a, b) => a - b));
      expect(new Set(ordens).size, 'nenhuma parada repetida').toBe(ordens.length);

      // As regiões aparecem na ordem de leitura e cada uma tem ao menos uma parada.
      const regioes = paradas.map((p) => p.regiao);
      const indices = regioes.map((r) => ORDEM_DAS_REGIOES.indexOf(r));
      expect(
        indices.every((i) => i >= 0),
        `região inesperada em ${regioes.join(',')}`,
      ).toBe(true);
      expect(indices, 'regiões fora da ordem de leitura').toEqual(
        [...indices].sort((a, b) => a - b),
      );
      for (const r of ['cabecalho', 'conteudo', 'rodape'] as const) {
        expect(regioes, `sem parada em ${r}`).toContain(r);
      }
    });

    test(`${nome}: Shift+Tab percorre as mesmas paradas na ordem inversa`, async ({ page }) => {
      await page.goto(rota);
      const paraFrente = await percorrer(page, 'Tab');

      // O Tab terminou no documento; o Shift+Tab seguinte entra pelo fim da página.
      const paraTras = await percorrer(page, 'Shift+Tab');

      const rotulo = (p: Parada) => `${p.regiao}: ${p.nome}`;
      expect(paraTras.map(rotulo)).toEqual(paraFrente.map(rotulo).reverse());
    });

    test(`${nome}: toda parada do Tab tem contorno visível dourado de 2 px`, async ({ page }) => {
      await page.goto(rota);

      const paradas = await percorrer(page, 'Tab');

      for (const p of paradas) {
        const contornoVisivel = p.outlineStyle !== 'none' && p.outlineWidth > 0;
        const sombraDeFoco = p.boxShadow !== 'none';
        expect(
          contornoVisivel || sombraDeFoco,
          `"${p.nome}" (${p.regiao}) ficou sem contorno de foco`,
        ).toBe(true);
        if (contornoVisivel) {
          expect(p.outlineStyle, `"${p.nome}": estilo do contorno`).toBe('solid');
          expect(p.outlineWidth, `"${p.nome}": espessura do contorno`).toBe(2);
          expect(p.outlineColor, `"${p.nome}": cor do contorno (--ouro)`).toBe(OURO);
        }
      }
    });
  }
});

test.describe('âncora #presentes-corporativos por teclado', () => {
  const bloco = (page: Page) =>
    page.getByRole('region', { name: 'Presentes para equipes e clientes.' });
  const linkDoRodape = (page: Page) =>
    page
      .getByRole('navigation', { name: 'Rodapé' })
      .getByRole('link', { name: 'Presentes corporativos' });

  test('vindo de outra página, Tab até o link do rodapé e Enter levam o foco ao bloco', async ({
    page,
  }) => {
    await page.goto('/produtores');

    await tabAte(page, linkDoRodape(page));
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/presentes#presentes-corporativos');
    await expect(bloco(page)).toBeFocused();
    await expect(
      page.getByRole('heading', { level: 2, name: /Presentes para equipes/ }),
    ).toBeVisible();
  });

  test('já em /presentes, mudar o hash (hashchange) leva o foco ao bloco', async ({ page }) => {
    await page.goto('/presentes');
    await expect(bloco(page)).not.toBeFocused();

    await page.evaluate(() => {
      location.hash = '#presentes-corporativos';
    });

    await expect(page).toHaveURL('/presentes#presentes-corporativos');
    await expect(bloco(page)).toBeFocused();
  });

  test('já em /presentes, depois do hashchange o Tab segue do bloco ao Pedir orçamento', async ({
    page,
  }) => {
    await page.goto('/presentes');
    await page.evaluate(() => {
      location.hash = '#presentes-corporativos';
    });
    await expect(bloco(page)).toBeFocused();

    // O próximo Tab segue do bloco focado para o primeiro link dentro dele.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pedir orçamento' })).toBeFocused();
  });
});

/** Contraste do contorno de foco depois de composto com a opacidade do elemento (e dos ancestrais). */
async function medirContornoDeFoco(alvo: Locator) {
  return alvo.evaluate((el) => {
    type Rgba = [number, number, number, number];
    const ler = (css: string): Rgba => {
      const m = css.match(/rgba?\(([^)]+)\)/);
      if (!m) throw new Error(`cor não reconhecida: ${css}`);
      const n = (m[1] ?? '')
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
    };
    const sobre = (topo: Rgba, base: Rgba): Rgba => {
      const a = topo[3] + base[3] * (1 - topo[3]);
      const mix = (t: number, b: number) => (t * topo[3] + b * base[3] * (1 - topo[3])) / a;
      return [mix(topo[0], base[0]), mix(topo[1], base[1]), mix(topo[2], base[2]), a];
    };
    const lum = ([r, g, b]: Rgba) => {
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const razao = (x: Rgba, y: Rgba) => {
      const claro = Math.max(lum(x), lum(y));
      const escuro = Math.min(lum(x), lum(y));
      return (claro + 0.05) / (escuro + 0.05);
    };

    // Fundo atrás do contorno: o primeiro fundo opaco acima do elemento (o contorno fica fora dele).
    let fundo: Rgba = [20, 17, 15, 1];
    for (let p = el.parentElement; p; p = p.parentElement) {
      const c = ler(getComputedStyle(p).backgroundColor);
      if (c[3] > 0) {
        fundo = sobre(c, [0, 0, 0, 1]);
        break;
      }
    }

    let opacidade = 1;
    for (let p: Element | null = el; p; p = p.parentElement) {
      opacidade *= parseFloat(getComputedStyle(p).opacity);
    }

    const estilo = getComputedStyle(el);
    const contorno = ler(estilo.outlineColor);
    const efetiva = sobre([contorno[0], contorno[1], contorno[2], contorno[3] * opacidade], fundo);
    return {
      opacidade,
      outlineStyle: estilo.outlineStyle,
      outlineColor: estilo.outlineColor,
      cor: efetiva.slice(0, 3).map(Math.round),
      fundo: fundo.slice(0, 3),
      razao: razao(efetiva, fundo),
    };
  });
}

test.describe('contraste do foco em botões desabilitados e pendentes (D3, opacity .65)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  /**
   * Os estados "pendente" duram um instante no e2e. Para medir de forma determinística, o atributo
   * `aria-disabled="true"` é aplicado ao elemento real (o CSS de produção reage a ele); o foco vem
   * do teclado, para valer `:focus-visible`.
   */
  async function focarDesabilitado(page: Page, alvo: Locator) {
    await alvo.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
    await tabAte(page, alvo);
    await expect(alvo).toBeFocused();
  }

  function conferir(m: Awaited<ReturnType<typeof medirContornoDeFoco>>, opacidade: number) {
    expect(m.opacidade).toBeCloseTo(opacidade, 2);
    expect(m.outlineStyle).toBe('solid');
    expect(m.outlineColor).toBe(OURO);
    // 1.4.11: contraste do indicador de foco contra o fundo >= 3:1 (cor já composta com a opacidade).
    expect(
      m.razao,
      `contorno composto rgb(${m.cor.join(',')}) sobre fundo rgb(${m.fundo.join(',')})`,
    ).toBeGreaterThanOrEqual(3);
  }

  test('Calcular (frete) com aria-disabled: contorno composto >= 3:1', async ({ page }) => {
    await page.goto('/queijos/canastra-curado');
    const botao = page.getByRole('button', { name: 'Calcular', exact: true });

    await focarDesabilitado(page, botao);

    conferir(await medirContornoDeFoco(botao), 0.65);
  });

  test('Continuar para o pagamento ocupado: contorno composto >= 3:1', async ({ page }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    const botao = page.getByRole('button', { name: 'Continuar para o pagamento' });

    await focarDesabilitado(page, botao);

    conferir(await medirContornoDeFoco(botao), 0.65);
  });

  test('Confirmar pedido e Voltar para a entrega pendentes: contorno composto >= 3:1', async ({
    page,
  }) => {
    await semearSacola(page);
    await page.goto('/checkout');
    await campo(page, 'Nome completo').fill(DADOS.nome);
    await campo(page, 'E-mail').fill(DADOS.email);
    await campo(page, 'Telefone').fill(DADOS.telefone);
    await campo(page, 'CEP').fill(DADOS.cep);
    await campo(page, 'Rua ou avenida').fill(DADOS.logradouro);
    await campo(page, 'Número').fill(DADOS.numero);
    await campo(page, 'Bairro').fill(DADOS.bairro);
    await campo(page, 'Cidade').fill(DADOS.cidade);
    await campo(page, 'Estado').selectOption('SP');
    await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();

    for (const nome of ['Confirmar pedido', 'Voltar para a entrega']) {
      const botao = page.getByRole('button', { name: nome });
      await focarDesabilitado(page, botao);
      conferir(await medirContornoDeFoco(botao), 0.65);
    }
  });

  test('passo "−" da quantidade no mínimo: contorno pleno e >= 3:1', async ({ page }) => {
    await page.goto('/queijos/canastra-curado');
    const menos = page.getByRole('button', { name: /^Diminuir/ });
    await expect(menos).toHaveAttribute('aria-disabled', 'true');

    await tabAte(page, menos);

    // O esmaecimento é só no conteúdo (cor), não no botão: o contorno continua com opacidade 1.
    conferir(await medirContornoDeFoco(menos), 1);
  });
});
