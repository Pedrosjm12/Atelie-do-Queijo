// Conferência pós-build (`postbuild` no package.json). Sem dependências.
//
// Sempre: o número de WhatsApp fictício (data/ficticio.ts) não pode estar em `.next/static`
// (arquivos servidos ao navegador; P74).
// Com `VERCEL_ENV=production`: nenhum "[A DEFINIR" pode estar no HTML/RSC pré-renderizado em
// `.next/server/app` (pega lacunas fixas no JSX que a trava P73 sobre dados não enxerga).
//
// Uso manual: `node scripts/conferir-build.mjs` (ou `VERCEL_ENV=production node ...` para simular).
// Também reaproveitado por `scripts/medir-pacote.mjs`.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raizPadrao = fileURLToPath(new URL('../', import.meta.url));
const NL = String.fromCharCode(10);

/** Todos os arquivos (recursivo) de uma pasta. */
export async function listarTudo(pasta) {
  const achados = [];
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    const caminho = `${pasta}/${item.name}`;
    if (item.isDirectory()) achados.push(...(await listarTudo(caminho)));
    else achados.push(caminho);
  }
  return achados;
}

/** Arquivos de `.next/static` que contêm o número fictício do WhatsApp. */
export async function arquivosComNumeroFicticio(raiz = raizPadrao) {
  const fonte = await readFile(`${raiz}data/ficticio.ts`, 'utf8');
  const numero = fonte.match(/NUMERO_WHATSAPP_FICTICIO\s*=\s*'(\d+)'/)?.[1];
  if (!numero)
    throw new Error(
      'data/ficticio.ts mudou: ajuste ou remova conferirNumeroFicticio em scripts/conferir-build.mjs (P74).',
    );
  const comNumero = [];
  for (const arquivo of await listarTudo(`${raiz}.next/static`)) {
    if ((await readFile(arquivo, 'latin1')).includes(numero)) comNumero.push(arquivo);
  }
  return comNumero;
}

/** Imprime o resultado e devolve `true` se estiver tudo certo (P74). */
export async function conferirNumeroFicticio(raiz = raizPadrao) {
  const comNumero = await arquivosComNumeroFicticio(raiz);
  if (comNumero.length > 0) {
    console.log(
      `${NL}ATENÇÃO: o número fictício do WhatsApp aparece em .next/static:${NL}  ${comNumero.join(`${NL}  `)}`,
    );
    return false;
  }
  console.log(`${NL}O número fictício do WhatsApp não aparece em .next/static.`);
  return true;
}

/** Ocorrências de "[A DEFINIR" em `.next/server/app/**` (*.html e *.rsc): `{ arquivo, trecho }`. */
export async function lacunasNoBuild(raiz = raizPadrao) {
  const achadas = [];
  for (const arquivo of await listarTudo(`${raiz}.next/server/app`)) {
    if (!/\.(html|rsc)$/.test(arquivo)) continue;
    const texto = await readFile(arquivo, 'utf8');
    const vistos = new Set();
    for (const m of texto.matchAll(/\[A DEFINIR/g)) {
      const fim = texto.indexOf(']', m.index);
      const trecho = texto
        .slice(m.index, fim === -1 || fim - m.index > 120 ? m.index + 80 : fim + 1)
        .replace(/\s+/g, ' ');
      if (vistos.has(trecho)) continue;
      vistos.add(trecho);
      achadas.push({ arquivo: arquivo.slice(raiz.length), trecho });
    }
  }
  return achadas;
}

/** Imprime o resultado e devolve `true` se estiver tudo certo. Só confere com `VERCEL_ENV=production`. */
export async function conferirLacunas(raiz = raizPadrao, vercelEnv = process.env.VERCEL_ENV) {
  if (vercelEnv !== 'production') {
    console.log('Lacunas "[A DEFINIR": conferidas só com VERCEL_ENV=production (ignorado aqui).');
    return true;
  }
  const achadas = await lacunasNoBuild(raiz);
  if (achadas.length === 0) {
    console.log('Nenhum "[A DEFINIR" em .next/server/app (HTML e RSC).');
    return true;
  }
  console.log(
    `${NL}ATENÇÃO: ${achadas.length} lacuna(s) "[A DEFINIR" no build de produção:${NL}${achadas
      .map((a) => `  ${a.arquivo}: ${a.trecho}`)
      .join(NL)}`,
  );
  return false;
}

export async function conferirBuild(raiz = raizPadrao, vercelEnv = process.env.VERCEL_ENV) {
  const numeroOk = await conferirNumeroFicticio(raiz);
  const lacunasOk = await conferirLacunas(raiz, vercelEnv);
  return numeroOk && lacunasOk;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!(await conferirBuild())) {
    console.error(`${NL}Conferência pós-build falhou.`);
    process.exitCode = 1;
  }
}
