import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkDaSacola } from '@/components/LinkDaSacola';
import { SacolaProvider } from '@/components/SacolaProvider';
import type { Estoque } from '@/data/cheeses';
import { obterQueijo } from '@/lib/catalogo';
import { PainelDeCompra } from './PainelDeCompra';

const canastra = obterQueijo('canastra-curado');
if (!canastra) throw new Error('canastra-curado');
const formatos = canastra.formatos;

/** O texto do preço usa U+00A0 depois de "R$"; o teste compara com espaço comum. */
const semNbsp = (texto: string | null | undefined) => (texto ?? '').replace(/ /g, ' ');

function renderizar(estoque: Estoque = { situacao: 'disponivel' }) {
  window.localStorage.clear();
  return render(
    <SacolaProvider>
      <PainelDeCompra
        slug="canastra-curado"
        formatos={formatos}
        estoque={estoque}
        frete={<div>Frete fictício</div>}
      />
      <LinkDaSacola />
    </SacolaProvider>,
  );
}

const barra = () => {
  const el = document.querySelector<HTMLElement>('[data-barra-compra]');
  if (!el) throw new Error('barra fixa ausente');
  return el;
};

const botoesDeFormato = () =>
  within(screen.getByRole('group', { name: 'FORMATO' })).getAllByRole('radio');

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
    expect(botoes[0]).toBeChecked();
    expect(botoes[1]).not.toBeChecked();
  });

  it('"Meia peça" mostra R$ 78,00 e Pix R$ 74,10 no painel e na barra', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();

    await usuario.click(botaoDeFormato(1));

    expect(botaoDeFormato(1)).toBeChecked();
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
    const quantidade = within(screen.getByRole('group', { name: 'Quantidade' })).getByRole(
      'status',
    );

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

  it('Adicionar e Embalar ficam focáveis e com ação; só o queijista segue sem ação', () => {
    renderizar();
    const adicionar = screen.getAllByRole('button', { name: 'Adicionar à sacola' });
    expect(adicionar).toHaveLength(2); // inline e barra fixa
    for (const botao of adicionar) expect(botao).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('button', { name: /Embalar para presente/ })).not.toHaveAttribute(
      'aria-disabled',
    );
    // Duas posições (celular antes do frete, desktop depois), alternadas por CSS.
    const queijistas = screen.getAllByRole('button', { name: 'Fale com um queijista' });
    expect(queijistas).toHaveLength(2);
    for (const botao of queijistas) expect(botao).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByText('Dúvidas sobre este queijo?')).toHaveLength(2);
    expect(screen.getByText('Frete fictício')).toBeInTheDocument();
  });

  const aviso = () => document.querySelector<HTMLElement>('[data-aviso-da-sacola]');

  const salva = () =>
    JSON.parse(window.localStorage.getItem('atelie:sacola:v1') ?? '{"itens":[]}') as {
      itens: unknown[];
      presente: boolean;
    };

  it('"Meia peça" × 2 adiciona canastra-curado, meia, quantidade 2', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botaoDeFormato(1));
    await usuario.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    await usuario.click(screen.getAllByRole('button', { name: 'Adicionar à sacola' })[0]!);
    expect(salva().itens).toEqual([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 }]);
    expect(screen.getByRole('link', { name: 'Sacola 2 itens' })).toBeInTheDocument();
    await waitFor(() => expect(aviso()).toHaveTextContent('Adicionado à sacola. Boa escolha.'));
  });

  it('a barra fixa adiciona o formato escolhido', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botaoDeFormato(2));
    await usuario.click(within(barra()).getByRole('button', { name: 'Adicionar à sacola' }));
    expect(salva().itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 1 },
    ]);
  });

  it('o + para em 10 (aria-disabled) e adicionar além do limite mostra o aviso do P25', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    for (let i = 0; i < 12; i++) await usuario.click(mais);
    expect(
      within(screen.getByRole('group', { name: 'Quantidade' })).getByRole('status'),
    ).toHaveTextContent('10');
    expect(mais).toHaveAttribute('aria-disabled', 'true');
    const adicionar = screen.getAllByRole('button', { name: 'Adicionar à sacola' })[0]!;
    await usuario.click(adicionar);
    expect(salva().itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 10 },
    ]);
    await usuario.click(adicionar);
    expect(salva().itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 10 },
    ]);
    await waitFor(() =>
      expect(aviso()).toHaveTextContent('Você já tem 10 unidades deste queijo na sacola.'),
    );
  });

  it('Embalar para presente adiciona o item escolhido e marca o pedido e mostra o texto', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const presente = screen.getByRole('button', { name: /Embalar para presente/ });
    expect(presente).not.toHaveAttribute('aria-pressed');
    expect(screen.queryByText('Pedido marcado como presente')).not.toBeInTheDocument();
    await usuario.click(botaoDeFormato(1));
    await usuario.click(presente);
    expect(salva()).toMatchObject({
      presente: true,
      itens: [{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }],
    });
    expect(presente).not.toHaveAttribute('aria-pressed');
    expect(screen.getByText('Pedido marcado como presente')).toBeVisible();
    expect(presente.parentElement).toHaveAttribute('data-presente', 'true');
    expect(presente).toHaveFocus();
  });

  it('a nota do presente fica numa região role="status" montada desde o início (vazia sem presente)', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const regiao = screen
      .getAllByRole('status')
      .find((r) => r.parentElement?.hasAttribute('data-presente'));
    expect(regiao).toBeDefined();
    expect(regiao).toBeEmptyDOMElement();
    await usuario.click(screen.getByRole('button', { name: /Embalar para presente/ }));
    expect(regiao).toHaveTextContent('Pedido marcado como presente');
    expect(regiao?.isConnected).toBe(true);
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

  it('última peça: singular "Resta 1 peça deste lote."', () => {
    renderizar({ situacao: 'ultimas', restam: 1 });
    expect(screen.getByText('Resta 1 peça deste lote.')).toBeInTheDocument();
    expect(screen.queryByText(/Restam/)).not.toBeInTheDocument();
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
    // Nada a adicionar nem a embalar enquanto o lote está esgotado.
    expect(screen.getByRole('button', { name: /Embalar para presente/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Aumentar quantidade' })).not.toBeInTheDocument();
  });
});
