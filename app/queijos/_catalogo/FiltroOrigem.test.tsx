import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltroOrigem } from './FiltroOrigem';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const CONTAGENS = { todos: 10, brasil: 7, mundo: 3 };

function chip(nome: string) {
  return screen.getByRole('button', { name: nome });
}

describe('FiltroOrigem', () => {
  beforeEach(() => replace.mockClear());

  it('mostra o grupo e os três chips com contagens, com Todos marcado por padrão', () => {
    render(<FiltroOrigem origem={null} contagens={CONTAGENS} />);
    expect(screen.getByRole('group', { name: 'Filtrar por origem' })).toBeInTheDocument();
    expect(chip('Todos (10)')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Brasil (7)')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('Mundo (3)')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Frete grátis acima de R$ 180 · 5% off no Pix')).toBeInTheDocument();
  });

  it('marca o chip da origem recebida do servidor', () => {
    render(<FiltroOrigem origem="mundo" contagens={CONTAGENS} />);
    expect(chip('Mundo (3)')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Todos (10)')).toHaveAttribute('aria-pressed', 'false');
  });

  it.each([
    ['Brasil (7)', '/queijos?origem=brasil'],
    ['Mundo (3)', '/queijos?origem=mundo'],
  ])('clicar em %s chama router.replace(%s) sem rolar a página', async (nome, url) => {
    const usuario = userEvent.setup();
    render(<FiltroOrigem origem={null} contagens={CONTAGENS} />);
    await usuario.click(chip(nome));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(url, { scroll: false });
  });

  it('clicar em Todos volta para /queijos sem parâmetro', async () => {
    const usuario = userEvent.setup();
    render(<FiltroOrigem origem="brasil" contagens={CONTAGENS} />);
    await usuario.click(chip('Todos (10)'));
    expect(replace).toHaveBeenCalledWith('/queijos', { scroll: false });
  });
});

describe('FiltroOrigem: região viva e chip já marcado', () => {
  it.each([
    [null, '10 queijos'],
    ['brasil' as const, 'Brasil: 7 queijos'],
    ['mundo' as const, 'Mundo: 3 queijos'],
  ])('com origem %s o status diz "%s"', (origem, texto) => {
    render(<FiltroOrigem origem={origem} contagens={CONTAGENS} />);
    expect(screen.getByRole('status')).toHaveTextContent(texto);
  });

  it('o status acompanha a prop do servidor, não o clique', async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(<FiltroOrigem origem={null} contagens={CONTAGENS} />);
    await usuario.click(screen.getByRole('button', { name: 'Brasil (7)' }));
    expect(screen.getByRole('status')).toHaveTextContent('10 queijos');
    rerender(<FiltroOrigem origem="brasil" contagens={CONTAGENS} />);
    expect(screen.getByRole('status')).toHaveTextContent('Brasil: 7 queijos');
  });

  it('clicar no chip já marcado não navega', async () => {
    const usuario = userEvent.setup();
    replace.mockClear();
    render(<FiltroOrigem origem="mundo" contagens={CONTAGENS} />);
    await usuario.click(screen.getByRole('button', { name: 'Mundo (3)' }));
    expect(replace).not.toHaveBeenCalled();
  });
});
