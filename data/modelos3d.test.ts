import { afterEach, describe, expect, it } from 'vitest';
import { QUEIJOS } from './cheeses';
import { caminhoDoModelo, LIMITE_DE_BYTES_DO_GLB, MODELOS_3D, temModelo } from './modelos3d';

describe('manifesto de modelos 3D', () => {
  it('monta o caminho pela convenção da §11', () => {
    expect(caminhoDoModelo('canastra-curado', 'cortado')).toBe(
      '/models/canastra-curado-cortado.glb',
    );
    expect(caminhoDoModelo('canastra-curado', 'inteiro')).toBe(
      '/models/canastra-curado-inteiro.glb',
    );
  });

  it('está vazio até o dono fornecer os GLB: nenhum dos 10 queijos tem modelo', () => {
    expect(Object.keys(MODELOS_3D)).toEqual([]);
    expect(QUEIJOS).toHaveLength(10);
    for (const { slug } of QUEIJOS) {
      expect(temModelo(slug, 'inteiro')).toBe(false);
      expect(temModelo(slug, 'cortado')).toBe(false);
    }
  });

  it('o limite do GLB é de 3 MiB (P43)', () => {
    expect(LIMITE_DE_BYTES_DO_GLB).toBe(3_145_728);
  });
});

describe('temModelo com o manifesto preenchido', () => {
  afterEach(() => {
    delete MODELOS_3D['canastra-curado'];
  });

  it('só o inteiro: inteiro é true e cortado é false', () => {
    MODELOS_3D['canastra-curado'] = { inteiro: true, cortado: false };
    expect(temModelo('canastra-curado', 'inteiro')).toBe(true);
    expect(temModelo('canastra-curado', 'cortado')).toBe(false);
  });

  it('inteiro e cortado: ambos true, sem vazar para outros queijos', () => {
    MODELOS_3D['canastra-curado'] = { inteiro: true, cortado: true };
    expect(temModelo('canastra-curado', 'cortado')).toBe(true);
    expect(temModelo('manchego', 'inteiro')).toBe(false);
  });
});
