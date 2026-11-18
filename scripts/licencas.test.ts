import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  arquivosDeLicenca,
  formatar,
  lerEntradas,
  nomeDoPacote,
  normalizarTexto,
  pacotesDeProducao,
} from './licencas.mjs';

const lock = {
  packages: {
    '': {},
    'node_modules/zeta': { version: '1.0.0', license: 'MIT', dependencies: { alfa: '^1' } },
    'node_modules/alfa': { version: '2.0.0', license: 'ISC' },
    'node_modules/zeta/node_modules/alfa': { version: '1.5.0', license: 'BSD-3-Clause' },
    'node_modules/bin-linux': { version: '3.0.0', license: 'MIT', optional: true, cpu: ['x64'] },
    'node_modules/opcional-puro': { version: '1.0.0', license: 'MIT', optional: true },
    'node_modules/com-bin': {
      version: '1.0.0',
      license: 'MIT',
      optionalDependencies: { 'bin-linux': '3.0.0', 'opcional-puro': '1.0.0' },
    },
    'node_modules/so-dev': { version: '9.0.0', license: 'MIT', dev: true },
    'node_modules/peer-opcional': { version: '1.0.0', license: 'MIT', devOptional: true },
  },
};
const pkg = {
  dependencies: { zeta: '1.0.0', 'com-bin': '1.0.0' },
  devDependencies: { 'so-dev': '9' },
};

describe('licencas', () => {
  it('extrai o nome do pacote, inclusive escopo e aninhamento', () => {
    expect(nomeDoPacote('node_modules/@a/b')).toBe('@a/b');
    expect(nomeDoPacote('node_modules/x/node_modules/y')).toBe('y');
  });

  it('segue a árvore de produção e ignora dev e peers opcionais', () => {
    const nomes = pacotesDeProducao(lock, pkg).map((p) => `${p.nome}@${p.versao}`);
    expect(nomes).toEqual([
      'alfa@1.5.0',
      'bin-linux@3.0.0',
      'com-bin@1.0.0',
      'opcional-puro@1.0.0',
      'zeta@1.0.0',
    ]);
  });

  it('resolve a versão aninhada antes da da raiz e marca opcionais', () => {
    const lista = pacotesDeProducao(lock, pkg);
    expect(lista.find((p) => p.nome === 'alfa')?.licenca).toBe('BSD-3-Clause');
    expect(lista.find((p) => p.nome === 'bin-linux')?.opcional).toBe(true);
  });

  it('só trata como opcional o que tem restrição de plataforma', () => {
    const lista = pacotesDeProducao(lock, pkg);
    expect(lista.find((p) => p.nome === 'opcional-puro')?.opcional).toBe(false);
    expect(lista.find((p) => p.nome === 'alfa')?.opcional).toBe(false);
  });

  it('é determinística: a ordem do lockfile não muda a saída', () => {
    const invertido = {
      packages: Object.fromEntries(Object.entries(lock.packages).reverse()),
    };
    expect(pacotesDeProducao(invertido, pkg)).toEqual(pacotesDeProducao(lock, pkg));
  });

  it('escolhe só arquivos de licença, em ordem', () => {
    expect(
      arquivosDeLicenca(['README.md', 'NOTICE', 'package.json', 'LICENSE.txt', 'license-x.js']),
    ).toEqual(['LICENSE.txt', 'NOTICE']);
  });

  it('normaliza quebras de linha e espaços finais', () => {
    expect(normalizarTexto('﻿a  \r\nb\r\n\r\n')).toBe('a\nb');
  });

  it('formata nome, versão, licença e texto, sem caminhos locais', () => {
    const saida = formatar([
      {
        nome: 'x',
        versao: '1.0.0',
        licenca: 'MIT',
        opcional: false,
        textos: [
          { arquivo: 'LICENSE', texto: 'Texto MIT\r\n' },
          { arquivo: 'NOTICE', texto: 'Aviso' },
        ],
      },
      { nome: 'y', versao: '2.0.0', licenca: 'MIT', opcional: true, textos: [] },
    ]);
    expect(saida).toContain('x@1.0.0');
    expect(saida).toContain('Licença: MIT');
    expect(saida).toContain('--- NOTICE ---');
    expect(saida).toContain('Texto MIT\n');
    expect(saida).toContain('y@2.0.0');
    expect(saida).toContain('Binário específico de plataforma');
    expect(saida).not.toMatch(/node_modules|[A-Z]:\\|\/Users\/|\r/);
    expect(saida.endsWith('\n')).toBe(true);
  });
});

describe('lerEntradas (disco)', () => {
  let raiz = '';
  afterEach(() => rmSync(raiz, { recursive: true, force: true }));

  function pacote(nome: string, versao: string, arquivos: Record<string, string> = {}) {
    const dir = join(raiz, 'node_modules', nome);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: nome, version: versao }));
    for (const [arq, texto] of Object.entries(arquivos)) writeFileSync(join(dir, arq), texto);
  }
  const item = (nome: string, versao = '1.0.0', opcional = false) => ({
    chave: `node_modules/${nome}`,
    nome,
    versao,
    licenca: 'MIT',
    opcional,
  });
  const novaRaiz = () => (raiz = mkdtempSync(join(tmpdir(), 'licencas-')));

  it('lê LICENSE e NOTICE do pacote (caminho feliz)', () => {
    novaRaiz();
    pacote('ok', '1.0.0', { LICENSE: 'Texto', NOTICE: 'Aviso', 'index.js': '' });
    const [e] = lerEntradas(raiz, [item('ok')]);
    expect(e.textos.map((t: { arquivo: string }) => t.arquivo)).toEqual(['LICENSE', 'NOTICE']);
  });

  it('usa o substituto declarado quando o pacote não tem licença', () => {
    novaRaiz();
    pacote('client-only', '1.0.0');
    pacote('react', '19.0.0', { LICENSE: 'MIT do react' });
    const [e] = lerEntradas(raiz, [item('client-only')]);
    expect(e.textos[0].texto).toBe('MIT do react');
    expect(e.textos[0].arquivo).toContain('do pacote react');
  });

  it('falha com erro claro se o pacote está ausente', () => {
    novaRaiz();
    expect(() => lerEntradas(raiz, [item('sumiu')])).toThrow(/ausente.*npm ci/);
  });

  it('falha se o pacote não tem LICENSE nem substituto', () => {
    novaRaiz();
    pacote('sem-licenca', '1.0.0', { 'index.js': '' });
    expect(() => lerEntradas(raiz, [item('sem-licenca')])).toThrow(/Nenhum arquivo LICENSE/);
  });

  it('falha se a versão instalada difere do lockfile', () => {
    novaRaiz();
    pacote('velho', '1.0.0', { LICENSE: 'x' });
    expect(() => lerEntradas(raiz, [item('velho', '2.0.0')])).toThrow(/npm ci/);
  });

  it('recusa nomes inválidos e caminhos fora de node_modules', () => {
    novaRaiz();
    expect(() => lerEntradas(raiz, [item('../fora')])).toThrow(/inválido/);
    expect(() => lerEntradas(raiz, [item('a/../../b')])).toThrow(/inválido/);
  });

  it('não lê o texto de binários de plataforma', () => {
    novaRaiz();
    const [e] = lerEntradas(raiz, [item('bin', '1.0.0', true)]);
    expect(e.textos).toEqual([]);
  });
});
