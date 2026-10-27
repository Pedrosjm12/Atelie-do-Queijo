import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { obterQueijo } from '@/lib/catalogo';
import { ProductTabs } from './ProductTabs';
import { paineisDoProduto } from './paineisDoProduto';

const canastra = obterQueijo('canastra-curado');
if (!canastra) throw new Error('canastra-curado');
const detalhe = canastra.detalhe;

function renderizar() {
  return render(<ProductTabs paineis={paineisDoProduto(detalhe)} />);
}

const aba = (nome: string) => screen.getByRole('tab', { name: nome });

describe('ProductTabs', () => {
  it('tem as cinco abas na ordem da spec, com "A história" selecionada', () => {
    renderizar();
    expect(screen.getByRole('tablist', { name: 'Detalhes do queijo' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((a) => a.textContent)).toEqual([
      'A história',
      'Harmonização',
      'Como servir',
      'Como guardar',
      'Ficha técnica',
    ]);
    expect(aba('A história')).toHaveAttribute('aria-selected', 'true');
    expect(aba('A história')).toHaveAttribute('tabindex', '0');
    expect(aba('Harmonização')).toHaveAttribute('tabindex', '-1');
  });

  it('só um painel visível; os outros ficam no HTML com hidden', () => {
    renderizar();
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(5);
    expect(document.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(4);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1); // os hidden saem da árvore
    const painel = screen.getByRole('tabpanel', { name: 'A história' });
    expect(painel).toHaveTextContent('Na Serra da Canastra');
    expect(painel).toHaveTextContent('Depois de prensado à mão');
  });

  it('seta direita move o foco e a seleção para "Harmonização"', async () => {
    const usuario = userEvent.setup();
    renderizar();
    aba('A história').focus();

    await usuario.keyboard('{ArrowRight}');

    expect(aba('Harmonização')).toHaveFocus();
    expect(aba('Harmonização')).toHaveAttribute('aria-selected', 'true');
    expect(aba('A história')).toHaveAttribute('aria-selected', 'false');
    const painel = screen.getByRole('tabpanel', { name: 'Harmonização' });
    expect(painel).toHaveTextContent('VINHO');
    expect(painel).toHaveTextContent('[Sugestão de tinto encorpado]');
    expect(painel).toHaveTextContent('CERVEJA');
    expect(painel).toHaveTextContent('Goiabada cascão, mel de laranjeira, castanhas');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('End vai para "Ficha técnica"; Home volta; as setas são circulares', async () => {
    const usuario = userEvent.setup();
    renderizar();
    aba('A história').focus();

    await usuario.keyboard('{End}');
    expect(aba('Ficha técnica')).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Ficha técnica' })).toHaveTextContent(
      'Leite: vaca, cru · Massa: semidura',
    );

    await usuario.keyboard('{ArrowRight}');
    expect(aba('A história')).toHaveFocus();

    await usuario.keyboard('{ArrowLeft}');
    expect(aba('Ficha técnica')).toHaveFocus();

    await usuario.keyboard('{Home}');
    expect(aba('A história')).toHaveFocus();
    expect(aba('A história')).toHaveAttribute('aria-selected', 'true');
  });

  it('o clique troca de aba e mostra "Como servir"', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(aba('Como servir'));
    expect(screen.getByRole('tabpanel', { name: 'Como servir' })).toHaveTextContent(
      'Tire da geladeira 40 minutos antes de servir.',
    );
  });
});
