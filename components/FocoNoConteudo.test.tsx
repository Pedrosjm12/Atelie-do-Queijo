import { fireEvent, render } from '@testing-library/react';
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

  describe('na mesma rota (pathname não muda)', () => {
    function montarComLink(href: string, atributos: Record<string, string> = {}) {
      usePathname.mockReturnValue('/presentes');
      window.history.replaceState(null, '', '/presentes');
      const principal = document.createElement('main');
      principal.id = 'conteudo';
      principal.tabIndex = -1;
      const bloco = document.createElement('section');
      bloco.id = 'bloco';
      const link = document.createElement('a');
      link.href = href;
      link.textContent = 'ir';
      for (const [nome, valor] of Object.entries(atributos)) link.setAttribute(nome, valor);
      // Como o `Link` do Next: cancela a navegação do navegador.
      link.addEventListener('click', (e) => e.preventDefault());
      document.body.append(principal, bloco, link);
      render(<FocoNoConteudo />);
      return { bloco, link, principal };
    }

    afterEach(() => {
      vi.useRealTimers();
      document.querySelectorAll('a').forEach((a) => a.remove());
    });

    it('clique num link com #âncora da mesma rota leva o foco ao elemento', () => {
      vi.useFakeTimers();
      const { bloco, link } = montarComLink('/presentes#bloco');
      fireEvent.click(link);
      vi.runAllTimers();
      expect(bloco).toHaveFocus();
      expect(bloco).toHaveAttribute('tabindex', '-1');
    });

    it('âncora que aponta para um campo nativo foca sem tirá-lo da ordem do Tab', () => {
      vi.useFakeTimers();
      const { link } = montarComLink('/presentes#campo');
      const campo = document.createElement('input');
      campo.id = 'campo';
      document.body.append(campo);
      fireEvent.click(link);
      vi.runAllTimers();
      expect(campo).toHaveFocus();
      expect(campo).not.toHaveAttribute('tabindex');
      campo.remove();
    });

    it('link de outra rota, sem âncora ou com tecla modificadora não mexe no foco', () => {
      vi.useFakeTimers();
      const { bloco, link } = montarComLink('/queijos#bloco');
      fireEvent.click(link);
      vi.runAllTimers();
      expect(bloco).not.toHaveFocus();
      link.href = '/presentes';
      fireEvent.click(link);
      link.href = '/presentes#bloco';
      fireEvent.click(link, { ctrlKey: true });
      vi.runAllTimers();
      expect(bloco).not.toHaveFocus();
    });

    it('link em nova aba não mexe no foco', () => {
      vi.useFakeTimers();
      const { bloco, link } = montarComLink('/presentes#bloco', { target: '_blank' });
      fireEvent.click(link);
      vi.runAllTimers();
      expect(bloco).not.toHaveFocus();
    });

    it('clique no filho do link também conta', () => {
      vi.useFakeTimers();
      const { bloco, link } = montarComLink('/presentes#bloco');
      const filho = document.createElement('span');
      link.append(filho);
      fireEvent.click(filho);
      vi.runAllTimers();
      expect(bloco).toHaveFocus();
    });

    it('hashchange (voltar/avançar, link comum) foca o elemento da nova âncora', () => {
      const { bloco } = montarComLink('/presentes#bloco');
      window.history.replaceState(null, '', '/presentes#bloco');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(bloco).toHaveFocus();
    });

    it('remove os ouvintes ao desmontar', () => {
      usePathname.mockReturnValue('/presentes');
      const bloco = document.createElement('section');
      bloco.id = 'bloco';
      document.body.append(bloco);
      const { unmount } = render(<FocoNoConteudo />);
      unmount();
      window.history.replaceState(null, '', '/presentes#bloco');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(bloco).not.toHaveFocus();
    });
  });

  it('com # vazio na URL cai no #conteudo', () => {
    const { principal, rerender } = montar();
    window.history.replaceState(null, '', '/presentes#');
    usePathname.mockReturnValue('/presentes');
    rerender(<FocoNoConteudo />);
    expect(principal).toHaveFocus();
  });
});
