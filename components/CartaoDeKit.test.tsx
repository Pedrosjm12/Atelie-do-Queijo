import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KITS } from '@/data/kits';
import { CartaoDeKit } from './CartaoDeKit';

describe('CartaoDeKit', () => {
  it('mostra nome, descrição e a lacuna de preço, sem botão', () => {
    render(<CartaoDeKit kit={KITS[1]!} nivelDoTitulo="h3" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Volta ao Mundo' })).toBeInTheDocument();
    expect(screen.getByText('5 queijos de 5 países, com mapa de origem.')).toBeInTheDocument();
    expect(screen.getByText('R$ [PREÇO]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('respeita o nível do título', () => {
    render(<CartaoDeKit kit={KITS[0]!} nivelDoTitulo="h2" />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Primeira Degustação' }),
    ).toBeInTheDocument();
  });

  it('com preço, mostra o valor em reais', () => {
    render(<CartaoDeKit kit={{ ...KITS[0]!, preco: 18900 }} nivelDoTitulo="h3" />);
    expect(screen.queryByText('R$ [PREÇO]')).not.toBeInTheDocument();
    expect(screen.getByText(/189,00/)).toBeInTheDocument();
  });
});
