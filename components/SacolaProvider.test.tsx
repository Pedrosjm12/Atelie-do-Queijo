import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { CHAVE_DA_SACOLA } from '@/lib/sacola';
import { SacolaProvider, useSacola } from './SacolaProvider';

const SALVA = JSON.stringify({
  v: 1,
  itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade: 2 }],
  presente: false,
});

function Painel() {
  const s = useSacola();
  return (
    <div>
      <p data-testid="estado">{`pronta:${s.pronta} total:${s.totalDeItens} linhas:${s.sacola.itens.length}`}</p>
      <button onClick={() => s.adicionar({ slug: 'manchego', formatoId: '250g' })}>
        adicionar
      </button>
      <button onClick={() => s.alterarQuantidade('brie-frances', '500g', 5)}>alterar</button>
      <button onClick={() => s.remover('brie-frances', '500g')}>remover</button>
      <button onClick={() => s.limpar()}>limpar</button>
    </div>
  );
}

const estado = () => screen.getByTestId('estado').textContent;
const montar = () =>
  render(
    <SacolaProvider>
      <Painel />
    </SacolaProvider>,
  );

let setItem: ReturnType<typeof vi.spyOn>;
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.localStorage.clear();
  setItem = vi.spyOn(Storage.prototype, 'setItem');
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function semLogs() {
  expect(consoleError).not.toHaveBeenCalled();
  expect(consoleWarn).not.toHaveBeenCalled();
}

function dispararStorage(newValue: string | null, key: string | null = CHAVE_DA_SACOLA) {
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', { key, newValue, storageArea: window.localStorage }),
    );
  });
}

describe('SacolaProvider', () => {
  it('lê a sacola salva depois do mount, sem erro de hidratação', async () => {
    window.localStorage.setItem(CHAVE_DA_SACOLA, SALVA);
    setItem.mockClear();
    const html = renderToString(
      <SacolaProvider>
        <Painel />
      </SacolaProvider>,
    );
    expect(html).toContain('pronta:false');
    expect(html).toContain('total:0');

    const raiz = document.createElement('div');
    raiz.innerHTML = html;
    document.body.append(raiz);
    await act(async () => {
      hydrateRoot(
        raiz,
        <SacolaProvider>
          <Painel />
        </SacolaProvider>,
      );
    });
    expect(raiz.textContent).toContain('pronta:true total:2 linhas:1');
    semLogs();
    raiz.remove();
  });

  it('não grava ao abrir a página nem apaga a sacola salva (mesmo corrompida)', () => {
    window.localStorage.setItem(CHAVE_DA_SACOLA, '{lixo');
    setItem.mockClear();
    montar();
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(CHAVE_DA_SACOLA)).toBe('{lixo');
  });

  it('adicionar, alterar, remover e limpar gravam', async () => {
    window.localStorage.setItem(CHAVE_DA_SACOLA, SALVA);
    setItem.mockClear();
    const u = userEvent.setup();
    montar();
    const salvo = () => JSON.parse(window.localStorage.getItem(CHAVE_DA_SACOLA) ?? 'null');

    await u.click(screen.getByText('adicionar'));
    expect(estado()).toBe('pronta:true total:3 linhas:2');
    expect(salvo().itens).toHaveLength(2);

    await u.click(screen.getByText('alterar'));
    expect(estado()).toBe('pronta:true total:6 linhas:2');
    expect(salvo().itens[0].quantidade).toBe(5);

    await u.click(screen.getByText('remover'));
    expect(salvo().itens).toEqual([{ slug: 'manchego', formatoId: '250g', quantidade: 1 }]);

    await u.click(screen.getByText('limpar'));
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    expect(salvo().itens).toEqual([]);
    expect(setItem).toHaveBeenCalledTimes(4);
    semLogs();
  });

  it('getItem que lança: sacola vazia, sem quebrar e sem log', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('negado', 'SecurityError');
    });
    const u = userEvent.setup();
    montar();
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    await u.click(screen.getByText('adicionar'));
    expect(estado()).toBe('pronta:true total:1 linhas:1');
    semLogs();
  });

  it('setItem que lança (cota): segue em memória, sem log', async () => {
    setItem.mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError');
    });
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByText('adicionar'));
    expect(estado()).toBe('pronta:true total:1 linhas:1');
    await u.click(screen.getByText('limpar'));
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    semLogs();
  });

  it('evento storage válido substitui em memória, sem regravar', () => {
    montar();
    setItem.mockClear();
    dispararStorage(SALVA);
    expect(estado()).toBe('pronta:true total:2 linhas:1');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('evento storage inválido não chama setItem e esvazia em memória', () => {
    window.localStorage.setItem(CHAVE_DA_SACOLA, SALVA);
    montar();
    setItem.mockClear();
    dispararStorage('{"v":2,"itens":[]}');
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    dispararStorage(SALVA);
    dispararStorage(null);
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    dispararStorage(SALVA);
    dispararStorage(null, null); // localStorage.clear() em outra aba
    expect(estado()).toBe('pronta:true total:0 linhas:0');
    expect(setItem).not.toHaveBeenCalled();
    semLogs();
  });

  it('evento storage de outra chave é ignorado', () => {
    window.localStorage.setItem(CHAVE_DA_SACOLA, SALVA);
    montar();
    dispararStorage(null, 'outra-chave');
    expect(estado()).toBe('pronta:true total:2 linhas:1');
  });

  it.each(['constructor', '__proto__', 'toString'])(
    '%s como slug salvo ou em evento: sacola vazia, sem erro',
    (slug) => {
      const ruim = `{"v":1,"itens":[{"slug":"${slug}","formatoId":"x","quantidade":1}]}`;
      window.localStorage.setItem(CHAVE_DA_SACOLA, ruim);
      setItem.mockClear();
      montar();
      expect(estado()).toBe('pronta:true total:0 linhas:0');
      dispararStorage(ruim);
      expect(estado()).toBe('pronta:true total:0 linhas:0');
      expect(setItem).not.toHaveBeenCalled();
      semLogs();
    },
  );

  it('useSacola fora do provider lança erro claro', () => {
    expect(() => render(<Painel />)).toThrow(/SacolaProvider/);
  });
});
