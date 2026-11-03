import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Registra o que havia em `globalThis.ModelViewerElement` no instante em que a biblioteca é importada.
const registro = vi.hoisted(() => ({ naImportacao: undefined as unknown }));
vi.mock('@google/model-viewer', () => {
  registro.naImportacao = structuredClone(
    (globalThis as { ModelViewerElement?: unknown }).ModelViewerElement,
  );
  return {};
});

import ModeloDoQueijo from './ModeloDoQueijo';

afterEach(() => {
  delete (globalThis as { ModelViewerElement?: unknown }).ModelViewerElement;
});

describe('ModeloDoQueijo: decodificadores locais antes do import()', () => {
  it('define draco, ktx2 e lottie locais ANTES de importar a biblioteca e mescla o que já existia', async () => {
    (globalThis as { ModelViewerElement?: object }).ModelViewerElement = {
      meshoptDecoderLocation: 'x',
    };
    render(
      <ModeloDoQueijo
        src="/models/x-inteiro.glb"
        alt="x"
        girando={false}
        zoom={false}
        aoCarregar={vi.fn()}
        aoFalhar={vi.fn()}
        aoInteragir={vi.fn()}
      />,
    );
    await waitFor(() => expect(registro.naImportacao).toBeDefined());
    expect(registro.naImportacao).toEqual({
      meshoptDecoderLocation: 'x',
      dracoDecoderLocation: '/decodificadores/draco/',
      ktx2TranscoderLocation: '/decodificadores/basis/',
      lottieLoaderLocation: '/decodificadores/lottie/LottieLoader.js',
    });
  });
});
