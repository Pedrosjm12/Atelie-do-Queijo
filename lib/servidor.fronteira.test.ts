import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `lib/site` e `lib/seo` (e, se existirem, dadosEstruturados, cabecalhos e lacunas) são de servidor
 * e de build: `VERCEL_ENV` não chega ao navegador e `lib/seo` puxa os dados de catálogo e artigos.
 * Nenhum arquivo `'use client'` pode importá-los.
 */

const RAIZ = process.cwd();
const PASTAS = ['app', 'components', 'lib'];
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

const MODULOS = '(?:site|seo|dadosEstruturados|DadosEstruturados|cabecalhos|lacunas)';
const IMPORTA_MODULO_DE_SERVIDOR = [
  // `from '<qualquer prefixo>/lib/site'`, `from './seo'`, `from '../seo'`, `from '@/lib/seo'`...
  new RegExp(String.raw`from\s*['"][^'"]*/${MODULOS}['"]`),
  new RegExp(String.raw`\bimport\(\s*['"][^'"]*/${MODULOS}['"]\s*\)`),
  new RegExp(String.raw`\brequire\(\s*['"][^'"]*/${MODULOS}['"]\s*\)`),
];

describe('módulos de SEO e site só no servidor', () => {
  const arquivos = PASTAS.flatMap((p) => listar(join(RAIZ, p)));

  it('nenhum arquivo "use client" importa lib/site, lib/seo e afins', () => {
    const infratores = arquivos
      .filter((arquivo) => {
        const fonte = readFileSync(arquivo, 'utf8');
        return ehClient(fonte) && IMPORTA_MODULO_DE_SERVIDOR.some((r) => r.test(fonte));
      })
      .map((a) => relative(RAIZ, a));
    expect(infratores).toEqual([]);
  });

  it('o detector pega as formas de importação (teste do teste)', () => {
    for (const ruim of [
      `import { urlDoSite } from '@/lib/site';`,
      `import { x } from '@/lib/seo';`,
      `import { x } from '../lib/seo';`,
      `import { x } from './site';`,
      `const m = await import('@/lib/seo');`,
      `import { x } from '@/lib/dadosEstruturados';`,
      `import { DadosEstruturados } from '@/components/DadosEstruturados';`,
    ]) {
      expect(IMPORTA_MODULO_DE_SERVIDOR.some((r) => r.test(ruim))).toBe(true);
    }
    expect(IMPORTA_MODULO_DE_SERVIDOR.some((r) => r.test(`import x from '@/lib/formato';`))).toBe(
      false,
    );
  });
});
