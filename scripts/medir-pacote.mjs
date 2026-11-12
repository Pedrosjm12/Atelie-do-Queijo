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
// Com `--web-vitals`, mede LCP, CLS, TBT (aproximado pelas tarefas longas após o FCP) e o elemento de
// LCP de `/`, do produto, de `/sacola` (vazia, 1 e 3 itens, 1 item com presente) e de `/presentes` no Chromium do Playwright
// (Pixel 7, CPU 4x mais lenta, rede sem estrangulamento), mediana de 3 execuções. Não é a nota do
// Lighthouse: serve para comparar antes e depois. REDUCAO_DE_CPU=1 desliga a redução.
// LCP e CLS acima do limite fazem o script falhar; o TBT só é informado (o Lighthouse decide).

import { readdir, readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { conferirNumeroFicticio } from './conferir-build.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const pastaApp = `${raiz}.next/server/app`;
const pastaEstatica = `${raiz}.next`;
// Limites recalibrados em 2026-11-05 (ADR-0012, atualização): o método passou a IGNORAR os
// `<script noModule>` (polyfills que navegadores modernos não baixam; ~38,7 kB gzip). Cada limite =
// valor medido por esse método (após o painel de atendimento virar chunk tardio) + folga de 3 kB
// gzip por rota. Medidos: compartilhado 140,88; `/` 145,34; produto 151,99 (kB gzip).
const ROTA_404 = '/404 (_not-found)';
const ORCAMENTO = {
  compartilhado: 140.88 + 3.0,
  '/': 145.34 + 3.0,
  '/queijos': 140.88 + 3.0,
  '/queijos/canastra-curado': 151.99 + 3.0,
  // Rotas novas da etapa 8 (tarefa 14, medidas em 2026-11-11): medido + 3 kB gzip (ADR-0012).
  // Medidos: /presentes 142,81; /aprenda 141,93; /aprenda/<slug> 142,21; /produtores 141,93;
  // /sacola 145,02; /checkout 168,06; 404 141,93; painel 5,63 (kB gzip).
  // Os outros 9 `/queijos/<slug>` pesam o mesmo que `/queijos/canastra-curado` (mesmo limite).
  '/presentes': 142.81 + 3.0,
  '/aprenda': 141.93 + 3.0,
  '/aprenda/como-montar-uma-tabua-de-queijos': 142.21 + 3.0,
  '/aprenda/queijo-e-vinho': 142.21 + 3.0,
  '/aprenda/como-guardar-queijo-na-geladeira': 142.21 + 3.0,
  '/produtores': 141.93 + 3.0,
  '/sacola': 145.02 + 3.0,
  '/checkout': 168.06 + 3.0,
  [ROTA_404]: 141.93 + 3.0,
  chunkDoPainel: 5.63 + 3.0,
  chunkTardio: 350,
  // Motor do assistente (lib/roteiro + cartões + quiz), carregado ao abrir o painel (ADR-0010).
  chunkDoMotor: 12,
};
const IGNORADAS = new Set(['_global-error.html']);

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
  arquivo === 'index.html'
    ? '/'
    : arquivo === '_not-found.html'
      ? ROTA_404
      : `/${arquivo.replace(/\.html$/, '')}`;

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
  for (const rota of [...paginas.keys()].sort()) {
    const pagina = paginas.get(rota);
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
  // Toda outra rota pré-renderizada precisa de limite próprio em ORCAMENTO (medido + 3 kB, ADR-0012).
  for (const [rota, total] of totais) {
    if (['/', '/queijos/canastra-curado'].includes(rota)) continue;
    const limite = rota.startsWith('/queijos/')
      ? ORCAMENTO['/queijos/canastra-curado']
      : ORCAMENTO[rota];
    if (limite === undefined) {
      console.log(`  SEM LIMITE ${rota.padEnd(28)} ${kbDe(total).toFixed(2)} kB`);
      process.exitCode = 1;
    } else {
      orcamento.push([rota, kbDe(total), limite]);
    }
  }
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

  // Chunk tardio do painel: limite próprio (medido + 3 kB).
  const iniciais = new Set([...jaLidos.keys()]);
  const doPainel = [];
  for (const arquivo of await listarJs(`${pastaEstatica}/static/chunks`)) {
    const noSite = `/_next/static/chunks/${arquivo}`;
    if (iniciais.has(noSite)) continue;
    const conteudo = await readFile(`${pastaEstatica}/static/chunks/${arquivo}`, 'utf8');
    if (MARCAS_DO_PAINEL.every((m) => m.test(conteudo))) doPainel.push(noSite);
  }
  if (doPainel.length === 0) {
    console.log(`${NL}Chunk tardio do painel: nenhum encontrado.`);
    process.exitCode = 1;
  } else {
    const totalPainel = await soma(doPainel);
    const okPainel = kbDe(totalPainel) <= ORCAMENTO.chunkDoPainel + 0.005;
    if (!okPainel) process.exitCode = 1;
    console.log(
      `${NL}Chunk tardio do painel de atendimento: ${kb(totalPainel)} gzip em ${doPainel.length} arquivo(s) (limite ${ORCAMENTO.chunkDoPainel.toFixed(2)} kB) ${okPainel ? 'ok' : 'ACIMA'}`,
    );
  }

  // Chunk tardio do motor do assistente: não pode ser script inicial nem estar citado no HTML.
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

const SACOLA_1 = [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }];
const SACOLA_3 = [
  { slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 },
  { slug: 'creme-do-marajo', formatoId: 'fracao', quantidade: 1 },
  { slug: 'cabra-com-cinzas', formatoId: 'peca', quantidade: 1 },
];
// Cenários do bloco E (P76 = A): rota e, se houver, os itens semeados no `localStorage`.
const CENARIOS = [
  { nome: '/', rota: '/' },
  { nome: '/queijos/canastra-curado', rota: '/queijos/canastra-curado' },
  { nome: '/sacola (vazia)', rota: '/sacola' },
  { nome: '/sacola (1 item)', rota: '/sacola', itens: SACOLA_1 },
  { nome: '/sacola (3 itens)', rota: '/sacola', itens: SACOLA_3 },
  { nome: '/sacola (1 item + presente)', rota: '/sacola', itens: SACOLA_1, presente: true },
  { nome: '/presentes', rota: '/presentes' },
];
const LIMITES_VITAIS = { lcp: 2500, cls: 0.1, tbt: 200 };
// Ímpar: a mediana pega o valor do meio.
const EXECUCOES = 3;
const REDUCAO_DE_CPU = Number(process.env.REDUCAO_DE_CPU ?? 4);
if (!Number.isFinite(REDUCAO_DE_CPU) || REDUCAO_DE_CPU < 1) {
  throw new Error(`REDUCAO_DE_CPU inválida (${process.env.REDUCAO_DE_CPU}): use um número ≥ 1.`);
}

const mediana = (valores) => [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)];

/**
 * Uma execução: contexto novo (cache vazio), Pixel 7 emulado, CPU 4x mais lenta (CDP) e rede sem
 * estrangulamento (servidor local). TBT aproximado = soma de (duração − 50 ms) das tarefas longas
 * (`longtask`), cada uma recortada a partir do First Contentful Paint, até 3 s depois do `load`.
 */
async function umaExecucao(navegador, devices, base, cenario) {
  const contexto = await navegador.newContext({ ...devices['Pixel 7'] });
  try {
    const pagina = await contexto.newPage();
    if (REDUCAO_DE_CPU > 1) {
      const cdp = await contexto.newCDPSession(pagina);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: REDUCAO_DE_CPU });
    }
    if (cenario.itens) {
      await pagina.addInitScript(
        ([chave, sacola]) => localStorage.setItem(chave, JSON.stringify(sacola)),
        // Chave = CHAVE_DA_SACOLA (lib/sacola.ts; o .mjs não importa TS). lib/sacola.test.ts trava o valor.
        ['atelie:sacola:v1', { v: 1, itens: cenario.itens, presente: cenario.presente === true }],
      );
    }
    await pagina.addInitScript(() => {
      const v = (window.__vitais = { lcp: 0, elemento: '', cls: 0, fcp: 0, tarefas: [] });
      const descrever = (e) => {
        const el = e.element;
        if (!el) return e.url ? `(sem elemento) ${e.url}` : '(sem elemento)';
        const marca = `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}>`;
        const texto = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
        const pai = el.closest('[data-testid],section,main,header,article,form');
        const ondeFica = pai ? `${pai.tagName.toLowerCase()}${pai.id ? `#${pai.id}` : ''}` : '';
        return `${marca}${ondeFica ? ` em ${ondeFica}` : ''}${texto ? ` "${texto}"` : ''}${e.url ? ` ${e.url.slice(-60)}` : ''}`;
      };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          v.lcp = e.startTime;
          v.elemento = descrever(e);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) v.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (e.name === 'first-contentful-paint') v.fcp = e.startTime;
      }).observe({ type: 'paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) v.tarefas.push([e.startTime, e.duration]);
      }).observe({ type: 'longtask', buffered: true });
    });
    await pagina.goto(`${base}${cenario.rota}`, { waitUntil: 'load' });
    await pagina.waitForTimeout(3000);
    const v = await pagina.evaluate(() => window.__vitais);
    // Como o Lighthouse: cada tarefa é recortada a partir do FCP antes de descontar os 50 ms.
    const tbt = v.tarefas.reduce((s, [inicio, dur]) => {
      const fim = inicio + dur;
      if (fim <= v.fcp) return s;
      return s + Math.max(0, fim - Math.max(inicio, v.fcp) - 50);
    }, 0);
    return { lcp: v.lcp, cls: v.cls, tbt, elemento: v.elemento };
  } finally {
    await contexto.close();
  }
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
    const linhas = [];
    for (const cenario of CENARIOS) {
      const rodadas = [];
      for (let i = 0; i < EXECUCOES; i++) {
        rodadas.push(await umaExecucao(navegador, devices, base, cenario));
      }
      // Mediana por métrica; o elemento é o da execução cuja LCP é a mediana.
      const porLcp = [...rodadas].sort((a, b) => a.lcp - b.lcp);
      const med = {
        lcp: mediana(rodadas.map((r) => r.lcp)),
        cls: mediana(rodadas.map((r) => r.cls)),
        tbt: mediana(rodadas.map((r) => r.tbt)),
        elemento: porLcp[Math.floor(porLcp.length / 2)].elemento,
      };
      const desvios = [];
      if (med.lcp > LIMITES_VITAIS.lcp) desvios.push('LCP');
      if (med.cls > LIMITES_VITAIS.cls) desvios.push('CLS');
      // LCP e CLS reprovam. O TBT só informa: com a CPU reduzida por CDP ele depende da máquina e da
      // carga do momento (a mesma página variou de 29 a 389 ms) e ~85% é hidratação do React e do
      // Next. Quem decide o TBT é o Lighthouse manual (P76 = A; decisão do dono em 2026-11-12).
      if (desvios.length > 0) process.exitCode = 1;
      if (med.tbt > LIMITES_VITAIS.tbt) desvios.push('TBT (informativo)');
      linhas.push({ nome: cenario.nome, ...med, desvios });
      console.log(
        `${cenario.nome.padEnd(26)} LCP ${Math.round(med.lcp)} ms, CLS ${med.cls.toFixed(4)}, TBT ${Math.round(med.tbt)} ms${desvios.length ? ` ACIMA: ${desvios.join(', ')}` : ''}\n  elemento de LCP: ${med.elemento}`,
      );
    }
    console.log(
      `\nMediana de ${EXECUCOES} execuções, Pixel 7 emulado, CPU ${REDUCAO_DE_CPU}x mais lenta, sem estrangulamento de rede. Limites: LCP ≤ 2500 ms e CLS ≤ 0,1 (reprovam); TBT ≤ 200 ms só informa (o Lighthouse decide).\n`,
    );
    console.log('| Rota | LCP (ms) | CLS | TBT (ms) | Elemento de LCP | Desvio |');
    console.log('| --- | ---: | ---: | ---: | --- | --- |');
    for (const l of linhas) {
      console.log(
        `| \`${l.nome}\` | ${Math.round(l.lcp)} | ${l.cls.toFixed(4)} | ${Math.round(l.tbt)} | ${l.elemento.replace(/\|/g, '\\|')} | ${l.desvios.join(', ') || 'não'} |`,
      );
    }
  } finally {
    await navegador?.close();
    await derrubar(servidor);
  }
}

if (process.argv.includes('--web-vitals')) await medirWebVitals();
else {
  await medirPacote();
  // P74: o número fictício não pode estar em nenhum arquivo servido ao navegador.
  if (!(await conferirNumeroFicticio(raiz))) process.exitCode = 1;
}
