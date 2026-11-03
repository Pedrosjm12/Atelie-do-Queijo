// Validador dos modelos 3D (spec §11, ADR-0009). Sem dependências além do Node.
//
// Uso: `npm run modelos:validar`. Confere `public/models/` contra o manifesto `data/modelos3d.ts`:
//   - nome `<slug>-(inteiro|cortado).glb` e paridade entre arquivos e manifesto;
//   - cabeçalho GLB 2.0 coerente com o tamanho do arquivo;
//   - tamanho até o limite do manifesto (3 MiB, P43);
//   - `extensionsRequired` dentro de uma lista permitida; Draco e KTX2 exigem decodificador
//     local em `public/decodificadores/` (senão o model-viewer buscaria no CDN do Google);
//   - texturas até 2048 px; textura sem KTX2 gera aviso.
//
// A função `validarModelos` é pura (recebe bytes e listas, devolve erros e avisos) para ser
// testada com GLB sintéticos montados em memória.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LADO_MAXIMO_DA_TEXTURA = 2048;

const NOME_VALIDO = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(inteiro|cortado)\.glb$/;

/** Extensões que o model-viewer 4.4.0 abre sem configuração extra (Meshopt fica de fora: desligado). */
export const EXTENSOES_PERMITIDAS = new Set([
  'KHR_draco_mesh_compression',
  'KHR_texture_basisu',
  'KHR_texture_transform',
  'KHR_mesh_quantization',
  'KHR_materials_emissive_strength',
  'KHR_materials_ior',
  'KHR_materials_specular',
  'KHR_materials_clearcoat',
  'KHR_materials_sheen',
  'KHR_materials_transmission',
  'KHR_materials_volume',
  'KHR_materials_iridescence',
  'KHR_materials_anisotropy',
  'EXT_texture_webp',
]);

/** Arquivos que o carregador precisa encontrar em `public/decodificadores/` (relativos a ela). */
export const DECODIFICADORES_OBRIGATORIOS = {
  KHR_draco_mesh_compression: [
    'draco/draco_wasm_wrapper.js',
    'draco/draco_decoder.wasm',
    'draco/draco_decoder.js',
  ],
  KHR_texture_basisu: ['basis/basis_transcoder.js', 'basis/basis_transcoder.wasm'],
};

const MAGIA_GLB = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

/** Lê `{ json, bin }` de um GLB, ou `{ erro }` se o cabeçalho ou os pedaços forem inválidos. */
export function lerGlb(bytes) {
  if (bytes.length < 20) return { erro: 'arquivo menor que o cabeçalho GLB' };
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.getUint32(0, true) !== MAGIA_GLB) return { erro: 'cabeçalho sem a assinatura "glTF"' };
  if (v.getUint32(4, true) !== 2) return { erro: `versão ${v.getUint32(4, true)}, esperada 2` };
  const declarado = v.getUint32(8, true);
  if (declarado !== bytes.length) {
    return { erro: `comprimento do cabeçalho (${declarado}) difere do arquivo (${bytes.length})` };
  }

  let json;
  let bin = null;
  let pos = 12;
  let primeiro = true;
  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) return { erro: 'bytes sobrando depois do último pedaço (chunk)' };
    const tamanho = v.getUint32(pos, true);
    const tipo = v.getUint32(pos + 4, true);
    const inicio = pos + 8;
    if (tamanho % 4 !== 0) return { erro: 'tamanho de pedaço (chunk) não é múltiplo de 4' };
    if (inicio + tamanho > bytes.length) return { erro: 'pedaço (chunk) maior que o arquivo' };
    if (primeiro && tipo !== CHUNK_JSON) return { erro: 'o primeiro pedaço (chunk) não é JSON' };
    primeiro = false;
    if (tipo === CHUNK_JSON && json === undefined) {
      try {
        json = JSON.parse(new TextDecoder().decode(bytes.subarray(inicio, inicio + tamanho)));
      } catch {
        return { erro: 'pedaço JSON ilegível' };
      }
      if (json === null || typeof json !== 'object' || Array.isArray(json)) {
        return { erro: 'o JSON do pedaço não é um objeto' };
      }
    } else if (tipo === CHUNK_BIN && bin === null) {
      bin = bytes.subarray(inicio, inicio + tamanho);
    }
    pos = inicio + tamanho;
  }
  if (json === undefined) return { erro: 'sem o pedaço JSON' };
  return { json, bin };
}

/** Largura e altura de PNG, JPEG, KTX2 ou WebP; `null` se o formato não for reconhecido. */
export function dimensoesDaImagem(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  // PNG: assinatura de 8 bytes; IHDR traz largura e altura (big-endian) nos bytes 16 a 23.
  if (b.length >= 24 && v.getUint32(0) === 0x89504e47 && v.getUint32(4) === 0x0d0a1a0a) {
    return { largura: v.getUint32(16), altura: v.getUint32(20) };
  }
  // KTX2: identificador de 12 bytes; pixelWidth e pixelHeight (little-endian) nos bytes 20 a 27.
  if (b.length >= 28 && v.getUint32(0) === 0xab4b5458 && v.getUint32(4) === 0x203230bb) {
    return { largura: v.getUint32(20, true), altura: v.getUint32(24, true) };
  }
  // JPEG: percorre os marcadores até um SOF (0xC0 a 0xCF, menos C4, C8 e CC).
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let p = 2;
    while (p + 9 < b.length) {
      if (b[p] !== 0xff) {
        p++;
        continue;
      }
      const marcador = b[p + 1];
      if (marcador === 0xff) {
        p++;
        continue;
      }
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { altura: v.getUint16(p + 5), largura: v.getUint16(p + 7) };
      }
      const segmento = v.getUint16(p + 2);
      if (segmento < 2) return null; // segmento corrompido: evita laço sem avanço
      p += 2 + segmento;
    }
    return null;
  }
  // WebP: RIFF....WEBP e um dos formatos VP8X, VP8 (com perda) ou VP8L (sem perda).
  if (b.length >= 30 && v.getUint32(0) === 0x52494646 && v.getUint32(8) === 0x57454250) {
    const forma = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (forma === 'VP8X') {
      return {
        largura: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
        altura: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
      };
    }
    if (forma === 'VP8 ') {
      return { largura: v.getUint16(26, true) & 0x3fff, altura: v.getUint16(28, true) & 0x3fff };
    }
    if (forma === 'VP8L') {
      const bits = v.getUint32(21, true);
      return { largura: (bits & 0x3fff) + 1, altura: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

function validarConteudo(nome, bytes, decodificadores, limite, erros, avisos) {
  if (bytes.length > limite) {
    const mib = (n) => (n / 1024 / 1024).toFixed(2).replace('.', ',');
    erros.push(`${nome}: ${mib(bytes.length)} MiB, acima do limite de ${mib(limite)} MiB`);
  }

  const lido = lerGlb(bytes);
  if (lido.erro) {
    erros.push(`${nome}: GLB inválido (${lido.erro})`);
    return;
  }
  const { json, bin } = lido;

  const exigidas = Array.isArray(json.extensionsRequired) ? json.extensionsRequired : [];
  const usadas = Array.isArray(json.extensionsUsed) ? json.extensionsUsed : [];
  for (const ext of exigidas) {
    if (!EXTENSOES_PERMITIDAS.has(ext)) {
      erros.push(`${nome}: extensão obrigatória "${ext}" fora da lista permitida`);
    }
  }
  for (const [ext, arquivos] of Object.entries(DECODIFICADORES_OBRIGATORIOS)) {
    if (!exigidas.includes(ext) && !usadas.includes(ext)) continue;
    const faltando = arquivos.filter((a) => !decodificadores.includes(a));
    if (faltando.length > 0) {
      erros.push(
        `${nome}: usa ${ext}, mas falta em public/decodificadores/: ${faltando.join(', ')} ` +
          '(sem eles o model-viewer buscaria no CDN do Google)',
      );
    }
  }

  const imagens = Array.isArray(json.images) ? json.images : [];
  const buffer0 = Array.isArray(json.buffers) ? json.buffers[0] : undefined;
  if (buffer0 && typeof buffer0.uri === 'string') {
    erros.push(`${nome}: o buffer 0 tem uri externa; o GLB deve embutir os dados no pedaço BIN`);
  }
  imagens.forEach((imagem, i) => {
    const rotulo = `${nome}: textura ${i}`;
    if (imagem === null || typeof imagem !== 'object') {
      erros.push(`${rotulo}: entrada de imagem inválida`);
      return;
    }
    if (typeof imagem.uri === 'string' && !imagem.uri.startsWith('data:')) {
      erros.push(`${rotulo} aponta para arquivo externo (${imagem.uri}); embuta-a no GLB`);
      return;
    }
    let dados = null;
    if (typeof imagem.uri === 'string') {
      const [cabecalho = '', corpo = ''] = imagem.uri.split(/,(.*)/s);
      if (!/;base64$/i.test(cabecalho)) {
        avisos.push(`${rotulo}: data: URI sem ;base64; dimensões não conferidas`);
        return;
      }
      dados = Uint8Array.from(Buffer.from(corpo, 'base64'));
    } else if (typeof imagem.bufferView === 'number') {
      const vista = json.bufferViews?.[imagem.bufferView];
      if (!vista || typeof vista !== 'object') {
        erros.push(`${rotulo}: bufferView ${imagem.bufferView} não existe`);
        return;
      }
      if (vista.buffer !== 0) {
        erros.push(
          `${rotulo}: bufferView usa o buffer ${vista.buffer}; só o buffer 0 (BIN) é aceito`,
        );
        return;
      }
      const inicio = vista.byteOffset ?? 0;
      const tamanho = vista.byteLength;
      if (
        !Number.isInteger(inicio) ||
        !Number.isInteger(tamanho) ||
        inicio < 0 ||
        tamanho < 0 ||
        !bin ||
        inicio + tamanho > bin.length
      ) {
        erros.push(`${rotulo}: bufferView fora dos limites do pedaço BIN`);
        return;
      }
      dados = bin.subarray(inicio, inicio + tamanho);
    }
    if (!dados) {
      avisos.push(`${rotulo}: não foi possível ler os dados da imagem`);
      return;
    }
    const medida = dimensoesDaImagem(dados);
    if (!medida) {
      avisos.push(`${rotulo}: formato não reconhecido; dimensões não conferidas`);
    } else if (Math.max(medida.largura, medida.altura) > LADO_MAXIMO_DA_TEXTURA) {
      erros.push(
        `${rotulo}: ${medida.largura} x ${medida.altura} px, acima de ${LADO_MAXIMO_DA_TEXTURA} px`,
      );
    }
    if (imagem.mimeType !== 'image/ktx2') {
      avisos.push(
        `${rotulo}: sem compressão KTX2 (mais memória na GPU); considere o gltf-transform`,
      );
    }
  });
}

/**
 * @param {object} entrada
 * @param {{ nome: string, bytes: Uint8Array }[]} entrada.arquivos conteúdo de public/models/
 * @param {Record<string, { inteiro: true, cortado: boolean }>} entrada.manifesto
 * @param {string[]} entrada.decodificadores caminhos relativos em public/decodificadores/
 * @param {number} entrada.limiteDeBytes
 * @returns {{ erros: string[], avisos: string[] }}
 */
export function validarModelos({ arquivos, manifesto, decodificadores = [], limiteDeBytes }) {
  const erros = [];
  const avisos = [];
  const presentes = new Set();

  for (const { nome, bytes } of arquivos) {
    if (nome.includes('/')) {
      erros.push(
        `${nome}: GLB em subpasta de public/models/ não é servido pela convenção /models/<arquivo>`,
      );
      continue;
    }
    if (nome.startsWith('.')) continue; // .gitkeep e afins
    const partes = NOME_VALIDO.exec(nome);
    if (!partes) {
      erros.push(`${nome}: nome fora da convenção <slug>-(inteiro|cortado).glb`);
      continue;
    }
    const [, slug, variante] = partes;
    const entrada = manifesto[slug];
    if (!entrada) {
      erros.push(`${nome}: arquivo sem entrada "${slug}" em data/modelos3d.ts`);
      continue;
    }
    if (variante === 'cortado' && !entrada.cortado) {
      erros.push(`${nome}: arquivo presente, mas o manifesto diz cortado: false para "${slug}"`);
      continue;
    }
    presentes.add(nome);
    try {
      validarConteudo(nome, bytes, decodificadores, limiteDeBytes, erros, avisos);
    } catch (erro) {
      erros.push(
        `${nome}: GLB inválido (falha ao ler: ${erro instanceof Error ? erro.message : erro})`,
      );
    }
  }

  for (const [slug, entrada] of Object.entries(manifesto)) {
    if (!presentes.has(`${slug}-inteiro.glb`)) {
      erros.push(`${slug}-inteiro.glb: listado no manifesto, mas o arquivo não existe`);
    }
    if (entrada.cortado && !presentes.has(`${slug}-cortado.glb`)) {
      erros.push(`${slug}-cortado.glb: manifesto diz cortado: true, mas o arquivo não existe`);
    }
  }

  return { erros, avisos };
}

async function listarArquivos(pasta, prefixo = '') {
  let itens;
  try {
    itens = await readdir(pasta, { withFileTypes: true });
  } catch (erro) {
    if (erro.code === 'ENOENT') return [];
    throw erro;
  }
  const nomes = [];
  for (const item of itens) {
    if (item.isDirectory())
      nomes.push(...(await listarArquivos(`${pasta}/${item.name}`, `${prefixo}${item.name}/`)));
    else nomes.push(`${prefixo}${item.name}`);
  }
  return nomes;
}

async function principal() {
  const raiz = new URL('../', import.meta.url);
  const { MODELOS_3D, LIMITE_DE_BYTES_DO_GLB } = await import(
    new URL('data/modelos3d.ts', raiz).href
  );
  const pastaModelos = fileURLToPath(new URL('public/models', raiz));
  const pastaDecodificadores = fileURLToPath(new URL('public/decodificadores', raiz));
  const nomes = await listarArquivos(pastaModelos);
  const arquivos = await Promise.all(
    nomes.map(async (nome) => ({
      nome,
      bytes: new Uint8Array(await readFile(`${pastaModelos}/${nome}`)),
    })),
  );
  const decodificadores = await listarArquivos(pastaDecodificadores);

  const { erros, avisos } = validarModelos({
    arquivos,
    manifesto: MODELOS_3D,
    decodificadores,
    limiteDeBytes: LIMITE_DE_BYTES_DO_GLB,
  });

  for (const aviso of avisos) console.warn(`aviso: ${aviso}`);
  for (const erro of erros) console.error(`erro: ${erro}`);
  const total = Object.keys(MODELOS_3D).length;
  if (erros.length > 0) {
    console.error(`\nmodelos:validar falhou com ${erros.length} erro(s).`);
    process.exitCode = 1;
  } else {
    console.log(
      total === 0
        ? 'modelos:validar: manifesto vazio e nenhum GLB em public/models/. Nada a validar.'
        : `modelos:validar: ${total} queijo(s) com modelo, tudo em ordem.`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await principal();
}
