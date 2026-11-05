import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Trilha } from './Trilha';

describe('Trilha', () => {
  it('lista os itens como links e marca o último como página atual', () => {
    render(
      <Trilha
        itens={[
          { href: '/', texto: 'Início' },
          { href: '/aprenda', texto: 'Aprenda' },
        ]}
        atual="Queijo e vinho"
      />,
    );
    const trilha = screen.getByRole('navigation', { name: 'Você está em' });
    const links = within(trilha).getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Aprenda', '/aprenda'],
    ]);
    expect(within(trilha).getByText('Queijo e vinho')).toHaveAttribute('aria-current', 'page');
    expect(trilha.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('sem itens com link, mostra só a página atual', () => {
    render(<Trilha itens={[]} atual="Início" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Início')).toHaveAttribute('aria-current', 'page');
  });
});
