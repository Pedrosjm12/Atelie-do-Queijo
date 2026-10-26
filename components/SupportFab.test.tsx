import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ATRASO_DA_BOLHA_MS, CHAVE_BOLHA_VISTA, SupportFab } from './SupportFab';

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
    render(<SupportFab />);
    expect(screen.getByRole('button', { name: 'Abrir atendimento' })).toBeInTheDocument();
  });

  it('mostra a bolha só depois de 20 s', () => {
    render(<SupportFab />);
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
    const { unmount } = render(<SupportFab />);
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });
    expect(sessionStorage.getItem(CHAVE_BOLHA_VISTA)).toBe('1');
    unmount();

    render(<SupportFab />);
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS * 2);
    });
    expect(screen.queryByText('Posso ajudar a escolher?')).not.toBeInTheDocument();
  });

  it('esconde a bolha e chama onClick ao clicar', () => {
    const aoClicar = vi.fn();
    render(<SupportFab onClick={aoClicar} />);
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    expect(aoClicar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Posso ajudar a escolher?')).not.toBeInTheDocument();
  });

  it('mostra a bolha mesmo sem sessionStorage disponível', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    render(<SupportFab />);
    act(() => {
      vi.advanceTimersByTime(ATRASO_DA_BOLHA_MS);
    });
    expect(screen.getByText('Posso ajudar a escolher?')).toBeInTheDocument();
  });
});
