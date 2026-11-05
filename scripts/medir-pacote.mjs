// Medição do JavaScript inicial (método do ADR-0007, agora versionado).
//
// Uso:
//   npm run build && npm run medir:pacote
//   npm run medir:pacote -- --web-vitals   (sobe o próprio `next start` em 127.0.0.1:3217 (falha se ela já responder); defina URL_BASE para usar outro servidor)
//
// O Next 16 (Turbopack) não imprime a tabela "First Load JS". Por isso a medição lê os arquivos
// gerados: cada HTML pré-renderizado em `.next/server/app` (exceto `_not-found` e `_global-error`)
// lista seus `<script src="/_next/static/...js">` (menos os marcados `noModule`: polyfills que só
// navegadores sem módulos ES baixam, fora da medição desde 2026-11-05); cada arquivo é comprimido com gzip (padrão do
// Node) e o "compartilhado" é a interseção dos arquivos presentes em todas as páginas.
// `/queijos` é dinâmica e não tem HTML pré-renderizado: usa os mesmos arquivos do layout.
//
// Com `--web-vitals`, mede LCP e CLS da página de produto no Chromium do Playwright, emulando
// celular. Sem estrangulamento de rede ou CPU: serve para comparar antes e depois, não como
// nota do Lighthouse.

import { readdir, readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const pastaApp = `${raiz}.next/server/app`;
const pastaEstatica = `${raiz}.next`;
// Limites recalibrados em 2026-11-05 (ADR-0012, atualização): o método passou a IGNORAR os
// `<script noModule>` (polyfills que navegadores modernos não baixam; ~38,7 kB gzip). Cada limite =
// valor medido por esse método (após o painel de atendimento virar chunk tardio) + folga de 3 kB
// gzip por rota. Medidos: compartilhado 140,88; `/` 145,34; produto 151,99 (kB gzip).
const ORCAMENTO = {
  compartilhado: 140.88 + 3.0,
  '/': 145.34 + 3.0,
  '/queijos': 140.88 + 3.0,
  '/queijos/canastra-curado': 151.99 + 3.0,
  chunkTardio: 350,
  // Motor do assistente (lib/roteiro + cartões + quiz), carregado ao abrir o painel (ADR-0010).
  chunkDoMotor: 12,
};
const IGNORADAS = new Set(['_not-found.html', '_global-error.html']);

async function listarHtml(pasta, prefixo = '') {
  const achados = [];
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (item.name.endsWith('.segments')) continue;
      achados.push(...(await listarHtml(`${pasta}/${item.name}`, `${prefixo}${item.name}/`)));
    } else if (item.name.endsWith('.html') && !IGNORADAS.has(item.name)) {
      achados.push(`${prefixo}${item.name}`);
    }
  }
  return achados;
}

const rotaDoHtml = (arquivo) =>
  arquivo === 'index.html' ? '/' : `/${arquivo.replace(/\.html$/, '')}`;

const cacheDeTamanhos = new Map();
async function bytesGzip(caminhoNoSite) {
  if (!cacheDeTamanhos.has(caminhoNoSite)) {
    const conteudo = await readFile(`${pastaEstatica}${caminhoNoSite.replace('/_next', '')}`);
    cacheDeTamanhos.set(caminhoNoSite, gzipSync(conteudo).length);
  }
  return cacheDeTamanhos.get(caminhoNoSite);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(2).replace('.', ',')} kB`;
const soma = async (arquivos) => {
  let total = 0;
  for (const a of arquivos) total += await bytesGzip(a);
  return total;
};

async function medirPacote() {
  const paginas = new Map();
  for (const arquivo of await listarHtml(pastaApp)) {
    const html = await readFile(`${pastaApp}/${arquivo}`, 'utf8');
    const scripts = new Set();
    for (const tag of html.matchAll(/<script\b[^>]*>/g)) {
      // Polyfills `noModule` não são baixados por navegadores modernos: ficam fora da medição.
      if (/\snoModule\b/i.test(tag[0])) continue;
      const src = tag[0].match(/\ssrc="(\/_next\/static\/[^"?]+\.js)(?:\?[^"]*)?"/);
      if (src) scripts.add(src[1]);
    }
    paginas.set(rotaDoHtml(arquivo), { scripts, html });
  }
  if (paginas.size === 0) throw new Error('Sem HTML em .next/server/app: rode `npm run build`.');

  const listas = [...paginas.values()].map((p) => [...p.scripts]);
  const compartilhado = listas[0].filter((s) => listas.every((l) => l.includes(s)));
  const totalCompartilhado = await soma(compartilhado);

  console.log(`Páginas pré-renderizadas medidas: ${paginas.size}`);
  console.log(
    `First Load JS compartilhado: ${kb(totalCompartilhado)} gzip (${totalCompartilhado} bytes, ${compartilhado.length} arquivos)`,
  );
  console.log('\nJavaScript inicial por rota (gzip):');
  for (const rota of ['/', '/queijos/canastra-curado', '/checkout', '/sacola']) {
    const pagina = paginas.get(rota);
    if (!pagina) continue;
    const total = await soma(pagina.scripts);
    console.log(
      `  ${rota.padEnd(28)} ${kb(total)} (+${kb(total - totalCompartilhado)} sobre o compartilhado)`,
    );
  }
  console.log(
    `  ${'/queijos (dinâmica)'.padEnd(28)} ${kb(totalCompartilhado)} (só o compartilhado)`,
  );

  // Orçamento da etapa 5 (ADR-0009), em kB (1024 bytes) gzip, sobre a linha de base de
  // 2026-11-03 (commit cdae7aa, antes do 3D).
  const totais = new Map();
  for (const [rota, pagina] of paginas) totais.set(rota, await soma(pagina.scripts));
  const kbDe = (bytes) => bytes / 1024;
  const orcamento = [
    ['compartilhado', kbDe(totalCompartilhado), ORCAMENTO.compartilhado],
    ['/', kbDe(totais.get('/') ?? 0), ORCAMENTO['/']],
    ['/queijos', kbDe(totalCompartilhado), ORCAMENTO['/queijos']],
    [
      '/queijos/canastra-curado',
      kbDe(totais.get('/queijos/canastra-curado') ?? 0),
      ORCAMENTO['/queijos/canastra-curado'],
    ],
  ];
  const NL0 = String.fromCharCode(10);
  console.log(`${NL0}Orçamento (limite = linha de base + folga):`);
  for (const [nome, valor, limite] of orcamento) {
    const ok = valor <= limite + 0.005;
    if (!ok) process.exitCode = 1;
    console.log(
      `  ${ok ? 'ok  ' : 'ACIMA'} ${nome.padEnd(28)} ${valor.toFixed(2)} kB (limite ${limite.toFixed(2)} kB)`,
    );
  }

  // ADR-0009: o JavaScript inicial de nenhuma página pode conter o 3D. Os nomes dos arquivos
  // são hashes do Turbopack, então a checagem lê o CONTEÚDO dos scripts iniciais.
  const MARCAS_DO_3D = [/model-viewer/i, /ModelViewerElement/, /WebGLRenderer/, /ModeloDoQueijo/];
  const citam = [];
  const jaLidos = new Map();
  for (const [rota, pagina] of paginas) {
    for (const script of pagina.scripts) {
      if (!jaLidos.has(script)) {
        const conteudo = await readFile(`${pastaEstatica}${script.replace('/_next', '')}`, 'utf8');
        jaLidos.set(script, MARCAS_DO_3D.find((m) => m.test(conteudo)) ?? null);
      }
      const marca = jaLidos.get(script);
      if (marca) citam.push(`${rota} (${script}: ${marca})`);
    }
  }
  const NL = String.fromCharCode(10);
  console.log(
    citam.length === 0
      ? `${NL}Nenhum dos ${jaLidos.size} scripts iniciais contém marcas do 3D (model-viewer, WebGLRenderer, ModeloDoQueijo).`
      : `${NL}ATENÇÃO: scripts iniciais com marcas do 3D:${NL}  ${citam.join(`${NL}  `)}`,
  );
  if (citam.length > 0) process.exitCode = 1;

  // O gerador A.6 (CheeseIllustration) é baixado sob demanda pelo painel: não pode voltar ao
  // pacote compartilhado (orçamento da etapa 6). Marcas: o viewBox da A.6 e o rótulo acessível.
  const MARCAS_DA_ILUSTRACAO = [/0 0 300 190/, /, ilustração do queijo/];
  const comIlustracao = [];
  for (const script of compartilhado) {
    const conteudo = await readFile(`${pastaEstatica}${script.replace('/_next', '')}`, 'utf8');
    if (MARCAS_DA_ILUSTRACAO.every((m) => m.test(conteudo))) comIlustracao.push(script);
  }
  if (comIlustracao.length > 0) {
    console.log(
      `${NL}ATENÇÃO: o código de CheeseIllustration voltou ao pacote compartilhado:${NL}  ${comIlustracao.join(`${NL}  `)}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`${NL}CheeseIllustration ausente do pacote compartilhado.`);
  }

  // ADR-0012: o painel de atendimento (SupportPanel + conversa) é um chunk tardio, montado na
  // primeira abertura. Marcas: o título do painel e a linha de status, que só ele contém.
  const MARCAS_DO_PAINEL = [/Assistente do Ateli/, /Responde na hora, 24 horas/];
  const comPainel = [];
  for (const script of new Set([...paginas.values()].flatMap((p) => [...p.scripts]))) {
    const conteudo = await readFile(`${pastaEstatica}${script.replace('/_next', '')}`, 'utf8');
    if (MARCAS_DO_PAINEL.every((m) => m.test(conteudo))) comPainel.push(script);
  }
  if (comPainel.length > 0) {
    console.log(
      `${NL}ATENÇÃO: o painel de atendimento voltou ao pacote inicial:${NL}  ${comPainel.join(`${NL}  `)}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `${NL}Painel de atendimento ausente dos scripts iniciais (chunk tardio, ADR-0012).`,
    );
  }

  // Chunk tardio do motor do assistente: não pode ser script inicial nem estar citado no HTML.
  const iniciais = new Set([...jaLidos.keys()]);
  // Literal da §8.2 (passagem para humano) que só existe em lib/roteiro.ts: não depende de lacunas.
  const MARCA_DO_MOTOR = /Vou chamar um queijista da nossa equipe/;
  const doMotor = [];
  for (const arquivo of await listarJs(`${pastaEstatica}/static/chunks`)) {
    const noSite = `/_next/static/chunks/${arquivo}`;
    const conteudo = await readFile(`${pastaEstatica}/static/chunks/${arquivo}`, 'utf8');
    if (!MARCA_DO_MOTOR.test(conteudo)) continue;
    if (iniciais.has(noSite)) {
      console.log(`${NL}ATENÇÃO: o motor do assistente está num script inicial: ${noSite}`);
      process.exitCode = 1;
    } else {
      doMotor.push(noSite);
    }
  }
  if (doMotor.length === 0) {
    console.log(
      `${NL}Chunk tardio do motor: nenhum encontrado (o roteiro está no pacote inicial?).`,
    );
    process.exitCode = 1;
  } else {
    const totalMotor = await soma(doMotor);
    const okMotor = kbDe(totalMotor) <= ORCAMENTO.chunkDoMotor;
    if (!okMotor) process.exitCode = 1;
    const citadosMotor = [...paginas].filter(([, pagina]) =>
      doMotor.some((t) => pagina.html.includes(t.replace('/_next/static/chunks/', ''))),
    );
    if (citadosMotor.length > 0) process.exitCode = 1;
    console.log(
      `${NL}Chunk tardio do motor do assistente: ${kb(totalMotor)} gzip em ${doMotor.length} arquivo(s) (limite ${ORCAMENTO.chunkDoMotor} kB) ${okMotor ? 'ok' : 'ACIMA'}; ${citadosMotor.length === 0 ? 'ausente do HTML de todas as páginas' : 'ATENÇÃO: citado no HTML de ' + citadosMotor.map(([r]) => r).join(', ')}`,
    );
  }

  // Chunk tardio: arquivos que não são scripts iniciais de página alguma e trazem o 3D.
  const tardios = [];
  for (const arquivo of await listarJs(`${pastaEstatica}/static/chunks`)) {
    const noSite = `/_next/static/chunks/${arquivo}`;
    if (iniciais.has(noSite)) continue;
    const conteudo = await readFile(`${pastaEstatica}/static/chunks/${arquivo}`, 'utf8');
    if (MARCAS_DO_3D.some((m) => m.test(conteudo))) tardios.push(noSite);
  }
  if (tardios.length === 0) {
    console.log(
      `${NL}Chunk tardio do 3D: nenhum encontrado (a biblioteca está no pacote inicial?).`,
    );
    process.exitCode = 1;
    return;
  }
  const totalTardio = await soma(tardios);
  const okTardio = kbDe(totalTardio) <= ORCAMENTO.chunkTardio;
  if (!okTardio) process.exitCode = 1;
  console.log(
    `${NL}Chunk tardio do 3D (ModeloDoQueijo + model-viewer + three): ${kb(totalTardio)} gzip em ${tardios.length} arquivo(s) (limite ${ORCAMENTO.chunkTardio} kB) ${okTardio ? 'ok' : 'ACIMA'}`,
  );
  // Nunca citado no HTML (nem como <script>, nem como preload).
  const citados = [];
  for (const [rota, pagina] of paginas) {
    for (const t of tardios) {
      if (pagina.html.includes(t.replace('/_next/static/chunks/', '')))
        citados.push(`${rota}: ${t}`);
    }
  }
  console.log(
    citados.length === 0
      ? 'Nenhuma página pré-renderizada cita o chunk tardio no HTML.'
      : `ATENÇÃO: HTML cita o chunk tardio:${NL}  ${citados.join(`${NL}  `)}`,
  );
  if (citados.length > 0) process.exitCode = 1;
}

async function listarJs(pasta) {
  return (await readdir(pasta)).filter((f) => f.endsWith('.js'));
}

const PORTA = 3217;
const LIMITE_PARA_SUBIR_MS = 30_000;

async function responde(url) {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

/** Sobe `next start` e espera responder; falha com erro claro se a porta estiver ocupada, se o processo sair ou se passar de 30 s. */
async function subirServidor(base) {
  if (await responde(base)) {
    throw new Error(`A porta ${PORTA} já responde: feche o que a usa ou defina URL_BASE.`);
  }
  const servidor = spawn(
    process.execPath,
    [`${raiz}node_modules/next/dist/bin/next`, 'start', '-H', '127.0.0.1', '-p', String(PORTA)],
    { cwd: raiz, stdio: 'ignore' },
  );
  let saiu = false;
  servidor.once('exit', () => (saiu = true));
  servidor.once('error', () => (saiu = true));
  const limite = Date.now() + LIMITE_PARA_SUBIR_MS;
  while (Date.now() < limite) {
    if (saiu) throw new Error('O `next start` terminou antes de responder (rode `npm run build`).');
    if (await responde(base)) return servidor;
    await new Promise((ok) => setTimeout(ok, 300));
  }
  await derrubar(servidor);
  throw new Error(`O servidor não respondeu em ${LIMITE_PARA_SUBIR_MS / 1000} s.`);
}

/** Encerra o servidor (e filhos, no Windows) e espera a saída. */
async function derrubar(servidor) {
  if (!servidor || servidor.exitCode !== null || servidor.signalCode !== null) return;
  const saida = new Promise((ok) => servidor.once('exit', ok));
  if (process.platform === 'win32') {
    // Só a árvore deste PID (não mexe em outros processos node).
    spawnSync('taskkill', ['/PID', String(servidor.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    servidor.kill();
  }
  await Promise.race([saida, new Promise((ok) => setTimeout(ok, 5000))]);
}

async function medirWebVitals() {
  const { chromium, devices } = await import('@playwright/test');
  // Sobe o próprio `next start` (a menos que URL_BASE aponte para um servidor já rodando).
  let servidor = null;
  let navegador = null;
  try {
    let base = process.env.URL_BASE;
    if (!base) {
      base = `http://127.0.0.1:${PORTA}`;
      servidor = await subirServidor(base);
    }
    navegador = await chromium.launch();
    for (const rota of ['/', '/queijos/canastra-curado']) {
      const contexto = await navegador.newContext({ ...devices['Pixel 7'] });
      const pagina = await contexto.newPage();
      await pagina.addInitScript(() => {
        window.__vitais = { lcp: 0, cls: 0 };
        new PerformanceObserver((lista) => {
          for (const e of lista.getEntries()) window.__vitais.lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((lista) => {
          for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__vitais.cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await pagina.goto(`${base}${rota}`, { waitUntil: 'load' });
      await pagina.waitForTimeout(3000);
      const { lcp, cls } = await pagina.evaluate(() => window.__vitais);
      console.log(`${rota.padEnd(28)} LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(4)}`);
      await contexto.close();
    }
  } finally {
    await navegador?.close();
    await derrubar(servidor);
  }
}

if (process.argv.includes('--web-vitals')) await medirWebVitals();
else await medirPacote();
