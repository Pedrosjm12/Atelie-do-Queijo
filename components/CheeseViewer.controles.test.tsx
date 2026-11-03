import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { temModelo } from '@/data/modelos3d';
import { CheeseViewer } from './CheeseViewer';

vi.mock('@/data/modelos3d', () => ({
  temModelo: vi.fn(() => false),
  caminhoDoModelo: (slug: string, variante: string) => `/models/${slug}-${variante}.glb`,
}));
// O jsdom não tem WebGL: com GLB simulado, o 3D só "vale" se o suporte disser que existe.
vi.mock('@/lib/suporte3d', async (original) => ({
  ...(await original<typeof import('@/lib/suporte3d')>()),
  temWebGL: () => true,
}));

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q;
}

const ROTULO_CORTADO = 'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras';

function simularMovimentoReduzido(reduzido: boolean) {
  window.matchMedia = ((consulta: string) =>
    ({
      matches: reduzido && consulta.includes('reduce'),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe('CheeseViewer: tela cheia', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
  });

  it('pede tela cheia para o palco inteiro e o aria-pressed acompanha o fullscreenchange', async () => {
    const pedir = vi.spyOn(Element.prototype, 'requestFullscreen');
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const botao = screen.getByRole('button', { name: 'Tela cheia' });
    const palco = screen.getByRole('toolbar').parentElement;

    fireEvent.click(botao);
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir.mock.contexts[0]).toBe(palco);
    await waitFor(() => expect(botao).toHaveAttribute('aria-pressed', 'true'));

    // Esc (ou qualquer saída do navegador) dispara o mesmo evento e desliga o estado.
    await act(async () => {
      await document.exitFullscreen();
    });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicar de novo em Tela cheia sai dela', async () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const botao = screen.getByRole('button', { name: 'Tela cheia' });
    fireEvent.click(botao);
    await waitFor(() => expect(botao).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.click(botao);
    await waitFor(() => expect(botao).toHaveAttribute('aria-pressed', 'false'));
    expect(document.fullscreenElement).toBeNull();
  });

  it('sem a Fullscreen API: aria-disabled, descrição atual e nenhuma chamada', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
    const pedir = vi.spyOn(Element.prototype, 'requestFullscreen');
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const botao = screen.getByRole('button', { name: 'Tela cheia' });
    expect(botao).toHaveAttribute('aria-disabled', 'true');
    expect(botao).toHaveAccessibleDescription('Tela cheia indisponível neste navegador');
    fireEvent.click(botao);
    expect(pedir).not.toHaveBeenCalled();
  });
});

describe('CheeseViewer: Aproximar por duplo clique e duplo toque', () => {
  let agora: MockInstance<() => number>;
  beforeEach(() => {
    agora = vi.spyOn(performance, 'now');
  });
  afterEach(() => agora.mockRestore());

  it('dblclick na ilustração liga e desliga o Aproximar', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const aproximar = screen.getByRole('button', { name: 'Aproximar' });
    const ilustracao = screen.getByRole('img', { name: ROTULO_CORTADO });
    fireEvent.doubleClick(ilustracao);
    expect(aproximar).toHaveAttribute('aria-pressed', 'true');
    fireEvent.doubleClick(ilustracao);
    expect(aproximar).toHaveAttribute('aria-pressed', 'false');
  });

  it('dois toques próximos e rápidos ligam o Aproximar; distantes ou lentos, não', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const aproximar = screen.getByRole('button', { name: 'Aproximar' });
    const ilustracao = screen.getByRole('img', { name: ROTULO_CORTADO });
    const toque = (x: number, instante: number) => {
      agora.mockReturnValue(instante);
      fireEvent.pointerUp(ilustracao, { pointerType: 'touch', clientX: x, clientY: 10 });
    };

    toque(10, 1000);
    toque(200, 1100); // longe: vira só um toque novo
    expect(aproximar).toHaveAttribute('aria-pressed', 'false');
    toque(205, 1700); // devagar demais
    expect(aproximar).toHaveAttribute('aria-pressed', 'false');
    toque(210, 1800); // perto e rápido
    expect(aproximar).toHaveAttribute('aria-pressed', 'true');
  });

  it('o dblclick que o navegador dispara depois do duplo toque não desfaz o zoom', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const aproximar = screen.getByRole('button', { name: 'Aproximar' });
    const ilustracao = screen.getByRole('img', { name: ROTULO_CORTADO });
    const toque = (instante: number) => {
      agora.mockReturnValue(instante);
      fireEvent.pointerUp(ilustracao, { pointerType: 'touch', clientX: 5, clientY: 5 });
    };
    toque(100);
    toque(200);
    expect(aproximar).toHaveAttribute('aria-pressed', 'true');
    agora.mockReturnValue(250);
    fireEvent.doubleClick(ilustracao);
    expect(aproximar).toHaveAttribute('aria-pressed', 'true');
  });

  it('o mouse não conta como toque (o dblclick cuida dele)', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const ilustracao = screen.getByRole('img', { name: ROTULO_CORTADO });
    fireEvent.pointerUp(ilustracao, { pointerType: 'mouse' });
    fireEvent.pointerUp(ilustracao, { pointerType: 'mouse' });
    expect(screen.getByRole('button', { name: 'Aproximar' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('CheeseViewer: casos de borda adicionais', () => {
  let agora: MockInstance<() => number>;
  beforeEach(() => {
    agora = vi.spyOn(performance, 'now');
  });
  afterEach(() => {
    agora.mockRestore();
    vi.mocked(temModelo).mockReset();
    vi.mocked(temModelo).mockReturnValue(false);
    vi.restoreAllMocks();
  });

  const toques = (alvo: HTMLElement, instantes: number[], tipo = 'touch') => {
    for (const t of instantes) {
      agora.mockReturnValue(t);
      fireEvent.pointerUp(alvo, { pointerType: tipo, clientX: 5, clientY: 5 });
    }
  };

  it('pergunta ao manifesto pela variante exibida: cortado e depois inteiro', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(temModelo).toHaveBeenLastCalledWith('canastra-curado', 'cortado');
    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));
    expect(temModelo).toHaveBeenLastCalledWith('canastra-curado', 'inteiro');
  });

  it('GLB só do inteiro: Girar fica desabilitado no corte e habilitado na peça inteira', () => {
    vi.mocked(temModelo).mockImplementation((_slug, variante) => variante === 'inteiro');
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const girar = screen.getByRole('button', { name: 'Girar' });
    expect(girar).toHaveAttribute('aria-disabled', 'true');
    expect(girar).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));
    expect(girar).not.toHaveAttribute('aria-disabled');
    expect(girar).toHaveAttribute('aria-pressed', 'true');
  });

  it('queijo sem arte A.5 consulta o manifesto pela variante inteiro', () => {
    render(<CheeseViewer queijo={queijo('manchego')} />);
    expect(temModelo).toHaveBeenLastCalledWith('manchego', 'inteiro');
  });

  it('clicar em Girar habilitado também esconde a dica', () => {
    vi.mocked(temModelo).mockReturnValue(true);
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByText(/Arraste para girar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Girar' }));
    expect(screen.queryByText(/Arraste para girar/)).not.toBeInTheDocument();
  });

  it('caneta conta como toque: dois toques rápidos ligam o Aproximar', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    toques(screen.getByRole('img', { name: ROTULO_CORTADO }), [100, 200], 'pen');
    expect(screen.getByRole('button', { name: 'Aproximar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('três toques seguidos: o terceiro começa nova sequência e não desliga o zoom', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    toques(screen.getByRole('img', { name: ROTULO_CORTADO }), [100, 200, 300]);
    expect(screen.getByRole('button', { name: 'Aproximar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('dblclick depois da janela de 700 ms do duplo toque volta a alternar o zoom', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const ilustracao = screen.getByRole('img', { name: ROTULO_CORTADO });
    toques(ilustracao, [100, 200]);
    agora.mockReturnValue(1000);
    fireEvent.doubleClick(ilustracao);
    expect(screen.getByRole('button', { name: 'Aproximar' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('fullscreenchange de outro elemento não marca a Tela cheia como ativa', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    act(() => {
      void document.body.requestFullscreen();
    });
    expect(screen.getByRole('button', { name: 'Tela cheia' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('recusa do navegador em entrar na tela cheia não quebra e mantém aria-pressed=false', async () => {
    vi.spyOn(Element.prototype, 'requestFullscreen').mockRejectedValue(new Error('negado'));
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const botao = screen.getByRole('button', { name: 'Tela cheia' });
    fireEvent.click(botao);
    await act(async () => {
      await Promise.resolve();
    });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
  });

  it('queijo sem corte: a barra tem 3 botões e a seta direita circula do último ao primeiro', () => {
    render(<CheeseViewer queijo={queijo('manchego')} />);
    const botoes = Array.from(
      screen.getByRole('toolbar', { name: 'Controles do 3D' }).querySelectorAll('button'),
    );
    expect(botoes).toHaveLength(3);
    botoes[2]?.focus();
    fireEvent.keyDown(botoes[2] as HTMLElement, { key: 'ArrowRight' });
    expect(botoes[0]).toHaveFocus();
  });
});

describe('CheeseViewer: Girar com GLB (manifesto simulado) e movimento reduzido', () => {
  afterEach(() => {
    vi.mocked(temModelo).mockReturnValue(false);
    simularMovimentoReduzido(false);
  });

  it('com GLB, Girar começa ligado, habilitado e alterna', () => {
    vi.mocked(temModelo).mockReturnValue(true);
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const girar = screen.getByRole('button', { name: 'Girar' });
    expect(girar).toHaveAttribute('aria-pressed', 'true');
    expect(girar).not.toHaveAttribute('aria-disabled');
    fireEvent.click(girar);
    expect(girar).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(girar);
    expect(girar).toHaveAttribute('aria-pressed', 'true');
  });

  it('com GLB e movimento reduzido, Girar começa em false e só liga se a pessoa ligar', () => {
    vi.mocked(temModelo).mockReturnValue(true);
    simularMovimentoReduzido(true);
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const girar = screen.getByRole('button', { name: 'Girar' });
    expect(girar).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(girar);
    expect(girar).toHaveAttribute('aria-pressed', 'true');
  });
});
