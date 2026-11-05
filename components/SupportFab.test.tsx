import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AtendimentoProvider } from './Atendimento';
import { SacolaProvider } from './SacolaProvider';
import { ATRASO_DA_BOLHA_MS, CHAVE_BOLHA_VISTA, SupportFab } from './SupportFab';

const renderizar = () =>
  render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={null}>
        <SupportFab />
      </AtendimentoProvider>
    </SacolaProvider>,
  );

describe('SupportFab', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tem o botão com rótulo acessível', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Abrir atendimento' })).toBeInTheDocument();
  });

  it('anuncia que abre um diálogo', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Abrir atendimento' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('mostra a bolha só depois de 20 s', () => {
    renderizar();
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS - 1);
    });
    expect(screen.queryByText('Posso ajudar a escolher?')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Posso ajudar a escolher?')).toBeInTheDocument();
  });

  it('não reaparece na mesma sessão', () => {
    const { unmount } = renderizar();
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });
    expect(sessionStorage.getItem(CHAVE_BOLHA_VISTA)).toBe('1');
    unmount();

    renderizar();
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS * 2);
    });
    expect(screen.queryByText('Posso ajudar a escolher?')).not.toBeInTheDocument();
  });

  it('esconde a bolha e abre o painel ao clicar', async () => {
    renderizar();
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    // O painel é um módulo tardio (ADR-0012): com o relógio real, espera a importação.
    vi.useRealTimers();
    expect(await screen.findByRole('dialog', { name: 'Assistente do Ateliê' })).toBeInTheDocument();
    expect(screen.queryByText('Posso ajudar a escolher?')).not.toBeInTheDocument();
  });

  it('mostra a bolha mesmo sem sessionStorage disponível', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    renderizar();
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });
    expect(screen.getByText('Posso ajudar a escolher?')).toBeInTheDocument();
  });
});
