#!/usr/bin/env node
// Avisos de licença de terceiros (ADR-0016, decisão 6; ADR-0009).
// Lê o package-lock.json, pega só os pacotes de produção e gera `public/licencas-de-terceiros.txt`
// com nome, versão, licença e o texto dos arquivos LICENSE/NOTICE lidos de node_modules.
//   node scripts/licencas.mjs gerar     grava o arquivo
//   node scripts/licencas.mjs conferir  falha se o arquivo commitado difere do gerado
// A lógica é pura (testada em licencas.test.ts); a leitura de disco fica em `main`.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SAIDA = 'public/licencas-de-terceiros.txt';

// Pacotes publicados sem arquivo de licença: o texto vem de outro pacote do mesmo repositório
// (verificado à mão; a licença declarada no package.json é a mesma). Revisar a cada atualização.
export const SUBSTITUTOS = {
  // Monorepo lit/lit (BSD-3-Clause); o pacote `lit` traz o LICENSE do repositório.
  '@lit-labs/ssr-dom-shim': 'lit',
  // Monorepo vercel/next.js (MIT); o pacote `next` traz o license.md do repositório.
  '@next/env': 'next',
  // Pacote marcador publicado pela equipe do React (MIT, bugs em facebook/react); usa o LICENSE do `react`.
  'client-only': 'react',
};

const PADRAO_ARQUIVO = /^(licen[cs]e|notice|copying)(\.[a-z]+)?$/i;

/** Nome do pacote a partir da chave do lockfile ("node_modules/a/node_modules/@b/c" -> "@b/c"). */
export function nomeDoPacote(chave) {
  const i = chave.lastIndexOf('node_modules/');
  return chave.slice(i + 'node_modules/'.length);
}

/** Resolve `nome` a partir da chave `deChave` como o Node: sobe pelos node_modules aninhados. */
function resolverChave(pacotes, deChave, nome) {
  let base = deChave;
  for (;;) {
    const tentativa = base ? `${base}/node_modules/${nome}` : `node_modules/${nome}`;
    if (pacotes[tentativa]) return tentativa;
    if (!base) return null;
    const i = base.lastIndexOf('/node_modules/');
    base = i === -1 ? '' : base.slice(0, i);
  }
}

/** Binário por plataforma: só o que tem restrição de os, cpu ou libc no lockfile. */
const porPlataforma = (i) => Boolean(i.os || i.cpu || i.libc);

const NOME_NPM = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/;
const porCodigo = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Pacotes de produção: a árvore a partir das `dependencies` do package.json, seguindo
 * `dependencies` e `optionalDependencies` (peers opcionais e devDependencies ficam fora).
 * Devolve [{ chave, nome, versao, licenca, opcional }] ordenado por nome e versão.
 */
export function pacotesDeProducao(lock, pkg) {
  const pacotes = lock.packages ?? {};
  const vistos = new Set();
  const fila = [];
  const visitar = (deChave, nome) => {
    const chave = resolverChave(pacotes, deChave, nome);
    if (!chave) return;
    if (vistos.has(chave)) return;
    vistos.add(chave);
    fila.push(chave);
  };
  for (const nome of Object.keys(pkg.dependencies ?? {})) visitar('', nome);
  for (let i = 0; i < fila.length; i++) {
    const info = pacotes[fila[i]];
    for (const nome of Object.keys({
      ...(info.dependencies ?? {}),
      ...(info.optionalDependencies ?? {}),
    })) {
      visitar(fila[i], nome);
    }
  }
  return fila
    .map((chave) => {
      const info = pacotes[chave];
      return {
        chave,
        nome: nomeDoPacote(chave),
        versao: info.version,
        licenca: typeof info.license === 'string' ? info.license : 'não declarada',
        opcional: porPlataforma(info),
      };
    })
    .sort(
      (a, b) =>
        porCodigo(a.nome, b.nome) || porCodigo(a.versao, b.versao) || porCodigo(a.chave, b.chave),
    );
}

/** Normaliza quebras de linha e espaços finais para a saída ser igual em qualquer sistema. */
export function normalizarTexto(texto) {
  return texto
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

/** Nomes de arquivos de licença (LICENSE, LICENCE, NOTICE, COPYING, com extensão opcional), ordenados. */
export function arquivosDeLicenca(nomes) {
  return nomes.filter((n) => PADRAO_ARQUIVO.test(n)).sort(porCodigo);
}

const LINHA = '='.repeat(72);

/**
 * Monta o texto final. `entradas`: [{ nome, versao, licenca, opcional, textos: [{ arquivo, texto }] }].
 * Binários específicos de plataforma (os/cpu/libc no lockfile) não têm o texto lido, porque só
 * existem em node_modules na plataforma que os instalou e a saída precisa ser igual em todas.
 */
export function formatar(entradas) {
  const cabecalho = [
    'AVISOS DE LICENÇA DE TERCEIROS',
    '',
    'O Ateliê do Queijo usa os pacotes de código aberto abaixo em produção.',
    'Cada pacote segue a sua própria licença, reproduzida a seguir.',
    `Total: ${entradas.length} pacotes.`,
    '',
    'Arquivo gerado por `npm run licencas:gerar` (scripts/licencas.mjs). Não edite à mão.',
  ].join('\n');
  const blocos = entradas.map((e) => {
    const linhas = [LINHA, `${e.nome}@${e.versao}`, `Licença: ${e.licenca}`, LINHA, ''];
    if (e.opcional) {
      linhas.push(
        'Binário específico de plataforma; o texto da licença acompanha o pacote publicado no npm.',
      );
    } else {
      for (const t of e.textos) {
        if (e.textos.length > 1) linhas.push(`--- ${t.arquivo} ---`, '');
        linhas.push(normalizarTexto(t.texto), '');
      }
    }
    return linhas.join('\n').trimEnd();
  });
  return `${[cabecalho, ...blocos].join('\n\n')}\n`;
}

/** Lê o texto de licença de cada pacote em node_modules. Falha com erro claro se faltar. */
export function lerEntradas(raiz, lista) {
  return lista.map((p) => {
    if (p.opcional) return { ...p, textos: [] };
    if (!NOME_NPM.test(p.nome) || p.nome.includes('..')) {
      throw new Error(`Nome de pacote inválido no lockfile: ${p.nome}`);
    }
    const modulos = resolve(raiz, 'node_modules');
    const dir = resolve(raiz, p.chave);
    if (!dir.startsWith(modulos + sep)) {
      throw new Error(`Caminho fora de node_modules: ${p.chave}`);
    }
    if (!existsSync(dir)) {
      throw new Error(
        `Pacote de produção ausente em node_modules: ${p.nome}@${p.versao}. Rode \`npm ci\` antes.`,
      );
    }
    const instalada = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
    if (instalada !== p.versao) {
      throw new Error(
        `${p.nome}: node_modules tem ${instalada}, o lockfile pede ${p.versao}. Rode \`npm ci\`.`,
      );
    }
    let arquivos = arquivosDeLicenca(readdirSync(dir));
    let dirTexto = dir;
    const origem = Object.hasOwn(SUBSTITUTOS, p.nome) ? SUBSTITUTOS[p.nome] : undefined;
    if (arquivos.length === 0 && origem) {
      dirTexto = join(modulos, origem);
      if (!existsSync(dirTexto)) {
        throw new Error(`Substituto \`${origem}\` de ${p.nome} ausente em node_modules.`);
      }
      arquivos = arquivosDeLicenca(readdirSync(dirTexto));
    }
    if (arquivos.length === 0) {
      throw new Error(
        `Nenhum arquivo LICENSE/NOTICE em ${p.nome}@${p.versao}. Registre a licença à mão (e justifique no ADR-0009) antes de seguir.`,
      );
    }
    return {
      ...p,
      textos: arquivos.map((arquivo) => ({
        arquivo: dirTexto === dir ? arquivo : `${arquivo} (do pacote ${origem}, mesmo repositório)`,
        texto: readFileSync(join(dirTexto, arquivo), 'utf8'),
      })),
    };
  });
}

export function gerarTexto(raiz) {
  const lock = JSON.parse(readFileSync(join(raiz, 'package-lock.json'), 'utf8'));
  const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
  return formatar(lerEntradas(raiz, pacotesDeProducao(lock, pkg)));
}

function main() {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const destino = join(raiz, SAIDA);
  const modo = process.argv[2];
  if (modo !== 'gerar' && modo !== 'conferir') {
    console.error('Uso: node scripts/licencas.mjs gerar|conferir');
    process.exit(2);
  }
  let texto;
  try {
    texto = gerarTexto(raiz);
  } catch (e) {
    console.error(`licencas: ${e.message}`);
    process.exit(1);
  }
  if (modo === 'gerar') {
    writeFileSync(destino, texto, 'utf8');
    console.log(`licencas: ${SAIDA} gravado.`);
    return;
  }
  const atual = existsSync(destino) ? readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') : null;
  if (atual !== texto) {
    console.error(
      `licencas: ${SAIDA} está desatualizado. Rode \`npm run licencas:gerar\` e commite.`,
    );
    process.exit(1);
  }
  console.log(`licencas: ${SAIDA} está em dia.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
