// Medição do JavaScript inicial (método do ADR-0007, agora versionado).
//
// Uso:
//   npm run build && npm run medir:pacote
//   npm run medir:pacote -- --web-vitals   (sobe o próprio `next start` na porta 3217 (falha se ela já responder); defina URL_BASE para usar outro servidor)
//
// O Next 16 (Turbopack) não imprime a tabela "First Load JS". Por isso a medição lê os arquivos
// gerados: cada HTML pré-renderizado em `.next/server/app` (exceto `_not-found` e `_global-error`)
// lista seus `<script src="/_next/static/...js">`; cada arquivo é comprimido com gzip (padrão do
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
    for (const m of html.matchAll(/<script[^>]+src="(\/_next\/static\/[^"?]+\.js)(?:\?[^"]*)?"/g)) {
      scripts.add(m[1]);
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
    [`${raiz}node_modules/next/dist/bin/next`, 'start', '-p', String(PORTA)],
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
      base = `http://localhost:${PORTA}`;
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
