// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  arquivosComNumeroFicticio,
  conferirBuild,
  conferirLacunas,
  lacunasNoBuild,
} from './conferir-build.mjs';

let raiz = '';

beforeEach(async () => {
  const base = await mkdtemp(join(tmpdir(), 'conferir-build-'));
  raiz = `${base.replace(/\\/g, '/')}/`;
  await mkdir(`${raiz}data`, { recursive: true });
  await mkdir(`${raiz}.next/static/chunks`, { recursive: true });
  await mkdir(`${raiz}.next/server/app/queijos`, { recursive: true });
  await writeFile(
    `${raiz}data/ficticio.ts`,
    "export const NUMERO_WHATSAPP_FICTICIO = '5520900000000';",
  );
});

afterEach(async () => {
  await rm(raiz, { recursive: true, force: true });
});

describe('conferir-build', () => {
  it('acha o número fictício em .next/static e lista o arquivo', async () => {
    await writeFile(`${raiz}.next/static/chunks/a.js`, 'x="5520900000000"');
    await writeFile(`${raiz}.next/static/chunks/b.js`, 'ok');
    const achados = await arquivosComNumeroFicticio(raiz);
    expect(achados).toEqual([`${raiz}.next/static/chunks/a.js`]);
    expect(await conferirBuild(raiz, undefined)).toBe(false);
  });

  it('sem o número e sem VERCEL_ENV=production, ignora as lacunas', async () => {
    await writeFile(`${raiz}.next/server/app/index.html`, '<p>[A DEFINIR: x]</p>');
    expect(await conferirBuild(raiz, undefined)).toBe(true);
    expect(await conferirBuild(raiz, 'preview')).toBe(true);
  });

  it('com VERCEL_ENV=production, falha com "[A DEFINIR" em html e rsc, com arquivo e trecho', async () => {
    await writeFile(`${raiz}.next/server/app/index.html`, '<p>[A DEFINIR: queijos citados]</p>');
    await writeFile(`${raiz}.next/server/app/queijos/x.rsc`, '1:"[A DEFINIR: artigos]"');
    await writeFile(`${raiz}.next/server/app/queijos/x.meta`, '[A DEFINIR: ignorado]');
    const achadas = await lacunasNoBuild(raiz);
    expect(achadas).toEqual(
      expect.arrayContaining([
        { arquivo: '.next/server/app/index.html', trecho: '[A DEFINIR: queijos citados]' },
        { arquivo: '.next/server/app/queijos/x.rsc', trecho: '[A DEFINIR: artigos]' },
      ]),
    );
    expect(achadas).toHaveLength(2);
    expect(await conferirLacunas(raiz, 'production')).toBe(false);
    expect(await conferirBuild(raiz, 'production')).toBe(false);
  });

  it('com VERCEL_ENV=production e build limpo, passa', async () => {
    await writeFile(`${raiz}.next/server/app/index.html`, '<p>Queijo</p>');
    expect(await conferirBuild(raiz, 'production')).toBe(true);
  });

  it('"[A DEFINIR" sem "]" por perto: trecho curto (80 caracteres) e sem duplicar a mesma lacuna no arquivo', async () => {
    const longo = `[A DEFINIR ${'x'.repeat(300)}`;
    await writeFile(`${raiz}.next/server/app/index.html`, `${longo} ${longo}`);
    await writeFile(`${raiz}.next/server/app/dois.html`, '[A DEFINIR: a][A DEFINIR: a]');
    const achadas = await lacunasNoBuild(raiz);
    const doIndex = achadas.filter((a) => a.arquivo.endsWith('index.html'));
    expect(doIndex).toHaveLength(1);
    expect(doIndex[0]?.trecho).toHaveLength(80);
    expect(achadas.filter((a) => a.arquivo.endsWith('dois.html'))).toHaveLength(1);
  });

  it('o número fictício só em .next/server (HTML do servidor) não conta como vazamento para o navegador', async () => {
    await writeFile(`${raiz}.next/server/app/index.html`, '5520900000000');
    expect(await arquivosComNumeroFicticio(raiz)).toEqual([]);
  });
});
