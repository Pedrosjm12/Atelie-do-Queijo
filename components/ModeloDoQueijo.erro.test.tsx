import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ModeloDoQueijo from './ModeloDoQueijo';

// A biblioteca não carrega (rede, arquivo ausente): o componente avisa em vez de quebrar.
vi.mock('@google/model-viewer', () => {
  throw new Error('falha ao importar');
});

describe('ModeloDoQueijo: biblioteca indisponível', () => {
  it('chama aoFalhar e não cria o elemento', async () => {
    const aoFalhar = vi.fn();
    const { container } = render(
      <ModeloDoQueijo
        src="/models/x-inteiro.glb"
        alt="x"
        girando
        zoom={false}
        aoCarregar={vi.fn()}
        aoFalhar={aoFalhar}
        aoInteragir={vi.fn()}
      />,
    );
    await waitFor(() => expect(aoFalhar).toHaveBeenCalledTimes(1));
    expect(container.querySelector('model-viewer')).toBeNull();
  });
});
