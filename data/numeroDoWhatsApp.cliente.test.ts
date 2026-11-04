import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADR-0010, decisão 4: `VERCEL_ENV` não chega ao navegador, então `numeroDoWhatsApp()` chamada num
 * Client Component cairia sempre no número fictício. O número é resolvido só no servidor
 * (`app/layout.tsx`) e chega ao cliente por prop do `AtendimentoProvider`.
 */

const RAIZ = process.cwd();
const PASTAS = ['app', 'components', 'lib', 'data'];
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs)$/;
const TESTE = /\.(test|spec)\.[tj]sx?$/;

function listar(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return item.name === 'node_modules' ? [] : listar(caminho);
    return EXTENSOES.test(item.name) && !TESTE.test(item.name) ? [caminho] : [];
  });
}

/** `'use client'` como primeira instrução do arquivo (comentários antes dela são permitidos). */
function ehClient(fonte: string): boolean {
  const semComentarios = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return /^\s*(['"])use client\1/.test(semComentarios);
}

/** Importa o nome `numeroDoWhatsApp` (estático ou dinâmico) ou o módulo `data/ficticio` inteiro. */
const IMPORTA_O_NUMERO = [
  /import\s+(?:type\s+)?\{[^}]*\bnumeroDoWhatsApp\b[^}]*\}\s*from/,
  /import\s+\*\s+as\s+\w+\s+from\s*['"][^'"]*\/ficticio['"]/,
  /\bimport\(\s*['"][^'"]*\/ficticio['"]\s*\)/,
  /\brequire\(\s*['"][^'"]*\/ficticio['"]\s*\)/,
];

describe('número do WhatsApp só no servidor', () => {
  const arquivos = PASTAS.flatMap((p) => listar(join(RAIZ, p)));

  it('varre os arquivos do projeto', () => {
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos.some((a) => a.endsWith('SupportPanel.tsx'))).toBe(true);
  });

  it('nenhum arquivo "use client" importa numeroDoWhatsApp', () => {
    const infratores = arquivos
      .filter((arquivo) => {
        const fonte = readFileSync(arquivo, 'utf8');
        return ehClient(fonte) && IMPORTA_O_NUMERO.some((r) => r.test(fonte));
      })
      .map((a) => relative(RAIZ, a));
    expect(infratores).toEqual([]);
  });

  it('o detector enxerga um arquivo client que importa a função (teste do teste)', () => {
    const ruim = `'use client';\nimport { numeroDoWhatsApp } from '@/data/ficticio';\n`;
    expect(ehClient(ruim)).toBe(true);
    expect(IMPORTA_O_NUMERO.some((r) => r.test(ruim))).toBe(true);
    expect(ehClient(`import { x } from 'y';\n'use client';`)).toBe(false);
  });

  it('o layout (Server Component) é quem chama numeroDoWhatsApp()', () => {
    const layout = readFileSync(join(RAIZ, 'app', 'layout.tsx'), 'utf8');
    expect(ehClient(layout)).toBe(false);
    expect(layout).toMatch(/numeroDoWhatsApp=\{numeroDoWhatsApp\(\)\}/);
  });
});
