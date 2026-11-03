import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { CheeseViewer } from './CheeseViewer';

// O chunk do 3D não baixa (rede, versão nova no ar): o `React.lazy` lança no render, o que o mock
// reproduz com um componente que lança (a rejeição real do import() chega ao mesmo ponto).
vi.mock('./CamadaDoModelo', () => ({
  default: function ChunkQuebrado(): never {
    throw new Error('chunk indisponível');
  },
}));
vi.mock('@/data/modelos3d', async (original) => ({
  ...(await original<typeof import('@/data/modelos3d')>()),
  temModelo: () => true,
}));
vi.mock('@/lib/suporte3d', async (original) => ({
  ...(await original<typeof import('@/lib/suporte3d')>()),
  temWebGL: () => true,
}));

describe('CheeseViewer: falha ao baixar o chunk do 3D', () => {
  it('não derruba a página: situação erro, SVG visível e Girar desabilitado', async () => {
    const consoleErro = vi.spyOn(console, 'error').mockImplementation(() => {});
    const q = obterQueijo('canastra-curado');
    if (!q) throw new Error('slug');
    render(<CheeseViewer queijo={q} />);
    act(() =>
      (window.IntersectionObserver as unknown as { disparar(v: boolean): void }).disparar(true),
    );
    await waitFor(
      () =>
        expect(screen.getByRole('button', { name: 'Girar' })).toHaveAttribute(
          'aria-disabled',
          'true',
        ),
      { timeout: 5000 },
    );
    expect(screen.getByRole('img', { name: /Canastra curado com uma fatia/ })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(document.querySelector('model-viewer')).toBeNull();
    consoleErro.mockRestore();
  });
});
