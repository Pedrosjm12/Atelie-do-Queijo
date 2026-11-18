// Roda o projeto `visual` do Playwright dentro da imagem Docker oficial (Linux), na mesma versão
// do @playwright/test instalado. As imagens de referência são do Linux: no Windows elas diferem.
// Uso: npm run test:visual:docker [-- --update-snapshots]  (argumentos extras vão ao Playwright)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(
  readFileSync(resolve(raiz, 'node_modules/@playwright/test/package.json'), 'utf8'),
);
const imagem = `mcr.microsoft.com/playwright:v${version}-noble`;

// node_modules e .next ficam em volumes nomeados: não misturam com os do Windows.
// `npm ci` só roda quando o package-lock.json muda (marca guardada no volume).
const comando = [
  'set -e',
  'if ! cmp -s package-lock.json node_modules/.lock-visual; then',
  // --loglevel=error: a imagem traz Node 26 e o projeto pede 24.x (engines); o aviso EBADENGINE
  // não afeta as capturas (dependem do Chromium da imagem). Decisão do dono, 2026-11-17 (Node B).
  '  npm ci --ignore-scripts --no-audit --no-fund --loglevel=error',
  '  cp package-lock.json node_modules/.lock-visual',
  'fi',
  // Os argumentos extras chegam como parâmetros posicionais do bash ("$@"), sem montar string.
  'npx playwright test --project=visual "$@"',
].join('\n');

const resultado = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '--init',
    '-v',
    `${raiz}:/app`,
    '-v',
    'atelie-visual-node-modules:/app/node_modules',
    '-v',
    'atelie-visual-next:/app/.next',
    '-w',
    '/app',
    '-e',
    'CI=',
    '-e',
    `ATELIE_FORBID_ONLY=${process.env.CI ? '1' : ''}`,
    '-e',
    'PERMITIR_DADOS_FICTICIOS=1',
    '-e',
    'NEXT_TELEMETRY_DISABLED=1',
    '-e',
    'ATELIE_VISUAL=1', // registra o projeto `visual` no playwright.config.ts
    imagem,
    'bash',
    '-c',
    comando,
    'bash', // $0 do bash -c; o que vem depois vira "$@"
    ...process.argv.slice(2),
  ],
  // Sem shell: o docker.exe recebe cada argumento intacto (inclusive o caminho com espaço e acento).
  { stdio: 'inherit' },
);
if (resultado.error) {
  console.error(
    `Não foi possível executar o Docker (${resultado.error.message}). O Docker Desktop está aberto?`,
  );
  process.exit(1);
}
process.exit(resultado.status ?? 1);
