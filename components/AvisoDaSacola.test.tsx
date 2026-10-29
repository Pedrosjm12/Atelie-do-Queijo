import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { BotaoAdicionar } from './BotaoAdicionar';
import { LinkDaSacola } from './LinkDaSacola';
import { SacolaProvider } from './SacolaProvider';

const TEXTO = 'Adicionado à sacola. Boa escolha.';

function montar() {
  return render(
    <SacolaProvider>
      <LinkDaSacola />
      <BotaoAdicionar slug="brie-frances" formatoId="500g">
        Adicionar
      </BotaoAdicionar>
      <BotaoAdicionar slug="manchego" formatoId="250g" quantidade={2}>
        Adicionar dois
      </BotaoAdicionar>
    </SacolaProvider>,
  );
}

/** Avança relógio e quadros simulados dentro de act. */
const avancar = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const clicar = (nome: string) =>
  act(async () => {
    screen.getByRole('button', { name: nome }).click();
  });

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('LinkDaSacola', () => {
  it('antes de adicionar mostra 0 itens e aponta para /sacola', () => {
    montar();
    const link = screen.getByRole('link', { name: 'Sacola, 0 itens' });
    expect(link).toHaveAttribute('href', '/sacola');
  });

  it('o rótulo acompanha a soma: 1 item, depois 3 itens', async () => {
    montar();
    await clicar('Adicionar');
    expect(screen.getByRole('link', { name: 'Sacola, 1 item' })).toHaveTextContent('Sacola1');
    await clicar('Adicionar dois');
    expect(screen.getByRole('link', { name: 'Sacola, 3 itens' })).toHaveTextContent('Sacola3');
  });
});

describe('AvisoDaSacola', () => {
  it('a região role="status" existe vazia antes da primeira adição', () => {
    montar();
    const regiao = screen.getByRole('status');
    expect(regiao).toBeEmptyDOMElement();
    expect(regiao).toHaveAttribute('aria-live', 'polite');
    expect(regiao).toHaveAttribute('aria-atomic', 'true');
  });

  it('mostra o texto exato, sem botão nem link, e some em 4 s', async () => {
    montar();
    await clicar('Adicionar');
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO);
    expect(screen.getByRole('status').querySelector('a, button')).toBeNull();

    await avancar(3900);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO);
    await avancar(200);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('duas adições seguidas reiniciam o tempo e reinserem o texto', async () => {
    montar();
    await clicar('Adicionar');
    await avancar(3000);
    await clicar('Adicionar');
    // O texto é limpo e volta no quadro seguinte.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO);
    // 3 s depois da 2ª adição ainda aparece (sem reiniciar, já teria sumido).
    await avancar(3000);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO);
    await avancar(1100);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('no limite de 10 mostra a mensagem do P25 e não muda a quantidade', async () => {
    montar();
    for (let i = 0; i < 5; i++) await clicar('Adicionar dois'); // 2 × 5 = 10
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO);
    expect(screen.getByRole('link', { name: 'Sacola, 10 itens' })).toBeInTheDocument();
    await clicar('Adicionar dois');
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Você já tem 10 unidades deste queijo na sacola.',
    );
    expect(screen.getByRole('link', { name: 'Sacola, 10 itens' })).toBeInTheDocument();
  });

  it('formato inexistente não anuncia nada', async () => {
    render(
      <SacolaProvider>
        <BotaoAdicionar slug="brie-frances" formatoId="inexistente">
          Adicionar
        </BotaoAdicionar>
      </SacolaProvider>,
    );
    await clicar('Adicionar');
    await avancar(20);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  const LIMITE = 'Você já tem 10 unidades deste queijo na sacola.';
  const salva = () =>
    JSON.parse(window.localStorage.getItem('atelie:sacola:v1') ?? '{}') as {
      itens: { quantidade: number }[];
      presente: boolean;
    };
  const semear = (quantidade: number) =>
    window.localStorage.setItem(
      'atelie:sacola:v1',
      JSON.stringify({
        v: 1,
        itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade }],
        presente: false,
      }),
    );
  const montarComDez = () =>
    render(
      <SacolaProvider>
        <BotaoAdicionar slug="brie-frances" formatoId="500g" quantidade={10}>
          Adicionar dez
        </BotaoAdicionar>
        <BotaoAdicionar slug="brie-frances" formatoId="500g" presente>
          Embalar
        </BotaoAdicionar>
      </SacolaProvider>,
    );

  it('quantidade cortada pelo limite mostra o aviso do limite, não o de sucesso', async () => {
    semear(3);
    montarComDez();
    await avancar(0);
    await clicar('Adicionar dez');
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(LIMITE);
    expect(salva().itens[0]?.quantidade).toBe(10);
  });

  it('linha em 10 + presente marca o pedido e mostra o aviso do limite', async () => {
    semear(10);
    montarComDez();
    await avancar(0);
    await clicar('Embalar');
    await avancar(20);
    expect(screen.getByRole('status')).toHaveTextContent(LIMITE);
    expect(salva().presente).toBe(true);
    expect(salva().itens[0]?.quantidade).toBe(10);
  });
});
