import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CabecalhoDePagina } from './CabecalhoDePagina';

describe('CabecalhoDePagina', () => {
  it('mostra sobretítulo, h1 e parágrafo', () => {
    render(
      <CabecalhoDePagina
        sobretitulo="PRESENTES"
        titulo="Para quem merece uma boa tábua."
        paragrafo="Um parágrafo."
        idDoTitulo="titulo"
      />,
    );
    expect(screen.getByText('PRESENTES')).toBeInTheDocument();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Para quem merece uma boa tábua.' });
    expect(h1).toHaveAttribute('id', 'titulo');
    expect(screen.getByText('Um parágrafo.')).toBeInTheDocument();
  });

  it('sem sobretítulo nem parágrafo, só o h1', () => {
    const { container } = render(<CabecalhoDePagina titulo="Escola do Ateliê" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Escola do Ateliê' })).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });
});
