import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FocoNoConteudo } from './FocoNoConteudo';

const usePathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

describe('FocoNoConteudo', () => {
  afterEach(() => {
    document.getElementById('conteudo')?.remove();
    document.getElementById('bloco')?.remove();
    document.getElementById('seção')?.remove();
    window.history.replaceState(null, '', '/');
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

  it('com #âncora na URL, leva o foco ao elemento da âncora', () => {
    usePathname.mockReturnValue('/');
    const principal = document.createElement('main');
    principal.id = 'conteudo';
    principal.tabIndex = -1;
    const bloco = document.createElement('section');
    bloco.id = 'bloco';
    document.body.append(principal, bloco);

    const { rerender } = render(<FocoNoConteudo />);
    window.history.replaceState(null, '', '/presentes#bloco');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);

    expect(bloco).toHaveFocus();
    expect(bloco).toHaveAttribute('tabindex', '-1');
  });

  it('âncora que não existe na página cai no #conteudo', () => {
    usePathname.mockReturnValue('/');
    const principal = document.createElement('main');
    principal.id = 'conteudo';
    principal.tabIndex = -1;
    document.body.append(principal);

    const { rerender } = render(<FocoNoConteudo />);
    window.history.replaceState(null, '', '/presentes#nada');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);

    expect(principal).toHaveFocus();
  });

  function montar() {
    usePathname.mockReturnValue('/');
    const principal = document.createElement('main');
    principal.id = 'conteudo';
    principal.tabIndex = -1;
    document.body.append(principal);
    return { principal, ...render(<FocoNoConteudo />) };
  }

  it('âncora com acento codificado na URL acha o elemento', () => {
    const { rerender } = montar();
    const alvo = document.createElement('section');
    alvo.id = 'seção';
    document.body.append(alvo);
    window.history.replaceState(null, '', '/presentes#se%C3%A7%C3%A3o');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);
    expect(alvo).toHaveFocus();
  });

  it('âncora malformada não quebra e cai no #conteudo', () => {
    const { principal, rerender } = montar();
    window.history.replaceState(null, '', '/presentes#%E0%A4%A');
    usePathname.mockReturnValue('/presentes');
    expect(() => rerender(<FocoNoConteudo />)).not.toThrow();
    expect(principal).toHaveFocus();
  });

  it('mantém o tabindex que o elemento da âncora já tinha', () => {
    const { rerender } = montar();
    const alvo = document.createElement('section');
    alvo.id = 'bloco';
    alvo.tabIndex = 0;
    document.body.append(alvo);
    window.history.replaceState(null, '', '/presentes#bloco');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);
    expect(alvo).toHaveAttribute('tabindex', '0');
    expect(alvo).toHaveFocus();
  });

  it('com # vazio na URL cai no #conteudo', () => {
    const { principal, rerender } = montar();
    window.history.replaceState(null, '', '/presentes#');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);
    expect(principal).toHaveFocus();
  });
});
