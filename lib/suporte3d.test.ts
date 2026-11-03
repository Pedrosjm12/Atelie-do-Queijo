import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assinarMovimentoReduzido,
  limparCacheDoWebGL,
  prefereMovimentoReduzido,
  querEconomizarDados,
  temWebGL,
} from './suporte3d';

describe('temWebGL', () => {
  beforeEach(() => limparCacheDoWebGL());
  afterEach(() => vi.restoreAllMocks());

  it('devolve false quando nenhum contexto WebGL é criado (jsdom)', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null);
    expect(temWebGL()).toBe(false);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(getContext).toHaveBeenCalledWith('webgl');
  });

  it('devolve true, libera o contexto e guarda o resultado em cache', () => {
    const perderContexto = vi.fn();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          getExtension: (nome: string) =>
            nome === 'WEBGL_lose_context' ? { loseContext: perderContexto } : null,
        }) as unknown as RenderingContext,
    );
    expect(temWebGL()).toBe(true);
    expect(perderContexto).toHaveBeenCalledTimes(1);
    expect(temWebGL()).toBe(true);
    expect(getContext).toHaveBeenCalledTimes(1);
  });

  it('cai para webgl quando webgl2 não existe', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((tipo: string) =>
      tipo === 'webgl' ? { getExtension: () => null } : null) as never);
    expect(temWebGL()).toBe(true);
  });

  it('guarda em cache também o resultado false (não recria o canvas)', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null);
    expect(temWebGL()).toBe(false);
    const chamadas = getContext.mock.calls.length;
    expect(temWebGL()).toBe(false);
    expect(getContext).toHaveBeenCalledTimes(chamadas);
  });

  it('contexto sem a extensão WEBGL_lose_context continua contando como WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ({ getExtension: () => null }) as unknown as RenderingContext,
    );
    expect(temWebGL()).toBe(true);
  });

  it('trata exceção ao criar o contexto como sem WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(temWebGL()).toBe(false);
  });
});

describe('prefereMovimentoReduzido', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it('lê (prefers-reduced-motion: reduce)', () => {
    const consulta = vi.fn((q: string) => ({ matches: true, media: q }) as MediaQueryList);
    window.matchMedia = consulta;
    expect(prefereMovimentoReduzido()).toBe(true);
    expect(consulta).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('é false quando a preferência não está ativa', () => {
    expect(prefereMovimentoReduzido()).toBe(false);
  });

  it('sem matchMedia (navegador antigo): false e assinatura vazia que não quebra', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(prefereMovimentoReduzido()).toBe(false);
    expect(() => assinarMovimentoReduzido(() => {})()).not.toThrow();
  });

  it('assinarMovimentoReduzido registra e remove o ouvinte', () => {
    const add = vi.fn();
    const remove = vi.fn();
    window.matchMedia = (() => ({
      matches: false,
      addEventListener: add,
      removeEventListener: remove,
    })) as unknown as typeof window.matchMedia;
    const aoMudar = vi.fn();
    const cancelar = assinarMovimentoReduzido(aoMudar);
    expect(add).toHaveBeenCalledWith('change', aoMudar);
    cancelar();
    expect(remove).toHaveBeenCalledWith('change', aoMudar);
  });
});

describe('querEconomizarDados', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });
  });

  it('é false sem a Network Information API', () => {
    expect(querEconomizarDados()).toBe(false);
  });

  it('connection sem saveData (ou com valor não booleano) não economiza', () => {
    Object.defineProperty(navigator, 'connection', { value: {}, configurable: true });
    expect(querEconomizarDados()).toBe(false);
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: 'true' },
      configurable: true,
    });
    expect(querEconomizarDados()).toBe(false);
  });

  it('segue navigator.connection.saveData', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    });
    expect(querEconomizarDados()).toBe(true);
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: false },
      configurable: true,
    });
    expect(querEconomizarDados()).toBe(false);
  });
});
