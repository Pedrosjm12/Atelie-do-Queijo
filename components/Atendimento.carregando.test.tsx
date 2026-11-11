import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider, BotaoAbrirAtendimento } from './Atendimento';
import { SacolaProvider } from './SacolaProvider';
import { SupportFab } from './SupportFab';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// O `import()` do painel fica pendente até `liberarChunk()`: simula o chunk ainda baixando.
const adiado = vi.hoisted(() => {
  let liberar: () => void = () => undefined;
  const promessa = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  return { promessa, liberar: () => liberar() };
});

vi.mock('./PainelDoAtendimento', async (importarOriginal) => {
  await adiado.promessa;
  return importarOriginal();
});

describe('Atendimento: gatilhos enquanto o chunk baixa (P80 = A)', () => {
  it('aria-busy="true" só entre o clique e a chegada do chunk', async () => {
    const usuario = userEvent.setup();
    render(
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
          <BotaoAbrirAtendimento variante="principal">Pedir ajuda</BotaoAbrirAtendimento>
          <SupportFab />
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    const gatilhos = [
      screen.getByRole('button', { name: 'Fale conosco' }),
      screen.getByRole('button', { name: 'Pedir ajuda' }),
      screen.getByRole('button', { name: 'Abrir atendimento' }),
    ];
    for (const gatilho of gatilhos) expect(gatilho).not.toHaveAttribute('aria-busy');

    await usuario.click(gatilhos[0]!);
    // Só depois de ~200 ms: com o chunk em cache nada pisca.
    for (const gatilho of gatilhos) expect(gatilho).not.toHaveAttribute('aria-busy');
    await vi.waitFor(() => {
      for (const gatilho of gatilhos) expect(gatilho).toHaveAttribute('aria-busy', 'true');
    });
    expect(screen.getByText('Abrindo o atendimento…')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Assistente do Ateliê' })).not.toBeInTheDocument();

    adiado.liberar();
    await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
    await vi.waitFor(() => {
      for (const gatilho of gatilhos) expect(gatilho).not.toHaveAttribute('aria-busy');
    });
  });
});
