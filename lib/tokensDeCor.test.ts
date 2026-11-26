// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Checklist de aceite (§14), item 1: "Tokens de cor da seção 3.1 definidos e nenhuma outra cor
 * usada fora dos SVGs". A fonte da verdade é a própria spec: os valores são lidos de
 * ATELIE-DO-QUEIJO-SPEC.md, não copiados para cá. Se alguém alterar um token em `globals.css`,
 * ou usar uma cor solta num CSS Module, estes testes falham.
 */

const RAIZ = process.cwd();
const IGNORADAS = new Set(['node_modules', '.next', 'coverage', 'test-results', '.git', '.claude']);

function arquivosCss(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    if (IGNORADAS.has(nome)) return [];
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosCss(caminho);
    return nome.endsWith('.css') ? [caminho] : [];
  });
}

function arquivosDeCodigo(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    if (IGNORADAS.has(nome)) return [];
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDeCodigo(caminho);
    return /\.tsx?$/.test(nome) && !/\.test\./.test(nome) ? [caminho] : [];
  });
}

function tokensDaSpec(): Map<string, string> {
  const spec = readFileSync(join(RAIZ, 'ATELIE-DO-QUEIJO-SPEC.md'), 'utf8');
  const bloco = /### 3\.1 Cores[\s\S]*?```css\s*:root \{([\s\S]*?)\n\}\s*```/.exec(spec)?.[1];
  if (!bloco) throw new Error('bloco :root da §3.1 não encontrado na spec');
  const tokens = new Map<string, string>();
  for (const m of bloco.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens.set(m[1]!, normalizar(m[2]!));
  }
  return tokens;
}

/** Minúsculas e sem espaços; não equipara 0.12 a .12 (a spec e o CSS devem escrever igual). */
function normalizar(valor: string): string {
  return valor.trim().toLowerCase().replace(/\s+/g, '');
}

function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function tokensDeCorDoGlobals(): Map<string, string> {
  const css = semComentarios(readFileSync(join(RAIZ, 'app', 'globals.css'), 'utf8'));
  const raiz = /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  const tokens = new Map<string, string>();
  for (const m of raiz.matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens.set(m[1]!, normalizar(m[2]!));
  return tokens;
}

/** Remove o bloco `:root` de globals.css, onde as cores são definidas. */
function cssSemADefinicaoDosTokens(arquivo: string): string {
  const css = semComentarios(readFileSync(arquivo, 'utf8'));
  return arquivo.replaceAll('\\', '/').endsWith('app/globals.css')
    ? css.replace(/:root\s*\{[\s\S]*?\n\}/, '')
    : css;
}

const PADRAO_DE_COR_LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/gi;
const CORES_COM_NOME =
  /(?:^|[\s:(,])(white|black|silver|gray|grey|red|green|blue|yellow|orange|purple|pink|brown|gold|ivory|beige|tan|navy|teal|maroon|olive|lime|aqua|cyan|magenta|crimson|coral|salmon)(?=[\s;,)!]|$)/gi;

const arquivos = arquivosCss(RAIZ);
const tokensSpec = tokensDaSpec();
const tokensGlobals = tokensDeCorDoGlobals();
const NOMES_DE_COR = [...tokensSpec.keys()];

describe('tokens de cor (§3.1)', () => {
  it('a spec define os 24 tokens esperados', () => {
    expect(NOMES_DE_COR).toHaveLength(24);
  });

  it.each(NOMES_DE_COR)('globals.css define %s com o valor exato da spec', (nome) => {
    expect(tokensGlobals.get(nome)).toBe(tokensSpec.get(nome));
  });

  it('globals.css não define token de cor além dos da spec', () => {
    const ehCor = (v: string) =>
      /^(#|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\()/.test(v);
    const extras = [...tokensGlobals]
      .filter(([nome, valor]) => ehCor(valor) && !tokensSpec.has(nome))
      .map(([nome]) => nome);
    expect(extras).toEqual([]);
  });

  it('encontra os CSS do projeto (sanidade da varredura)', () => {
    const relativos = arquivos.map((a) => relative(RAIZ, a).replace(/\\/g, '/'));
    expect(relativos).toContain('app/globals.css');
    expect(relativos.filter((a) => a.endsWith('.module.css')).length).toBeGreaterThanOrEqual(40);
  });

  it('nenhum CSS Module nem o CSS global usa cor literal fora dos tokens', () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivos) {
      const css = cssSemADefinicaoDosTokens(arquivo);
      css.split('\n').forEach((linha, i) => {
        // color-mix só com tokens e `transparent` é derivação de token (estado desabilitado).
        const semMistura = linha.replace(/color-mix\([^;]*\)/g, '');
        const literais = [
          ...(semMistura.match(PADRAO_DE_COR_LITERAL) ?? []),
          ...[...semMistura.matchAll(CORES_COM_NOME)].map((m) => m[1]!),
        ];
        if (literais.length > 0) {
          violacoes.push(`${relative(RAIZ, arquivo)}:${i + 1} -> ${literais.join(', ')}`);
        }
      });
    }
    expect(violacoes).toEqual([]);
  });

  it('todo color-mix usa só tokens e transparent', () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivos) {
      for (const m of cssSemADefinicaoDosTokens(arquivo).matchAll(/color-mix\(([^;]*)\)\s*;/g)) {
        const resto = m[1]!
          .replace(/in\s+srgb/g, '')
          .replace(/var\(--[\w-]+\)/g, '')
          .replace(/\d+%|transparent|[,\s]/g, '');
        if (resto !== '') violacoes.push(`${relative(RAIZ, arquivo)}: ${m[0]}`);
      }
    }
    expect(violacoes).toEqual([]);
  });

  it('todo var(--token) usado nos CSS existe em globals.css', () => {
    const usados = new Set<string>();
    for (const arquivo of arquivos) {
      for (const m of semComentarios(readFileSync(arquivo, 'utf8')).matchAll(/var\((--[\w-]+)/g)) {
        usados.add(m[1]!);
      }
    }
    // Variável usada precisa estar em globals.css ou ser declarada por um componente (`--x:` em
    // CSS ou `'--x'` em style inline). Pega erro de digitação, como var(--oura).
    const fontes = [...arquivos, ...arquivosDeCodigo(RAIZ)]
      .map((a) => readFileSync(a, 'utf8'))
      .join('\n');
    const inexistentes = [...usados].filter(
      (n) =>
        !tokensSpec.has(n) &&
        !tokensGlobals.has(n) &&
        !n.startsWith('--fonte-') &&
        !new RegExp(`(^|[\\s{;])${n}\\s*:|['"\`]${n}['"\`]`).test(fontes),
    );
    expect(inexistentes).toEqual([]);
  });

  it('as cores de app/opengraph-image.tsx são iguais a --cave e --ouro da spec', () => {
    const fonte = readFileSync(join(RAIZ, 'app', 'opengraph-image.tsx'), 'utf8');
    const literal = (nome: string) =>
      new RegExp(`const ${nome}\\s*=\\s*'([^']+)'`).exec(fonte)?.[1]?.toLowerCase();
    expect(literal('CAVE')).toBe(tokensSpec.get('--cave'));
    expect(literal('OURO')).toBe(tokensSpec.get('--ouro'));
  });
});
