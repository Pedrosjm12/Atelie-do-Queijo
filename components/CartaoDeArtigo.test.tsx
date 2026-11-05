import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ARTIGOS } from '@/data/artigos';
import { CartaoDeArtigo } from './CartaoDeArtigo';

describe('CartaoDeArtigo', () => {
  it('é um link inteiro com a categoria e o título no nome acessível', () => {
    render(
      <CartaoDeArtigo artigo={ARTIGOS[1]!} href="/aprenda/queijo-e-vinho" nivelDoTitulo="h3" />,
    );
    const link = screen.getByRole('link', {
      name: 'Harmonização Queijo e vinho: um guia sem regras chatas',
    });
    expect(link).toHaveAttribute('href', '/aprenda/queijo-e-vinho');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Queijo e vinho: um guia sem regras chatas' }),
    ).toBeInTheDocument();
  });

  it('a foto é decorativa (sem nome próprio) e respeita o nível do título', () => {
    render(<CartaoDeArtigo artigo={ARTIGOS[0]!} href="/aprenda" nivelDoTitulo="h2" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Como montar uma tábua de queijos',
    );
  });
});
