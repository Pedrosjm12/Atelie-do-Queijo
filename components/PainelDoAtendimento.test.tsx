import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TEXTOS_DO_ROTEIRO } from '@/lib/roteiro';
import { AtendimentoProvider } from './Atendimento';
import { SupportFab } from './SupportFab';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// Sacola que recusa o item (limite por item, formato esgotado…): `adicionar` devolve false.
const adicionar = vi.fn(() => false);
vi.mock('./SacolaProvider', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('./SacolaProvider')>();
  return { ...original, useAcoesDaSacola: () => ({ adicionar }) };
});

afterEach(() => {
  cleanup();
  adicionar.mockClear();
});

describe('PainelDoAtendimento: texto de depois da ação (P84, 1.1)', () => {
  it('não aparece quando a sacola recusa o item', async () => {
    const usuario = userEvent.setup();
    render(
      <AtendimentoProvider numeroDoWhatsApp="5520900000000">
        <SupportFab />
      </AtendimentoProvider>,
    );
    await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });

    const campo = screen.getByLabelText('Escreva sua mensagem');
    await usuario.click(campo);
    await usuario.paste('Quero presentear alguém que adora vinho tinto.');
    await usuario.keyboard('{Enter}');
    await usuario.click(await within(dialogo).findByRole('button', { name: 'Sim, com cartão' }));
    await usuario.click(await within(dialogo).findByRole('button', { name: /Meia peça/ }));

    await waitFor(() => expect(adicionar).toHaveBeenCalledTimes(1));
    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(within(log).getByText('Meia peça ~500 g')).toBeVisible();
    expect(within(log).queryByText(TEXTOS_DO_ROTEIRO.depoisDaAcao)).not.toBeInTheDocument();
  });

  it('o texto de uma ação anterior bem-sucedida continua quando a seguinte é recusada', async () => {
    adicionar.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const usuario = userEvent.setup();
    render(
      <AtendimentoProvider numeroDoWhatsApp="5520900000000">
        <SupportFab />
      </AtendimentoProvider>,
    );
    await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });

    for (let vez = 1; vez <= 2; vez++) {
      const campo = screen.getByLabelText('Escreva sua mensagem');
      await usuario.click(campo);
      await usuario.paste('Quero presentear alguém que adora vinho tinto.');
      await usuario.keyboard('{Enter}');
      await usuario.click(await within(dialogo).findByRole('button', { name: 'Sim, com cartão' }));
      await usuario.click(await within(dialogo).findByRole('button', { name: /Meia peça/ }));
      await waitFor(() => expect(adicionar).toHaveBeenCalledTimes(vez));
    }

    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(within(log).getAllByText(TEXTOS_DO_ROTEIRO.depoisDaAcao)).toHaveLength(1);
  });
});
