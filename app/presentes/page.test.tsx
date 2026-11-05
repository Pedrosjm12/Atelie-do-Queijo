import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AtendimentoProvider } from '@/components/Atendimento';
import { SacolaProvider } from '@/components/SacolaProvider';
import { AVISO_DE_NOVA_ABA } from '@/lib/whatsapp';
import PaginaDePresentes, { metadata } from './page';

vi.mock('next/navigation', () => ({ usePathname: () => '/presentes' }));

const renderizar = (numero: string | null) =>
  render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={numero}>
        <PaginaDePresentes />
      </AtendimentoProvider>
    </SacolaProvider>,
  );

const TEXTO_CORPORATIVO = 'Pedidos a partir de [n] kits com personalização.';

describe('página /presentes', () => {
  it('metadados: título do menu (P13/P66) e o parágrafo da §5.7', () => {
    expect(metadata.title).toBe('Presentes');
    expect(metadata.description).toBe(
      'Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão.',
    );
  });

  it('hierarquia: um h1 literal e h2 para kits, "Em todo kit" e o bloco corporativo', () => {
    renderizar('5520900000000');
    expect(screen.getAllByRole('heading').map((h) => [h.tagName, h.textContent])).toEqual([
      ['H1', 'Para quem merece uma boa tábua.'],
      ['H2', 'Primeira Degustação'],
      ['H2', 'Volta ao Mundo'],
      ['H2', 'Grande Cave'],
      ['H2', 'Em todo kit'],
      ['H2', 'Presentes para equipes e clientes.'],
    ]);
    expect(screen.getByText('PRESENTES')).toBeInTheDocument();
  });

  it('kits com a lacuna de preço e sem botão (P55)', () => {
    renderizar('5520900000000');
    expect(screen.getAllByText('R$ [PREÇO]')).toHaveLength(3);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('"Em todo kit" lista os quatro itens da §12 (P56)', () => {
    renderizar('5520900000000');
    const secao = screen.getByRole('region', { name: 'Em todo kit' });
    expect(
      within(secao)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      'Embalagem de presente',
      'Cartão com mensagem (até 200 caracteres)',
      'Data de entrega escolhida',
      'Nota fiscal sem valor visível ao presenteado.',
    ]);
  });

  it('bloco corporativo: âncora, texto com [n] e Pedir orçamento com a mensagem da §8.3', () => {
    renderizar('5520900000000');
    const bloco = screen.getByRole('region', { name: 'Presentes para equipes e clientes.' });
    expect(bloco).toHaveAttribute('id', 'presentes-corporativos');
    expect(bloco).toHaveAttribute('tabindex', '-1');
    expect(within(bloco).getByText(TEXTO_CORPORATIVO)).toBeVisible();

    const link = within(bloco).getByRole('link', { name: 'Pedir orçamento' });
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe(
      'https://wa.me/5520900000000?text=Olá! Quero um orçamento de presentes para empresa.',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleDescription(AVISO_DE_NOVA_ABA);
    // Mesmas classes do botão principal compacto (P57): dourado, sem verde.
    expect(link.className).toMatch(/principal/);
    expect(link.className).toMatch(/compacto/);
  });

  it('sem número do WhatsApp só o texto aparece e nenhum link wa.me existe (P58)', () => {
    const { container } = renderizar(null);
    const bloco = screen.getByRole('region', { name: 'Presentes para equipes e clientes.' });
    expect(within(bloco).queryByRole('link')).not.toBeInTheDocument();
    expect(within(bloco).getByText(TEXTO_CORPORATIVO)).toBeVisible();
    expect(container.innerHTML).not.toContain('wa.me');
  });
});
