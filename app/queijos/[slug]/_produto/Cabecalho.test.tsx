import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { CabecalhoDoProduto } from './CabecalhoDoProduto';
import { Trilha } from './Trilha';

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q;
}

describe('Trilha', () => {
  it('mostra Início / Queijos / Brasil / nome, com o último como página atual', () => {
    render(<Trilha origem="brasil" nome="Canastra curado" />);
    const trilha = screen.getByRole('navigation', { name: 'Você está em' });
    const links = within(trilha).getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Queijos', '/queijos'],
      ['Brasil', '/queijos?origem=brasil'],
    ]);
    const atual = within(trilha).getByText('Canastra curado');
    expect(atual).toHaveAttribute('aria-current', 'page');
    expect(trilha.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });

  it('queijos importados apontam para Mundo', () => {
    render(<Trilha origem="mundo" nome="Manchego DOP" />);
    expect(screen.getByRole('link', { name: 'Mundo' })).toHaveAttribute(
      'href',
      '/queijos?origem=mundo',
    );
  });
});

describe('CabecalhoDoProduto', () => {
  it('Canastra curado: textos da spec §7.2', () => {
    render(<CabecalhoDoProduto queijo={queijo('canastra-curado')} />);
    expect(screen.getByText('BRASIL · SERRA DA CANASTRA, MG')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Canastra curado' })).toBeInTheDocument();
    expect(screen.getByText('Queijaria [NOME DO PRODUTOR]')).toBeInTheDocument();
    expect(screen.getByText('Selo Arte')).toBeInTheDocument();
    expect(screen.getByText('Leite cru')).toBeInTheDocument();
    expect(screen.getByText('60 dias de cura')).toBeInTheDocument();
    expect(screen.getByText(/^Casca firme e dourada, massa amarelada/)).toBeInTheDocument();
  });

  it('queijo sem detalhe: selo e textos [A DEFINIR]', () => {
    render(<CabecalhoDoProduto queijo={queijo('manchego')} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Manchego DOP' })).toBeInTheDocument();
    expect(screen.getAllByText('[A DEFINIR]').length).toBeGreaterThanOrEqual(3);
  });
});
