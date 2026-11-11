import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Uma exceção ao axe: vale só para a regra e para os nós dentro do seletor, e cita a decisão do dono. */
export interface ExcecaoDoAxe {
  regra: string;
  /** Seletor CSS: o nó com violação precisa ser o próprio elemento ou estar dentro dele. */
  seletor: string;
  /** Cita a decisão do dono (ex.: "D34"). */
  motivo: string;
}

/**
 * Exceções aprovadas pelo dono. Hoje só os textos `[FOTO: …]` (`--placeholder` sobre o fundo do
 * espaço reservado): lacuna que some quando houver foto real (D34, checklist da etapa 9).
 */
export const EXCECOES_DO_AXE: readonly ExcecaoDoAxe[] = [
  {
    regra: 'color-contrast',
    // Só o texto do espaço reservado (`data-foto-pendente`, em `PhotoPlaceholder`), nada mais.
    seletor: '[data-foto-pendente]',
    motivo: 'D34: texto [FOTO: …] em --placeholder, some quando houver foto real',
  },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Roda o axe (WCAG 2.0 a 2.2 A e AA) na página inteira e falha listando regra, seletor e ajuda. */
export async function conferirAcessibilidade(
  page: Page,
  opcoes: { incluir?: string } = {},
): Promise<void> {
  let construtor = new AxeBuilder({ page }).withTags(TAGS);
  if (opcoes.incluir) construtor = construtor.include(opcoes.incluir);
  const { violations } = await construtor.analyze();

  const restantes: {
    id: string;
    impact: string;
    help: string;
    helpUrl: string;
    alvos: string[];
  }[] = [];
  for (const violacao of violations) {
    const excecoes = EXCECOES_DO_AXE.filter((e) => e.regra === violacao.id);
    const alvos: string[] = [];
    for (const no of violacao.nodes) {
      const seletor = no.target.map(String).join(' ');
      const coberto =
        excecoes.length > 0 &&
        (await page.evaluate(
          ([alvo, lista]) => {
            const el = document.querySelector(alvo);
            return el !== null && lista.some((s) => el.closest(s) !== null);
          },
          [String(no.target[0]), excecoes.map((e) => e.seletor)] as const,
        ));
      if (!coberto) alvos.push(seletor);
    }
    if (alvos.length > 0) {
      restantes.push({
        id: violacao.id,
        impact: violacao.impact ?? 'n/d',
        help: violacao.help,
        helpUrl: violacao.helpUrl,
        alvos,
      });
    }
  }

  if (restantes.length > 0) {
    const texto = restantes
      .map(
        (v) =>
          `- ${v.id} (${v.impact}): ${v.help}\n  ${v.helpUrl}\n${v.alvos.map((a) => `    ${a}`).join('\n')}`,
      )
      .join('\n');
    throw new Error(`O axe encontrou ${restantes.length} regra(s) violada(s):\n${texto}`);
  }
}
