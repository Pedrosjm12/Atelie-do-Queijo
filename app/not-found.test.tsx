import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NaoEncontrada, { metadata } from './not-found';

describe('404', () => {
  it('mostra o h1 da spec §12 e o botão que leva à Home', () => {
    render(<NaoEncontrada />);
    expect(screen.getAllByRole('heading').map((h) => [h.tagName, h.textContent])).toEqual([
      ['H1', 'Esta página foi maturar em outro lugar.'],
    ]);
    expect(screen.getByRole('link', { name: 'Volta para a cave' })).toHaveAttribute('href', '/');
  });

  it('o título da aba é o texto da spec (o template acrescenta o nome da loja)', () => {
    expect(metadata.title).toBe('Esta página foi maturar em outro lugar.');
  });
});
