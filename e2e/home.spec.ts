import { expect, test, type Page } from '@playwright/test';

const larguras = [360, 390, 1440];

async function semRolagemHorizontal(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

// O h2 da seção muda no resultado; o id é estável nas duas telas.
const SECAO_DO_QUIZ = 'section#quiz';

test.describe('home', () => {
  test('mostra as seções da §5 na ordem', async ({ page }) => {
    await page.goto('/');
    const secoes = page.locator('main > section');
    await expect(secoes).toHaveCount(8);

    const titulos = await secoes.evaluateAll((nos) =>
      nos.map(
        (no) =>
          no.getAttribute('aria-label') ??
          no.querySelector('h1, h2')?.textContent?.replace(/\s+/g, ' ').trim() ??
          '',
      ),
    );
    expect(titulos).toEqual([
      'Queijos de autor, escolhidos à mão.',
      'Garantias',
      'Na cave esta semana',
      'Duas tradições, uma mesma exigência.',
      'Não sabe por onde começar?',
      'Presentes que se abrem como um ritual.',
      'O jeito certo de servir, guardar e harmonizar.',
      'Receba primeiro os lotes raros.',
    ]);
    // Seções 5.1 (faixa + cabeçalho) e 5.10 (rodapé + botão flutuante) ficam fora do <main>.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('h1 com "escolhidos à mão." em <em>', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Queijos de autor, escolhidos à mão.');
    await expect(h1.locator('em')).toHaveText('escolhidos à mão.');
  });

  test('espaçamentos exatos da §5 a 1440 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const padding = (seletor: string) =>
      page
        .locator(seletor)
        .first()
        .evaluate((no) => {
          const e = getComputedStyle(no);
          return [e.paddingTop, e.paddingRight, e.paddingBottom, e.paddingLeft].join(' ');
        });
    const secao = (trecho: string) => `main > section:has(h2:has-text("${trecho}"))`;

    expect(await padding('main > section:has(h1)')).toBe('48px 32px 96px 32px');
    expect(await padding(secao('Na cave esta semana'))).toBe('112px 32px 0px 32px');
    expect(await padding(secao('Duas tradições'))).toBe('128px 32px 0px 32px');
    expect(await padding(secao('Não sabe por onde começar?'))).toBe('128px 32px 0px 32px');
    expect(await padding(secao('Presentes que se abrem'))).toBe('128px 32px 0px 32px');
    expect(await padding(secao('O jeito certo de servir'))).toBe('128px 32px 0px 32px');
    expect(await padding(secao('Receba primeiro os lotes raros.'))).toBe('128px 32px 128px 32px');
  });

  test('conteúdo de 1200 px com 32 px de respiro: de x=120 a x=1320 a 1440 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    // Todo contêiner (caixa de 1264 px): seções, Garantias, cabeçalho e rodapé.
    const conteineres = await page.evaluate(() =>
      Array.from(document.querySelectorAll('body *'))
        .filter((no) => getComputedStyle(no).maxWidth === '1264px')
        .map((no) => {
          const caixa = no.getBoundingClientRect();
          const e = getComputedStyle(no);
          return {
            marca: no.tagName.toLowerCase(),
            borda: [
              Math.round(caixa.left + parseFloat(e.paddingLeft)),
              Math.round(caixa.right - parseFloat(e.paddingRight)),
            ],
          };
        }),
    );
    expect(conteineres.length).toBeGreaterThanOrEqual(11);
    for (const c of conteineres) expect(c.borda).toEqual([120, 1320]);
  });

  test('etiqueta do hero cabe em uma linha', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const etiqueta = page.getByText('BRASIL · SERRA DA CANASTRA, MG').first();
    expect((await etiqueta.boundingBox())?.height).toBeLessThan(24);
  });

  test('textos, lacunas e links da spec', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('R$ [PREÇO]')).toHaveCount(3);
    await expect(page.getByText('[FOTO DO KIT]')).toHaveCount(3);
    await expect(page.getByText('Arraste para girar')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );
    await expect(page.getByRole('link', { name: 'Montar um presente' })).toHaveAttribute(
      'href',
      '/presentes',
    );
    await expect(page.getByRole('link', { name: 'Conhecer os brasileiros →' })).toHaveAttribute(
      'href',
      '/queijos?origem=brasil',
    );
    await expect(page.getByRole('link', { name: 'Conhecer os importados →' })).toHaveAttribute(
      'href',
      '/queijos?origem=mundo',
    );
    // Na cave: 4 cartões, cada um com o seu "Adicionar" (sem ação nesta etapa).
    const cave = page.locator('main > section:has(h2:text-is("Na cave esta semana"))');
    await expect(cave.getByRole('article')).toHaveCount(4);
    await expect(cave.getByRole('button', { name: /^Adicionar / })).toHaveCount(4);
  });

  test('quiz: percorre as três perguntas só com o teclado até o resultado e refaz', async ({
    page,
  }) => {
    await page.goto('/');
    const quiz = page.locator(SECAO_DO_QUIZ);
    const proxima = quiz.getByRole('button', { name: 'Próxima pergunta' });

    await expect(quiz.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 1 DE 3')).toBeVisible();
    await expect(proxima).toBeDisabled();

    const intensos = quiz.getByRole('button', { name: 'Intensos e marcantes' });
    await quiz.getByRole('button', { name: 'Suaves e amanteigados' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(intensos).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(intensos).toHaveAttribute('aria-pressed', 'true');
    await expect(proxima).toBeEnabled();
    await page.keyboard.press('Tab');
    await expect(proxima).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(quiz.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 2 DE 3')).toBeVisible();
    await expect(quiz.getByRole('heading', { level: 3 })).toBeFocused();
    const paraMim = quiz.getByRole('button', { name: 'Para mim, com calma' });
    await paraMim.focus();
    await page.keyboard.press('Space');
    await expect(paraMim).toHaveAttribute('aria-pressed', 'true');
    await quiz.getByRole('button', { name: 'Próxima pergunta' }).focus();
    await page.keyboard.press('Enter');

    await expect(quiz.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 3 DE 3')).toBeVisible();
    await quiz.getByRole('button', { name: 'Vinho tinto' }).focus();
    await page.keyboard.press('Enter');
    await quiz.getByRole('button', { name: 'Ver meu queijo' }).focus();
    await page.keyboard.press('Enter');

    await expect(quiz.getByText('SEU QUEIJO É')).toBeVisible();
    await expect(quiz.getByRole('heading', { level: 2, name: 'Canastra curado' })).toBeFocused();
    await expect(quiz.getByText('[POR QUE COMBINA COM VOCÊ]')).toBeVisible();
    await expect(quiz.getByRole('button', { name: 'Adicionar à sacola' })).toBeVisible();

    await quiz.getByRole('button', { name: 'Refazer o teste' }).click();
    await expect(quiz.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 1 DE 3')).toBeVisible();
    await expect(quiz.getByRole('button', { name: 'Intensos e marcantes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('newsletter: e-mail inválido mostra erro; válido mostra o sucesso sem rede', async ({
    page,
  }) => {
    await page.goto('/');
    // Prefetches GET do Next (?_rsc=) são normais; envio de dados seria POST ou levaria o e-mail.
    const MARCADOR = 'zz-sem-rede-7f3';
    const envios: string[] = [];
    page.on('request', (r) => {
      const levaOEmail = r.url().includes(MARCADOR) || (r.postData() ?? '').includes(MARCADOR);
      if (r.method() !== 'GET' || levaOEmail) envios.push(`${r.method()} ${r.url()}`);
    });

    await page.getByLabel('Seu e-mail').fill('invalido');
    await page.getByRole('button', { name: 'Quero receber' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'e-mail válido' })).toBeVisible();

    await page.getByLabel('Seu e-mail').fill(`${MARCADOR}@exemplo.com`);
    await page.getByRole('button', { name: 'Quero receber' }).click();
    await expect(page.getByText('Pronto! Você vai receber os próximos lotes raros.')).toBeVisible();
    // `networkidle` nunca se firma: o Next segue pré-carregando links. Uma pausa curta basta.
    await page.waitForTimeout(500);
    expect(envios).toEqual([]);
  });

  test('sem ids duplicados e com todo url(#…) resolvido, inclusive com o resultado do quiz', async ({
    page,
  }) => {
    await page.goto('/');
    // O resultado repete a miniatura A.4 da grade: o caso que poderia colidir.
    const quiz = page.locator(SECAO_DO_QUIZ);
    await quiz.getByRole('button', { name: 'Intensos e marcantes' }).click();
    await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
    await quiz.getByRole('button', { name: 'Para mim, com calma' }).click();
    await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
    await quiz.getByRole('button', { name: 'Vinho tinto' }).click();
    await quiz.getByRole('button', { name: 'Ver meu queijo' }).click();
    await expect(quiz.getByText('SEU QUEIJO É')).toBeVisible();

    const { duplicados, orfaos } = await page.evaluate(() => {
      const vistos = new Set<string>();
      const duplicados = new Set<string>();
      for (const no of Array.from(document.querySelectorAll('[id]'))) {
        if (vistos.has(no.id)) duplicados.add(no.id);
        vistos.add(no.id);
      }
      const orfaos: string[] = [];
      for (const no of Array.from(document.querySelectorAll('*'))) {
        for (const atributo of Array.from(no.attributes)) {
          for (const achado of atributo.value.matchAll(/url\(#([^)]+)\)/g)) {
            const id = achado[1];
            if (id && !document.getElementById(id)) orfaos.push(id);
          }
        }
      }
      return { duplicados: Array.from(duplicados), orfaos };
    });
    expect(duplicados).toEqual([]);
    expect(orfaos).toEqual([]);
  });

  for (const largura of larguras) {
    test(`sem rolagem horizontal a ${largura} px, também com o resultado do quiz`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/');
      expect(await semRolagemHorizontal(page)).toBe(true);

      const quiz = page.locator(SECAO_DO_QUIZ);
      await quiz.getByRole('button', { name: 'Suaves e amanteigados' }).click();
      await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
      await quiz.getByRole('button', { name: 'Presente' }).click();
      await quiz.getByRole('button', { name: 'Próxima pergunta' }).click();
      await quiz.getByRole('button', { name: 'Vinho branco ou espumante' }).click();
      expect(await semRolagemHorizontal(page)).toBe(true);
      await quiz.getByRole('button', { name: 'Ver meu queijo' }).click();
      await expect(quiz.getByRole('heading', { level: 2, name: 'Brie francês' })).toBeVisible();
      expect(await semRolagemHorizontal(page)).toBe(true);
    });
  }
});
