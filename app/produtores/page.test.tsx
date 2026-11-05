import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PRODUTORES } from '@/data/produtores';
import PaginaDeProdutores, { metadata } from './page';

const TEXTO =
  'O Ateliê nasceu da vontade de levar até você queijos que só se encontravam na porta da fazenda ou nas melhores queijarias da Europa. Conhecemos cada produtor, provamos cada lote e só vendemos o que serviríamos em casa.';

describe('página /produtores', () => {
  it('metadados: título do menu (P13/P66) e o texto da §12', () => {
    expect(metadata.title).toBe('Nossos produtores');
    expect(metadata.description).toBe(TEXTO);
  });

  it('h1 e texto literais da §12, sem sobretítulo', () => {
    render(<PaginaDeProdutores />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Quem faz o queijo importa.',
    );
    expect(screen.getByText(TEXTO)).toBeInTheDocument();
  });

  it('grade só com o produtor do Canastra: foto, região, desde e nome', () => {
    render(<PaginaDeProdutores />);
    expect(PRODUTORES).toHaveLength(1);
    const produtor = PRODUTORES[0]!;
    const cartao = screen.getByRole('article');
    expect(within(cartao).getByRole('heading', { level: 2 })).toHaveTextContent(produtor.nome);
    expect(within(cartao).getByText('Serra da Canastra, MG')).toBeInTheDocument();
    expect(within(cartao).getByText(`desde ${produtor.desde}`)).toBeInTheDocument();
    expect(within(cartao).getByText(/\[FOTO: /)).toBeInTheDocument();
  });

  it('link para o queijo dele leva a /queijos/<slug>', () => {
    render(<PaginaDeProdutores />);
    const link = screen.getByRole('link', { name: 'Canastra curado' });
    expect(link).toHaveAttribute('href', '/queijos/canastra-curado');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
