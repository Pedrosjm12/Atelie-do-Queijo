import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Estoque } from '@/data/cheeses';
import { obterQueijo } from '@/lib/catalogo';
import { PainelDeCompra } from './PainelDeCompra';

const canastra = obterQueijo('canastra-curado');
if (!canastra) throw new Error('canastra-curado');
const formatos = canastra.formatos;

/** O texto do preço usa U+00A0 depois de "R$"; o teste compara com espaço comum. */
const semNbsp = (texto: string | null | undefined) => (texto ?? '').replace(/ /g, ' ');

function renderizar(estoque: Estoque = { situacao: 'disponivel' }) {
  return render(
    <PainelDeCompra formatos={formatos} estoque={estoque} frete={<div>Frete fictício</div>} />,
  );
}

const barra = () => {
  const el = document.querySelector<HTMLElement>('[data-barra-compra]');
  if (!el) throw new Error('barra fixa ausente');
  return el;
};

const botoesDeFormato = () =>
  within(screen.getByRole('group', { name: 'FORMATO' })).getAllByRole('button');

const botaoDeFormato = (indice: number) => {
  const botao = botoesDeFormato()[indice];
  if (!botao) throw new Error(`formato ${indice}`);
  return botao;
};

describe('PainelDeCompra', () => {
  it('começa na peça inteira: R$ 136,00 e Pix R$ 129,20', () => {
    const { container } = renderizar();
    expect(semNbsp(container.textContent)).toContain('R$ 136,00');
    expect(semNbsp(container.textContent)).toContain('ou R$ 129,20 no Pix (5% off)');
    const botoes = botoesDeFormato();
    expect(botoes).toHaveLength(3);
    expect(botoes[0]).toHaveAttribute('aria-pressed', 'true');
    expect(botoes[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('"Meia peça" mostra R$ 78,00 e Pix R$ 74,10 no painel e na barra', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();

    await usuario.click(botaoDeFormato(1));

    expect(botaoDeFormato(1)).toHaveAttribute('aria-pressed', 'true');
    expect(semNbsp(container.textContent)).toContain('ou R$ 74,10 no Pix (5% off)');
    expect(semNbsp(screen.getByTestId('preco-do-painel').textContent)).toBe('R$ 78,00');
    expect(semNbsp(barra().textContent)).toContain('R$ 78,00');
    expect(barra()).toHaveTextContent('5% off no Pix');
  });

  it('"Fração" mostra R$ 49,00 e Pix R$ 46,55', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();

    await usuario.click(botaoDeFormato(2));

    expect(semNbsp(container.textContent)).toContain('ou R$ 46,55 no Pix (5% off)');
    expect(semNbsp(barra().textContent)).toContain('R$ 49,00');
  });

  it('a quantidade começa em 1, o − fica aria-disabled e o + soma', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const menos = screen.getByRole('button', { name: 'Diminuir quantidade' });
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    const quantidade = screen.getByLabelText('Quantidade');

    expect(quantidade).toHaveTextContent('1');
    expect(menos).toHaveAttribute('aria-disabled', 'true');

    await usuario.click(mais);
    await usuario.click(mais);
    expect(quantidade).toHaveTextContent('3');
    expect(menos).not.toHaveAttribute('aria-disabled');

    await usuario.click(menos);
    await usuario.click(menos);
    expect(quantidade).toHaveTextContent('1');
    expect(menos).toHaveAttribute('aria-disabled', 'true');
  });

  it('os botões sem ação ficam focáveis, com aria-disabled e aviso', () => {
    renderizar();
    const adicionar = screen.getAllByRole('button', { name: 'Adicionar à sacola' });
    expect(adicionar).toHaveLength(2); // inline e barra fixa
    for (const botao of adicionar) {
      expect(botao).toHaveAttribute('aria-disabled', 'true');
      expect(botao).toBeEnabled();
    }
    expect(screen.getByRole('button', { name: /Embalar para presente/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Fale com um queijista' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText('Dúvidas sobre este queijo?')).toBeInTheDocument();
    expect(screen.getByText('Frete fictício')).toBeInTheDocument();
  });

  it('disponível: sem aviso de estoque', () => {
    renderizar();
    expect(screen.queryByText(/Restam/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Esgotado/)).not.toBeInTheDocument();
  });

  it('últimas unidades: "Restam 3 peças deste lote."', () => {
    renderizar({ situacao: 'ultimas', restam: 3 });
    expect(screen.getByText('Restam 3 peças deste lote.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Adicionar à sacola' })).toHaveLength(2);
  });

  it('últimas unidades sem número: mantém a lacuna "[n]"', () => {
    renderizar({ situacao: 'ultimas', restam: null });
    expect(screen.getByText('Restam [n] peças deste lote.')).toBeInTheDocument();
  });

  it('esgotado: aviso da spec e o botão principal vira "Avise-me", sem quantidade', () => {
    renderizar({ situacao: 'esgotado' });
    expect(screen.getByText('Esgotado neste lote. Avise-me quando voltar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adicionar à sacola' })).not.toBeInTheDocument();
    const avise = screen.getAllByRole('button', { name: 'Avise-me' });
    expect(avise).toHaveLength(2); // inline e barra fixa
    for (const botao of avise) expect(botao).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Aumentar quantidade' })).not.toBeInTheDocument();
  });
});
