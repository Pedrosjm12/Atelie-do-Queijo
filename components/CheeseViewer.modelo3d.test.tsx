import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { temModelo } from '@/data/modelos3d';
import { querEconomizarDados, temWebGL } from '@/lib/suporte3d';
import { CheeseViewer } from './CheeseViewer';

// Manifesto, suporte do navegador e biblioteca simulados: o jsdom não tem WebGL nem o 3D real.
vi.mock('@/data/modelos3d', async (original) => ({
  ...(await original<typeof import('@/data/modelos3d')>()),
  temModelo: vi.fn(() => true),
}));
vi.mock('@/lib/suporte3d', async (original) => ({
  ...(await original<typeof import('@/lib/suporte3d')>()),
  temWebGL: vi.fn(() => true),
  querEconomizarDados: vi.fn(() => false),
}));
// O elemento real lê `self.ModelViewerElement` ao ser construído: o teste confere o que havia lá
// quando a biblioteca foi importada e quando o `src` foi definido.
type Locais = { dracoDecoderLocation?: string; ktx2TranscoderLocation?: string } | undefined;
const locaisAgora = (): Locais =>
  (globalThis as { ModelViewerElement?: Locais }).ModelViewerElement;
const biblioteca = vi.hoisted(() => ({ locaisNaImportacao: [] as unknown[] }));
vi.mock('@google/model-viewer', () => {
  biblioteca.locaisNaImportacao.push(
    structuredClone((globalThis as { ModelViewerElement?: object }).ModelViewerElement),
  );
  return {};
});

/** Elemento falso: guarda o que o componente configura e deixa o teste disparar os eventos. */
class ModeloFalso extends HTMLElement {
  static decodificadoresNoSrc: string[] = [];
  cameraOrbit = '';
  saltos = 0;
  updateComplete = Promise.resolve(true);
  jumpCameraToGoal() {
    this.saltos++;
  }
  orbita = { theta: 0.5, phi: 1.3, radius: 2 };
  getCameraOrbit() {
    return this.orbita;
  }
  attributeChangedCallback() {}
  setAttribute(nome: string, valor: string) {
    if (nome === 'src') {
      ModeloFalso.decodificadoresNoSrc.push(
        `${locaisAgora()?.dracoDecoderLocation}|${locaisAgora()?.ktx2TranscoderLocation}`,
      );
    }
    super.setAttribute(nome, valor);
  }
}

// Esquenta o módulo do ModeloDoQueijo (o primeiro `import()` pesa na máquina carregada) e dá
// folga aos testes, que esperam trabalho assíncrono de verdade.
vi.setConfig({ testTimeout: 20_000 });
beforeAll(async () => {
  await import('./CamadaDoModelo');
  if (!customElements.get('model-viewer')) customElements.define('model-viewer', ModeloFalso);
});

const ROTULO_CORTADO = 'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras';
const ROTULO_INTEIRO = 'Canastra curado, peça inteira';
const PREPARANDO = 'Preparando a peça…';
const PRONTO = 'Peça pronta. Use Girar à esquerda ou à direita.';
const SEM_WEBGL = 'Seu navegador não exibe o 3D. Veja as fotos abaixo.';

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q;
}

const observadores = () =>
  window.IntersectionObserver as unknown as { disparar(visivel: boolean): void };
const mostrarPalco = () => act(() => observadores().disparar(true));
const modelo = (container: HTMLElement) =>
  container.querySelector('model-viewer') as ModeloFalso | null;
const camadaDoModelo = (el: Element) => el.parentElement?.parentElement as HTMLElement;

async function carregarModelo(container: HTMLElement) {
  mostrarPalco();
  await waitFor(() => expect(modelo(container)).not.toBeNull(), { timeout: 5000 });
  return modelo(container) as ModeloFalso;
}

const esperarUmPouco = () =>
  act(async () => {
    await new Promise((ok) => setTimeout(ok, 30));
  });

function disparar(el: Element, tipo: string, detail?: unknown) {
  act(() => {
    el.dispatchEvent(new CustomEvent(tipo, { detail }));
  });
}

function simularMovimentoReduzido(reduzido: boolean) {
  window.matchMedia = ((consulta: string) =>
    ({
      matches: reduzido && consulta.includes('reduce'),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

beforeEach(() => {
  ModeloFalso.decodificadoresNoSrc = [];
});
afterEach(() => {
  vi.useRealTimers();
  vi.mocked(temModelo).mockImplementation(() => true);
  vi.mocked(temWebGL).mockReturnValue(true);
  vi.mocked(querEconomizarDados).mockReturnValue(false);
  simularMovimentoReduzido(false);
});

describe('CheeseViewer com GLB: gatilho e ciclo de carregamento', () => {
  it('antes do gatilho só há o SVG e a região da legenda, vazia', () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('palco fora da janela: nada é importado nem montado', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    act(() => observadores().disparar(false));
    await esperarUmPouco();
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('visível e ocioso: mostra "Preparando a peça…" e monta o model-viewer; o SVG segue visível', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO), {
      timeout: 5000,
    });
    const el = await waitFor(
      () => {
        const achado = modelo(container);
        expect(achado).not.toBeNull();
        return achado as ModeloFalso;
      },
      { timeout: 5000 },
    );
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
    // Enquanto prepara, o modelo está por cima mas inerte e transparente.
    expect(camadaDoModelo(el)).toHaveAttribute('data-pronto', 'false');
    expect(camadaDoModelo(el)).toHaveAttribute('inert');
  });

  it('configura os atributos da §11, o alt do SVG, o src do manifesto e NÃO usa ar nem poster', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    expect(el).toHaveAttribute('src', '/models/canastra-curado-cortado.glb');
    expect(el).toHaveAttribute('alt', ROTULO_CORTADO);
    expect(el).toHaveAttribute('camera-controls');
    expect(el).toHaveAttribute('auto-rotate');
    expect(el).toHaveAttribute('auto-rotate-delay', '0');
    expect(el).toHaveAttribute('rotation-per-second', '36deg');
    expect(el).toHaveAttribute('shadow-intensity', '1');
    expect(el).toHaveAttribute('exposure', '0.9');
    expect(el).toHaveAttribute('interaction-prompt', 'none');
    expect(el).toHaveAttribute('touch-action', 'pan-y');
    expect(el).toHaveAttribute('loading', 'eager');
    expect(el).not.toHaveAttribute('ar');
    expect(el).not.toHaveAttribute('ar-modes');
    expect(el).not.toHaveAttribute('poster');
    expect(screen.queryByText('Ver na mesa')).toBeNull();
  });

  it('aponta os decodificadores para /decodificadores/ ANTES de definir o src (sem CDN)', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    await carregarModelo(container);
    expect(biblioteca.locaisNaImportacao[0]).toEqual({
      dracoDecoderLocation: '/decodificadores/draco/',
      ktx2TranscoderLocation: '/decodificadores/basis/',
      lottieLoaderLocation: '/decodificadores/lottie/LottieLoader.js',
    });
    expect(ModeloFalso.decodificadoresNoSrc).toEqual([
      '/decodificadores/draco/|/decodificadores/basis/',
    ]);
  });

  it('traz os textos de acessibilidade em português (P42)', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    const a11y = JSON.parse(el.getAttribute('a11y') ?? '{}') as Record<string, string>;
    expect(a11y['interaction-prompt']).toMatch(/setas do teclado/);
    expect(a11y['upper-front']).toBe('Vista por cima, de frente');
    expect(Object.values(a11y).join(' ')).not.toMatch(/View|stage|Use mouse/);
  });

  it('load: o modelo substitui o SVG (sai da árvore de acessibilidade) e a legenda some', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load', { url: '/models/canastra-curado-cortado.glb' });
    expect(camadaDoModelo(el)).toHaveAttribute('data-pronto', 'true');
    expect(camadaDoModelo(el)).not.toHaveAttribute('inert');
    expect(screen.queryByRole('img', { name: ROTULO_CORTADO })).toBeNull(); // aria-hidden + visibility: hidden
    expect(screen.getByRole('status')).toHaveTextContent(PRONTO); // só leitor de tela
  });

  it('error: volta ao SVG, sem texto novo, e o elemento sai da árvore', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'error', { type: 'webglcontextlost' });
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Girar' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('error depois de pronto também volta ao SVG (contexto perdido)', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load');
    disparar(el, 'error', { type: 'webglcontextlost' });
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
  });

  it('20 s sem load: volta ao SVG e a legenda some (relógio falso)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10); // o navegador fica ocioso
    });
    expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(19_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_100);
    });
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
  });

  it('load antes de 20 s cancela o tempo-limite', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    await vi.waitFor(() => expect(modelo(container)).not.toBeNull(), {
      interval: 5,
      timeout: 5000,
    });
    disparar(modelo(container) as Element, 'load');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(modelo(container)).not.toBeNull();
    expect(camadaDoModelo(modelo(container) as Element)).toHaveAttribute('data-pronto', 'true');
  });

  it('desmontar libera tudo: observador, timers e o elemento', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container, unmount } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(vi.getTimerCount()).toBe(0);
    mostrarPalco();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(vi.getTimerCount()).toBe(1); // o tempo-limite de 20 s
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(container.querySelector('model-viewer')).toBeNull();
  });

  it('desmontar antes de o palco ficar visível desconecta o observador', () => {
    const IO = window.IntersectionObserver as unknown as {
      instancias: unknown[];
      desconexoes: number;
    };
    const { unmount } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(IO.instancias).toHaveLength(1);
    unmount();
    expect(IO.desconexoes).toBe(1);
    expect(IO.instancias).toHaveLength(0);
    expect(() => act(() => observadores().disparar(true))).not.toThrow();
  });
});

describe('CheeseViewer com GLB: situações em que o 3D não entra', () => {
  it('sem WebGL: SVG com a mensagem da §7.5, nenhum observador, Girar desabilitado', async () => {
    vi.mocked(temWebGL).mockReturnValue(false);
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('status')).toHaveTextContent(SEM_WEBGL);
    mostrarPalco();
    await esperarUmPouco();
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Girar' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Girar à esquerda' })).toBeNull();
  });

  it('economia de dados: o GLB não baixa sozinho e não há legenda', async () => {
    vi.mocked(querEconomizarDados).mockReturnValue(true);
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await esperarUmPouco();
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('sem GLB nenhum: nada de legenda, região nem consulta ao navegador', () => {
    vi.mocked(temModelo).mockImplementation(() => false);
    vi.mocked(temWebGL).mockClear();
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText(PREPARANDO)).toBeNull();
    expect(screen.queryByText(SEM_WEBGL)).toBeNull();
    expect(temWebGL).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Girar à esquerda' })).toBeNull();
  });

  it('GLB só do inteiro: no corte não há 3D nem legenda de WebGL fora do lugar', async () => {
    vi.mocked(temModelo).mockImplementation((_s, v) => v === 'inteiro');
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await esperarUmPouco();
    expect(modelo(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});

describe('CheeseViewer com GLB: variante, zoom e giro', () => {
  it('Ver por dentro troca o src, volta a "Preparando" e o novo load restaura o modelo', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load');
    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));

    await waitFor(() => expect(el).toHaveAttribute('src', '/models/canastra-curado-inteiro.glb'));
    expect(el).toHaveAttribute('alt', ROTULO_INTEIRO);
    expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO);
    expect(screen.getByRole('img', { name: ROTULO_INTEIRO })).toBeVisible();

    // O load da variante antiga, que chega atrasado, não vale.
    disparar(el, 'load', { url: '/models/canastra-curado-cortado.glb' });
    expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO);
    disparar(el, 'load', { url: '/models/canastra-curado-inteiro.glb' });
    expect(screen.getByRole('status')).toHaveTextContent(PRONTO);
    expect(camadaDoModelo(el)).toHaveAttribute('data-pronto', 'true');
  });

  it('Aproximar muda só o raio da órbita (105% ↔ 89%) e mantém o ângulo', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    expect(el).toHaveAttribute('camera-orbit', '0deg 75deg 105%');
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    await waitFor(() => expect(el.cameraOrbit).toBe('0.5rad 1.3rad 89%'));
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    await waitFor(() => expect(el.cameraOrbit).toBe('0.5rad 1.3rad 105%'));
  });

  it('camera-change do usuário para o giro e some com a dica; os outros não', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    const girar = screen.getByRole('button', { name: 'Girar' });
    expect(girar).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Arraste para girar/)).toBeInTheDocument();

    disparar(el, 'camera-change', { source: 'none' });
    disparar(el, 'camera-change', { source: 'automatic' });
    expect(girar).toHaveAttribute('aria-pressed', 'true');

    disparar(el, 'camera-change', { source: 'user-interaction' });
    expect(girar).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/Arraste para girar/)).toBeNull();
    expect(el).not.toHaveAttribute('auto-rotate');

    fireEvent.click(girar);
    expect(el).toHaveAttribute('auto-rotate');
  });

  it('movimento reduzido: o modelo nasce sem auto-rotate', async () => {
    simularMovimentoReduzido(true);
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    expect(el).not.toHaveAttribute('auto-rotate');
    fireEvent.click(screen.getByRole('button', { name: 'Girar' }));
    expect(el).toHaveAttribute('auto-rotate');
  });

  it('Girar aparece também no celular com GLB (sem a classe que o esconde) e some sem GLB', () => {
    const { unmount } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('button', { name: 'Girar' }).className).not.toMatch(/soDesktop/);
    unmount();
    vi.mocked(temModelo).mockImplementation(() => false);
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('button', { name: 'Girar' }).className).toMatch(/soDesktop/);
  });
});

describe('CheeseViewer com GLB: girar sem arrastar (WCAG 2.5.7)', () => {
  it('os botões existem, mas ficam aria-disabled até o modelo estar pronto', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const esquerda = screen.getByRole('button', { name: 'Girar à esquerda' });
    const direita = screen.getByRole('button', { name: 'Girar à direita' });
    expect(esquerda).toHaveAttribute('aria-disabled', 'true');
    expect(direita).toHaveAttribute('aria-disabled', 'true');
    expect(esquerda).toHaveAccessibleDescription('Disponível quando a peça estiver pronta');
    expect(direita).toHaveAccessibleDescription('Disponível quando a peça estiver pronta');
    const el = await carregarModelo(container);
    fireEvent.click(direita);
    expect(el.cameraOrbit).toBe('');
    disparar(el, 'load');
    expect(esquerda).not.toHaveAttribute('aria-disabled');
    expect(direita).not.toHaveAttribute('aria-disabled');
    expect(esquerda).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('Disponível quando a peça estiver pronta')).toBeNull();
  });

  it('cada clique gira 30° e encerra o giro automático', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load');
    fireEvent.click(screen.getByRole('button', { name: 'Girar à direita' }));
    const [theta, phi, raio] = el.cameraOrbit.split(' ');
    expect(parseFloat(theta as string)).toBeCloseTo(0.5 - Math.PI / 6, 6);
    expect(phi).toBe('1.3rad');
    expect(raio).toBe('2m');
    expect(screen.getByRole('button', { name: 'Girar' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Girar à esquerda' }));
    expect(parseFloat(el.cameraOrbit)).toBeCloseTo(0.5 + Math.PI / 6, 6);
  });

  it('entram na ordem da barra (setas, Home e End) como os demais botões', async () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const botoes = Array.from(
      screen.getByRole('toolbar', { name: 'Controles do 3D' }).querySelectorAll('button'),
    );
    expect(botoes.map((b) => b.textContent)).toEqual([
      'Girar',
      'Girar à esquerda',
      'Girar à direita',
      'Ver por dentro',
      'Aproximar',
      '',
    ]);
    expect(botoes.filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });
});

describe('CheeseViewer com GLB: tempo-limite por variante, foco e anúncio', () => {
  it('trocar a variante durante o preparo reinicia os 20 s', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    mostrarPalco();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000); // 25 s desde o início, 10 s desde a troca
    });
    expect(screen.getByRole('status')).toHaveTextContent(PREPARANDO);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_500);
    });
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('o anúncio "Peça pronta" é só texto de leitor de tela', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load');
    const anuncio = screen.getByText(PRONTO);
    expect(anuncio).toHaveClass('sr-only');
    expect(anuncio.closest('[role="status"]')).not.toBeNull();
  });

  it('se o 3D falha com o foco em "Girar à direita", o foco vai para "Aproximar"', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    disparar(el, 'load');
    const direita = screen.getByRole('button', { name: 'Girar à direita' });
    act(() => direita.focus());
    expect(direita).toHaveFocus();
    disparar(el, 'error', { type: 'webglcontextlost' });
    expect(screen.queryByRole('button', { name: 'Girar à direita' })).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole('button', { name: 'Aproximar' })).toHaveFocus();
  });

  it('o anel de foco dourado é do contêiner (data-foco) e some ao perder o foco', async () => {
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    const camada = camadaDoModelo(el);
    vi.spyOn(el, 'matches').mockReturnValue(true); // o jsdom não calcula :focus-visible
    fireEvent.focusIn(el);
    expect(camada).toHaveAttribute('data-foco', 'true');
    fireEvent.focusOut(el);
    expect(camada).not.toHaveAttribute('data-foco');
  });

  it('movimento reduzido: Aproximar salta a câmera, sem interpolar; sem a preferência, interpola', async () => {
    simularMovimentoReduzido(true);
    const { container } = render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const el = await carregarModelo(container);
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    await waitFor(() => expect(el.saltos).toBe(1));
  });
});
