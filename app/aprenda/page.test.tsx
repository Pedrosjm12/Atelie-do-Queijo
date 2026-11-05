import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PaginaDeAprenda, { metadata } from './page';

describe('página /aprenda', () => {
  it('metadados: título do menu (P13/P66) e o parágrafo da spec', () => {
    expect(metadata.title).toBe('Aprenda');
    expect(metadata.description).toBe('O jeito certo de servir, guardar e harmonizar.');
  });

  it('h1 literal, parágrafo e quatro categorias na ordem da §12', () => {
    render(<PaginaDeAprenda />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Escola do Ateliê');
    expect(screen.getByText('O jeito certo de servir, guardar e harmonizar.')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Primeiros passos',
      'Harmonização',
      'Servir e guardar',
      'Regiões e produtores',
    ]);
  });

  it('artigos em h3 com link para /aprenda/<slug>; a categoria vazia mostra a lacuna', () => {
    render(<PaginaDeAprenda />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    const link = screen.getByRole('link', { name: /Queijo e vinho/ });
    expect(link).toHaveAttribute('href', '/aprenda/queijo-e-vinho');
    const vazia = screen.getByRole('region', { name: 'Regiões e produtores' });
    expect(within(vazia).getByText('[A DEFINIR: artigos]')).toBeInTheDocument();
    expect(screen.getAllByText('[A DEFINIR: artigos]')).toHaveLength(1);
  });
});
