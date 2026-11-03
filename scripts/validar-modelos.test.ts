import { describe, expect, it } from 'vitest';
import { dimensoesDaImagem, lerGlb, validarModelos } from './validar-modelos.mjs';

const LIMITE = 3 * 1024 * 1024;

function alinhar(bytes: Uint8Array, preenchimento: number): Uint8Array {
  const resto = bytes.length % 4;
  if (resto === 0) return bytes;
  const novo = new Uint8Array(bytes.length + (4 - resto));
  novo.set(bytes);
  novo.fill(preenchimento, bytes.length);
  return novo;
}

/** Monta um GLB 2.0 em memória: cabeçalho, pedaço JSON e, se houver, pedaço BIN. */
function montarGlb(json: object, bin?: Uint8Array): Uint8Array {
  const jsonBytes = alinhar(new TextEncoder().encode(JSON.stringify(json)), 0x20);
  const binBytes = bin ? alinhar(bin, 0) : null;
  const total = 12 + 8 + jsonBytes.length + (binBytes ? 8 + binBytes.length : 0);
  const saida = new Uint8Array(total);
  const v = new DataView(saida.buffer);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, total, true);
  v.setUint32(12, jsonBytes.length, true);
  v.setUint32(16, 0x4e4f534a, true);
  saida.set(jsonBytes, 20);
  if (binBytes) {
    const pos = 20 + jsonBytes.length;
    v.setUint32(pos, binBytes.length, true);
    v.setUint32(pos + 4, 0x004e4942, true);
    saida.set(binBytes, pos + 8);
  }
  return saida;
}

/** PNG mínimo: só assinatura e IHDR com as dimensões pedidas (basta para ler o tamanho). */
function pngComDimensoes(largura: number, altura: number): Uint8Array {
  const png = new Uint8Array(33);
  const v = new DataView(png.buffer);
  v.setUint32(0, 0x89504e47);
  v.setUint32(4, 0x0d0a1a0a);
  v.setUint32(8, 13);
  v.setUint32(12, 0x49484452);
  v.setUint32(16, largura);
  v.setUint32(20, altura);
  return png;
}

function glbComTextura(largura: number, altura: number, mimeType = 'image/png'): Uint8Array {
  const png = pngComDimensoes(largura, altura);
  return montarGlb(
    {
      asset: { version: '2.0' },
      images: [{ bufferView: 0, mimeType }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: png.length }],
    },
    png,
  );
}

const glbSimples = () => montarGlb({ asset: { version: '2.0' } });
const manifesto = { 'canastra-curado': { inteiro: true as const, cortado: true } };
const decodificadoresDraco = [
  'draco/draco_wasm_wrapper.js',
  'draco/draco_decoder.wasm',
  'draco/draco_decoder.js',
];

function validar(
  arquivos: { nome: string; bytes: Uint8Array }[],
  extra: {
    manifesto?: Record<string, { inteiro: true; cortado: boolean }>;
    decodificadores?: string[];
  } = {},
) {
  return validarModelos({
    arquivos,
    manifesto: extra.manifesto ?? manifesto,
    decodificadores: extra.decodificadores ?? [],
    limiteDeBytes: LIMITE,
  });
}

const parOk = () => [
  { nome: 'canastra-curado-inteiro.glb', bytes: glbSimples() },
  { nome: 'canastra-curado-cortado.glb', bytes: glbSimples() },
];

describe('validarModelos', () => {
  it('passa com a pasta vazia e o manifesto vazio (o caso de hoje), ignorando .gitkeep', () => {
    const r = validar([{ nome: '.gitkeep', bytes: new Uint8Array() }], { manifesto: {} });
    expect(r).toEqual({ erros: [], avisos: [] });
  });

  it('passa com os dois GLB do manifesto', () => {
    expect(validar(parOk()).erros).toEqual([]);
  });

  it('aceita cortado: false quando só existe o inteiro', () => {
    const r = validar([parOk()[0]!], {
      manifesto: { 'canastra-curado': { inteiro: true, cortado: false } },
    });
    expect(r.erros).toEqual([]);
  });

  it('nome fora da convenção', () => {
    const r = validar([...parOk(), { nome: 'Canastra_final.glb', bytes: glbSimples() }]);
    expect(r.erros).toEqual([
      expect.stringContaining('Canastra_final.glb: nome fora da convenção'),
    ]);
  });

  it('arquivo sem entrada no manifesto', () => {
    const r = validar([...parOk(), { nome: 'brie-frances-inteiro.glb', bytes: glbSimples() }]);
    expect(r.erros).toEqual([
      expect.stringContaining('brie-frances-inteiro.glb: arquivo sem entrada "brie-frances"'),
    ]);
  });

  it('arquivo cortado quando o manifesto diz cortado: false', () => {
    const r = validar(parOk(), {
      manifesto: { 'canastra-curado': { inteiro: true, cortado: false } },
    });
    expect(r.erros).toEqual([expect.stringContaining('cortado: false')]);
  });

  it('entrada do manifesto sem arquivo (inteiro e cortado)', () => {
    const r = validar([]);
    expect(r.erros).toEqual([
      expect.stringContaining('canastra-curado-inteiro.glb: listado no manifesto'),
      expect.stringContaining('canastra-curado-cortado.glb: manifesto diz cortado: true'),
    ]);
  });

  it('cabeçalho inválido: assinatura, versão e comprimento', () => {
    const semAssinatura = glbSimples();
    semAssinatura[0] = 0;
    const versao1 = glbSimples();
    new DataView(versao1.buffer).setUint32(4, 1, true);
    const truncado = glbSimples().slice(0, -4);
    for (const bytes of [semAssinatura, versao1, truncado, new Uint8Array(8)]) {
      const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes }, parOk()[1]!]);
      expect(r.erros).toEqual([expect.stringContaining('GLB inválido')]);
    }
  });

  it('arquivo acima do limite de 3 MiB', () => {
    const grande = montarGlb({ asset: { version: '2.0' } }, new Uint8Array(LIMITE + 1));
    const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes: grande }, parOk()[1]!]);
    expect(r.erros).toEqual([expect.stringContaining('acima do limite de 3,00 MiB')]);
  });

  it('arquivo exatamente no limite passa', () => {
    const justo = montarGlb({ asset: { version: '2.0' } }, new Uint8Array(LIMITE - 200));
    expect(justo.length).toBeLessThanOrEqual(LIMITE);
    const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes: justo }, parOk()[1]!]);
    expect(r.erros).toEqual([]);
  });

  it('Draco sem decodificador local é erro; com os arquivos, passa', () => {
    const draco = montarGlb({
      asset: { version: '2.0' },
      extensionsUsed: ['KHR_draco_mesh_compression'],
      extensionsRequired: ['KHR_draco_mesh_compression'],
    });
    const arquivos = [{ nome: 'canastra-curado-inteiro.glb', bytes: draco }, parOk()[1]!];
    expect(validar(arquivos).erros).toEqual([
      expect.stringContaining('KHR_draco_mesh_compression, mas falta em public/decodificadores/'),
    ]);
    expect(validar(arquivos, { decodificadores: decodificadoresDraco }).erros).toEqual([]);
  });

  it('KTX2 (basisu) sem transcodificador local é erro', () => {
    const ktx2 = montarGlb({
      asset: { version: '2.0' },
      extensionsUsed: ['KHR_texture_basisu'],
    });
    const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes: ktx2 }, parOk()[1]!]);
    expect(r.erros).toEqual([expect.stringContaining('basis/basis_transcoder.wasm')]);
  });

  it('extensão obrigatória fora da lista (Meshopt) é erro', () => {
    const meshopt = montarGlb({
      asset: { version: '2.0' },
      extensionsRequired: ['EXT_meshopt_compression'],
    });
    const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes: meshopt }, parOk()[1]!]);
    expect(r.erros).toEqual([expect.stringContaining('"EXT_meshopt_compression" fora da lista')]);
  });

  it('textura de 4096 px é erro; de 2048 px passa (com aviso de falta de KTX2)', () => {
    const grande = validar([
      { nome: 'canastra-curado-inteiro.glb', bytes: glbComTextura(4096, 2048) },
      parOk()[1]!,
    ]);
    expect(grande.erros).toEqual([expect.stringContaining('textura 0: 4096 x 2048 px')]);

    const ok = validar([
      { nome: 'canastra-curado-inteiro.glb', bytes: glbComTextura(2048, 2048) },
      parOk()[1]!,
    ]);
    expect(ok.erros).toEqual([]);
    expect(ok.avisos).toEqual([expect.stringContaining('sem compressão KTX2')]);
  });

  it('textura externa (uri de arquivo) é erro', () => {
    const externa = montarGlb({ asset: { version: '2.0' }, images: [{ uri: 'cor.png' }] });
    const r = validar([{ nome: 'canastra-curado-inteiro.glb', bytes: externa }, parOk()[1]!]);
    expect(r.erros).toEqual([expect.stringContaining('arquivo externo')]);
  });
});

describe('lerGlb e dimensoesDaImagem', () => {
  it('lê o JSON e o BIN de um GLB válido', () => {
    const lido = lerGlb(montarGlb({ asset: { version: '2.0' } }, new Uint8Array([1, 2, 3, 4])));
    expect(lido.json).toEqual({ asset: { version: '2.0' } });
    expect(Array.from(lido.bin ?? [])).toEqual([1, 2, 3, 4]);
  });

  it('PNG', () => {
    expect(dimensoesDaImagem(pngComDimensoes(512, 256))).toEqual({ largura: 512, altura: 256 });
  });

  it('KTX2', () => {
    const ktx = new Uint8Array(80);
    const v = new DataView(ktx.buffer);
    v.setUint32(0, 0xab4b5458);
    v.setUint32(4, 0x203230bb);
    v.setUint32(20, 1024, true);
    v.setUint32(24, 2048, true);
    expect(dimensoesDaImagem(ktx)).toEqual({ largura: 1024, altura: 2048 });
  });

  it('JPEG (marcador SOF0)', () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x03, 0x00,
      0x04, 0x00, 0x03, 0x01, 0x11, 0x00,
    ]);
    expect(dimensoesDaImagem(jpeg)).toEqual({ largura: 1024, altura: 768 });
  });

  it('WebP VP8X', () => {
    const webp = new Uint8Array(30);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58]);
    webp.set([0xff, 0x07, 0x00], 24); // largura - 1 = 2047
    webp.set([0xff, 0x03, 0x00], 27); // altura - 1 = 1023
    expect(dimensoesDaImagem(webp)).toEqual({ largura: 2048, altura: 1024 });
  });

  it('formato desconhecido devolve null', () => {
    expect(dimensoesDaImagem(new Uint8Array(40))).toBeNull();
  });
});

/** GLB com pedaços escolhidos à mão (para os casos de estrutura inválida). */
function glbComPedacos(pedacos: { tipo: number; dados: Uint8Array }[], sobra = 0): Uint8Array {
  const total = 12 + pedacos.reduce((s, p) => s + 8 + p.dados.length, 0) + sobra;
  const saida = new Uint8Array(total);
  const v = new DataView(saida.buffer);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, total, true);
  let pos = 12;
  for (const p of pedacos) {
    v.setUint32(pos, p.dados.length, true);
    v.setUint32(pos + 4, p.tipo, true);
    saida.set(p.dados, pos + 8);
    pos += 8 + p.dados.length;
  }
  return saida;
}
const JSON_ = 0x4e4f534a;
const BIN_ = 0x004e4942;
const texto = (s: string) => alinhar(new TextEncoder().encode(s), 0x20);

describe('validarModelos: estrutura e casos de borda', () => {
  const comArquivo = (bytes: Uint8Array) =>
    validar([{ nome: 'canastra-curado-inteiro.glb', bytes }, parOk()[1]!]);

  it.each([
    ['null', 'null'],
    ['array', '[]'],
    ['número', '42'],
  ])('JSON válido que não é objeto (%s) vira erro, não exceção', (_nome, json) => {
    const r = comArquivo(glbComPedacos([{ tipo: JSON_, dados: texto(json) }]));
    expect(r.erros).toEqual([expect.stringContaining('GLB inválido')]);
  });

  it('o primeiro pedaço precisa ser JSON', () => {
    const r = comArquivo(
      glbComPedacos([
        { tipo: BIN_, dados: new Uint8Array(4) },
        { tipo: JSON_, dados: texto('{}') },
      ]),
    );
    expect(r.erros).toEqual([expect.stringContaining('primeiro pedaço')]);
  });

  it('tamanho de pedaço que não é múltiplo de 4 é erro', () => {
    const r = comArquivo(
      glbComPedacos([{ tipo: JSON_, dados: new TextEncoder().encode('{}   ').slice(0, 5) }]),
    );
    expect(r.erros).toEqual([expect.stringContaining('múltiplo de 4')]);
  });

  it('bytes sobrando depois do último pedaço é erro', () => {
    const r = comArquivo(glbComPedacos([{ tipo: JSON_, dados: texto('{}') }], 3));
    expect(r.erros).toEqual([expect.stringContaining('bytes sobrando')]);
  });

  const glbComVista = (vista: object, buffers?: object[]) => {
    const png = pngComDimensoes(64, 64);
    return montarGlb(
      {
        asset: { version: '2.0' },
        images: [{ bufferView: 0, mimeType: 'image/png' }],
        bufferViews: [vista],
        ...(buffers ? { buffers } : {}),
      },
      png,
    );
  };

  it('bufferView fora dos limites do BIN é erro', () => {
    const r = comArquivo(glbComVista({ buffer: 0, byteOffset: 8, byteLength: 4096 }));
    expect(r.erros).toEqual([expect.stringContaining('fora dos limites')]);
  });

  it('bufferView que não usa o buffer 0 é erro', () => {
    const r = comArquivo(glbComVista({ buffer: 1, byteOffset: 0, byteLength: 8 }));
    expect(r.erros).toEqual([expect.stringContaining('só o buffer 0')]);
  });

  it('buffer 1 com uri externa é erro, e mais de um buffer também', () => {
    const r = comArquivo(
      glbComVista({ buffer: 0, byteOffset: 0, byteLength: 33 }, [
        { byteLength: 33 },
        { byteLength: 4, uri: 'https://exemplo.com/x.bin' },
      ]),
    );
    expect(r.erros).toEqual([
      expect.stringContaining('buffer 1 tem uri externa'),
      expect.stringContaining('2 buffers'),
    ]);
  });

  it('buffer com data: URI é erro', () => {
    const r = comArquivo(
      glbComVista({ buffer: 0, byteOffset: 0, byteLength: 33 }, [
        { byteLength: 33, uri: 'data:application/octet-stream;base64,AAAA' },
      ]),
    );
    expect(r.erros).toEqual([expect.stringContaining('buffer 0 tem uri data:')]);
  });

  it('buffer 0 com uri externa é erro', () => {
    const r = comArquivo(
      glbComVista({ buffer: 0, byteOffset: 0, byteLength: 33 }, [{ byteLength: 33, uri: 'x.bin' }]),
    );
    expect(r.erros).toEqual([expect.stringContaining('buffer 0 tem uri externa')]);
  });

  it('GLB em subpasta de public/models/ é erro', () => {
    const r = validar([
      ...parOk(),
      { nome: 'extra/canastra-curado-inteiro.glb', bytes: glbSimples() },
    ]);
    expect(r.erros).toEqual([expect.stringContaining('subpasta')]);
  });

  it('data: URI sem ;base64 gera aviso, não erro', () => {
    const r = comArquivo(
      montarGlb({ asset: { version: '2.0' }, images: [{ uri: 'data:image/png,abc' }] }),
    );
    expect(r.erros).toEqual([]);
    expect(r.avisos).toEqual([expect.stringContaining('sem ;base64')]);
  });

  it('data: URI com ;base64 tem as dimensões conferidas', () => {
    const uri = `data:image/png;base64,${Buffer.from(pngComDimensoes(4096, 16)).toString('base64')}`;
    const r = comArquivo(montarGlb({ asset: { version: '2.0' }, images: [{ uri }] }));
    expect(r.erros).toEqual([expect.stringContaining('4096 x 16 px')]);
  });

  it('exceção ao validar um arquivo vira erro daquele arquivo e o laço segue', () => {
    const quebrado = { nome: 'canastra-curado-inteiro.glb', bytes: null as unknown as Uint8Array };
    const r = validar([quebrado, parOk()[1]!]);
    expect(r.erros).toEqual([expect.stringContaining('canastra-curado-inteiro.glb: GLB inválido')]);
  });

  it('JPEG com segmento de comprimento menor que 2 devolve null', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(dimensoesDaImagem(jpeg)).toBeNull();
  });
});
