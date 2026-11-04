import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AtendimentoProvider } from './Atendimento';
import { Footer } from './Footer';
import { SacolaProvider } from './SacolaProvider';

const renderizar = () =>
  render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={null}>
        <Footer />
      </AtendimentoProvider>
    </SacolaProvider>,
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

  it('mostra o CNPJ e o endereço fictícios (D27)', () => {
    renderizar();
    expect(
      screen.getByText(
        'Ateliê do Queijo · CNPJ 00.000.000/0001-00 · Rua Exemplo, 123, São Paulo, SP',
      ),
    ).toBeInTheDocument();
  });
});
