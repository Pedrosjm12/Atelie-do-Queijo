// Importado pelo next.config.ts (carregado pelo Node antes do build): sem CSS, sem server-only, sem React.
/**
 * Trava de lacunas (P73 = B): textos ainda marcados com "[A DEFINIR" não podem ir para produção.
 * Módulo de build: o `next.config.ts` o importa por caminho relativo, então não importa nada do projeto.
 * `[FOTO: …]`, `[PREÇO]`, `[n]` e `[TEXTO DO ARTIGO]` NÃO travam (checklist da etapa 9, D34).
 */

const MARCA_DE_LACUNA = '[A DEFINIR';
const PROFUNDIDADE_MAXIMA = 12;

/** Percorre objetos, listas e textos e devolve o caminho de cada texto com "[A DEFINIR" (ex.: "TEXTOS_DO_ROTEIRO.saude"). */
export function encontrarLacunas(fontes: Readonly<Record<string, unknown>>): readonly string[] {
  const achadas: string[] = [];
  const visitados = new WeakSet<object>();

  function visitar(valor: unknown, caminho: string, nivel: number): void {
    if (typeof valor === 'string') {
      if (valor.includes(MARCA_DE_LACUNA)) achadas.push(caminho);
      return;
    }
    if (valor === null || typeof valor !== 'object' || nivel > PROFUNDIDADE_MAXIMA) return;
    if (visitados.has(valor)) return;
    visitados.add(valor);
    if (Array.isArray(valor)) {
      valor.forEach((item, i) => visitar(item, `${caminho}[${i}]`, nivel + 1));
      return;
    }
    for (const [chave, item] of Object.entries(valor)) {
      visitar(item, `${caminho}.${chave}`, nivel + 1);
    }
  }

  for (const [nome, valor] of Object.entries(fontes)) visitar(valor, nome, 0);
  return achadas;
}

/** Lança erro em português com a lista do que falta quando VERCEL_ENV === 'production' e houver lacuna. */
export function exigirSemLacunasEmProducao(
  vercelEnv: string | undefined,
  fontes: Readonly<Record<string, unknown>>,
): void {
  if (vercelEnv !== 'production') return;
  const lacunas = encontrarLacunas(fontes);
  if (lacunas.length === 0) return;
  throw new Error(
    `Build de produção bloqueado: ${lacunas.length} texto(s) ainda estão como "[A DEFINIR". Escreva os textos antes de publicar:\n${lacunas
      .map((c) => `  - ${c}`)
      .join('\n')}`,
  );
}
