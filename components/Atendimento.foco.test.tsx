import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider, BotaoAbrirAtendimento } from './Atendimento';
import { SacolaProvider } from './SacolaProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// O `import()` do painel fica pendente e depois rejeita: simula o chunk que falha depois do clique.
const adiado = vi.hoisted(() => {
  let falhar: () => void = () => undefined;
  const promessa = new Promise<void>((resolver) => {
    falhar = resolver;
  });
  return { promessa, falhar: () => falhar() };
});

vi.mock('./SupportPanel', async () => {
  await adiado.promessa;
  throw new Error('Failed to fetch dynamically imported module');
});

describe('Atendimento: falha do chunk e foco', () => {
  it('não rouba o foco de quem já foi para outro botão, e o aviso 2.1 aparece', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const usuario = userEvent.setup();
    render(
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
          <button type="button">Outro botão</button>
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    await usuario.click(screen.getByRole('button', { name: 'Fale conosco' }));
    const outro = screen.getByRole('button', { name: 'Outro botão' });
    act(() => outro.focus());

    adiado.falhar();
    const aviso = document.querySelector('[data-aviso-da-sacola]');
    await vi.waitFor(() => expect(aviso).toHaveTextContent('Não conseguimos abrir o atendimento'));
    expect(outro).toHaveFocus();
  });
});
