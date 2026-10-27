import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AtendimentoProvider } from './Atendimento';
import { Footer } from './Footer';

const renderizar = () =>
  render(
    <AtendimentoProvider>
      <Footer />
    </AtendimentoProvider>,
  );

describe('Footer', () => {
  it('agrupa as colunas numa navegação "Rodapé"', () => {
    renderizar();
    const nav = screen.getByRole('navigation', { name: 'Rodapé' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Queijos' }));
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Fale conosco' }));
  });

  it('itens sem destino não são links', () => {
    renderizar();
    for (const nome of ['Entregas refrigeradas', 'Trocas e devoluções', 'Perguntas frequentes']) {
      expect(screen.getByText(nome)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: nome })).not.toBeInTheDocument();
    }
  });

  it('mantém as lacunas da spec visíveis', () => {
    renderizar();
    expect(
      screen.getByText('Ateliê do Queijo · CNPJ [00.000.000/0000-00] · [Endereço]'),
    ).toBeInTheDocument();
  });
});
