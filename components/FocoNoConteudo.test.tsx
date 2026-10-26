import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FocoNoConteudo } from './FocoNoConteudo';

const usePathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

describe('FocoNoConteudo', () => {
  afterEach(() => {
    document.getElementById('conteudo')?.remove();
  });

  it('só move o foco quando a rota muda', () => {
    usePathname.mockReturnValue('/');
    const principal = document.createElement('main');
    principal.id = 'conteudo';
    principal.tabIndex = -1;
    document.body.append(principal);

    const { rerender } = render(<FocoNoConteudo />);
    expect(principal).not.toHaveFocus();

    usePathname.mockReturnValue('/queijos');
    rerender(<FocoNoConteudo />);
    expect(principal).toHaveFocus();
  });
});
