import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider, BotaoAbrirAtendimento } from './Atendimento';
import { TEXTO_ATENDIMENTO_INDISPONIVEL } from './atendimento.contexto';
import { SacolaProvider } from './SacolaProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// Simula o chunk que não carrega: o módulo do painel depende de SupportPanel, e a avaliação dele
// falha. Assim o import() do painel rejeita de verdade, como sem rede ou após um deploy novo.
vi.mock('./SupportPanel', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

const AVISO = 'Abrindo o atendimento…';

describe('Atendimento: chunk do painel indisponível', () => {
  beforeEach(() => {
    // O React registra o erro capturado pela borda; ele é esperado aqui.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('a página continua viva, devolve o foco ao gatilho e cada clique tenta de novo', async () => {
    const usuario = userEvent.setup();
    render(
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <p>conteúdo da página</p>
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    const gatilho = screen.getByRole('button', { name: 'Fale conosco' });
    const erros = () => vi.mocked(console.error).mock.calls.length;

    await usuario.click(gatilho);
    // Falha rápida: o aviso de "abrindo" só nasce depois de ~200 ms e nem chega a aparecer.
    await vi.waitFor(() => expect(erros()).toBeGreaterThan(0));
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Assistente do Ateliê' })).not.toBeInTheDocument();
    expect(screen.getByText('conteúdo da página')).toBeInTheDocument();
    expect(gatilho).toHaveFocus();
    // P84, 2.1: com o painel fechado, o aviso vai à região de status (a do "Adicionado à sacola").
    const aviso = document.querySelector('[data-aviso-da-sacola]');
    await vi.waitFor(() => expect(aviso).toHaveTextContent(TEXTO_ATENDIMENTO_INDISPONIVEL));
    expect(aviso).toHaveAttribute('role', 'status');
    const errosDaPrimeira = erros();
    expect(errosDaPrimeira).toBeGreaterThan(0);

    // O painel foi descartado por inteiro: o clique seguinte monta um lazy novo e tenta de novo
    // (aparece o aviso de novo) em vez de ficar preso no import rejeitado do lazy antigo.
    await usuario.click(gatilho);
    // Falha rápida: o aviso de "abrindo" só nasce depois de ~200 ms e nem chega a aparecer.
    await vi.waitFor(() => expect(erros()).toBeGreaterThan(errosDaPrimeira));
    await vi.waitFor(() => expect(gatilho).toHaveFocus());
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText('conteúdo da página')).toBeInTheDocument();
  });
});
