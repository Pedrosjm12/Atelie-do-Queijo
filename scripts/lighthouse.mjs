// Lighthouse CI local e no GitHub Actions (ADR-0016, decisão 5).
//
// Uso: npm run lighthouse
//   - constrói o site de produção (PERMITIR_DADOS_FICTICIOS=1 por padrão, como no CI);
//   - roda `lhci autorun` com o `lighthouserc.json` (6 rotas, 3 execuções, perfil celular, mediana);
//   - grava relatórios HTML/JSON em `.lighthouseci/` (nada vai a armazenamento público);
//   - imprime a tabela da execução representativa (e a grava em `.lighthouseci/resumo.md`).
// Chrome: usa o instalado (CHROME_PATH ou o caminho padrão do sistema). Não rode junto com o e2e ou o Docker.
// Enquanto estiver em modo aviso (`warn`), o veredito não reprova: a tarefa 9 do plano passa a `error`.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const env = {
  ...process.env,
  PERMITIR_DADOS_FICTICIOS: process.env.PERMITIR_DADOS_FICTICIOS ?? '1',
};

const CHROMES_PADRAO = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
if (!env.CHROME_PATH) {
  const achado = CHROMES_PADRAO.find((c) => existsSync(c));
  if (achado) env.CHROME_PATH = achado;
}

function rodar(comando, args) {
  const r = spawnSync([comando, ...args].join(' '), {
    cwd: raiz,
    env,
    stdio: 'inherit',
    shell: true,
  });
  return r.status ?? 1;
}

const semBuild = process.argv.includes('--sem-build');
if (!semBuild && rodar('npm', ['run', 'build']) !== 0) process.exit(1);

// `--no-sandbox` só no CI (runner Ubuntu); na máquina local o Chrome mantém o sandbox.
// Atenção: `rodar()` usa shell; nunca repasse argumentos vindos do usuário.
const argsLhci = ['--no-install', 'lhci', 'autorun', '--config=lighthouserc.json'];
if (process.env.CI) argsLhci.push('--collect.settings.chromeFlags="--headless=new --no-sandbox"');
const statusLhci = rodar('npx', argsLhci);

// Resumo das medianas: lê o relatório JSON da execução representativa de cada rota.
async function resumo() {
  const pasta = `${raiz}.lighthouseci/`;
  await rm(`${pasta}resumo.md`, { force: true });
  const manifesto = JSON.parse(await readFile(`${pasta}manifest.json`, 'utf8'));
  const linhas = [
    '| Rota | Desempenho | Acessibilidade | Boas práticas | SEO | LCP (ms) | TBT (ms) | CLS |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const m of manifesto.filter((e) => e.isRepresentativeRun)) {
    const rel = JSON.parse(await readFile(m.jsonPath, 'utf8'));
    const nota = (id) => Math.round((rel.categories[id].score ?? 0) * 100);
    const val = (id) => rel.audits[id].numericValue;
    const rota = new URL(m.url).pathname;
    linhas.push(
      `| \`${rota}\` | ${nota('performance')} | ${nota('accessibility')} | ${nota('best-practices')} | ${nota('seo')} | ${Math.round(val('largest-contentful-paint'))} | ${Math.round(val('total-blocking-time'))} | ${val('cumulative-layout-shift').toFixed(3)} |`,
    );
  }
  let avisos = 'Nenhum aviso das metas.';
  try {
    const res = JSON.parse(await readFile(`${pasta}assertion-results.json`, 'utf8'));
    const itens = res.map(
      (a) =>
        `- \`${new URL(a.url).pathname}\`: ${a.auditId ?? a.name} (${a.level}), obtido ${a.actual}, esperado ${a.operator} ${a.expected}`,
    );
    if (itens.length) avisos = `**Avisos das metas (${itens.length}):**\n\n${itens.join('\n')}`;
  } catch {
    avisos = 'Resultados das metas indisponíveis.';
  }
  const tabela = [
    '### Lighthouse (celular, execução representativa de 3 por rota)',
    '',
    ...linhas,
    '',
    avisos,
    '',
    'O SEO abaixo de 100 vem de `is-crawlable`, de propósito fora de produção; qualquer outra falha aparece nos avisos acima.',
  ].join('\n');
  await writeFile(`${pasta}resumo.md`, `${tabela}\n`);
  console.log(`\n${tabela}`);
}

try {
  await resumo();
} catch (e) {
  console.error(`Não foi possível montar o resumo: ${e.message}`);
}
process.exit(statusLhci);
