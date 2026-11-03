// GLB mínimo montado em memória (um triângulo) para os e2e do 3D: nenhum arquivo binário no
// repositório e nenhum modelo "inventado" em public/. Só serve para exercitar a carga.

export function glbSintetico(): Buffer {
  const posicoes = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) => posicoes.writeFloatLE(v, i * 4));
  const json = JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    buffers: [{ byteLength: 36 }],
  });
  const jsonBytes = Buffer.from(json + ' '.repeat((4 - (json.length % 4)) % 4));
  const total = 12 + 8 + jsonBytes.length + 8 + posicoes.length;
  const saida = Buffer.alloc(total);
  let p = 0;
  p = saida.writeUInt32LE(0x46546c67, p); // "glTF"
  p = saida.writeUInt32LE(2, p);
  p = saida.writeUInt32LE(total, p);
  p = saida.writeUInt32LE(jsonBytes.length, p);
  p = saida.writeUInt32LE(0x4e4f534a, p); // "JSON"
  p += jsonBytes.copy(saida, p);
  p = saida.writeUInt32LE(posicoes.length, p);
  p = saida.writeUInt32LE(0x004e4942, p); // "BIN\0"
  posicoes.copy(saida, p);
  return saida;
}
