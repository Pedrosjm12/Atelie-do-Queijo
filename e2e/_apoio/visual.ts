import { expect, type Page } from '@playwright/test';

/** Quarta-feira, 11/11/2026, 10h em São Paulo: dentro do horário de atendimento (§8). */
export const AGORA_FIXO = new Date('2026-11-11T13:00:00Z');

/** Antes de qualquer navegação: relógio fixo (Date) para o estado do atendimento não variar. */
export async function fixarRelogio(page: Page) {
  await page.clock.setFixedTime(AGORA_FIXO);
}

/**
 * Deixa a página estável para a captura: sem animações nem transições (CSS injetado, além do
 * `reducedMotion: 'reduce'` do projeto), imagens `loading="lazy"` carregadas (rola até o fim e
 * volta ao topo), fontes prontas e o foco fora de qualquer elemento.
 */
export async function estabilizar(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
      caret-color: transparent !important;
    }`,
  });
  await page.evaluate(async () => {
    const passo = Math.max(window.innerHeight / 2, 200);
    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((ok) => setTimeout(ok, 50));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? null : img.decode().catch(() => {}),
      ),
    );
    await document.fonts.ready;
  });
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
}

/**
 * Para capturas de página inteira: esconde (visibility) tudo que é `position: fixed`, como o botão
 * de atendimento e a barra de compra do produto no celular. Eles dependem do viewport e, na
 * captura inteira, apareceriam no meio da página. O espaço é mantido, então o layout não muda.
 */
export async function ocultarFixos(page: Page) {
  await page.evaluate(() => {
    for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
      if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden';
    }
  });
}
