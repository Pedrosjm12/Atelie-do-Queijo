import { describe, expect, it } from 'vitest';
import { render as renderizar, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { destaquesDaSemana, listarQueijos, obterQueijo } from '@/lib/catalogo';
import { formatarPreco } from '@/lib/format';
import { LinkDaSacola } from './LinkDaSacola';
import { ProductCard } from './ProductCard';
import { SacolaProvider } from './SacolaProvider';

const render = (ui: ReactElement) => renderizar(<SacolaProvider>{ui}</SacolaProvider>);

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q;
}

/** O getByText normaliza o U+00A0 do preço para espaço comum. */
const textoDoPreco = (centavos: number) => formatarPreco(centavos).replace(/ /g, ' ');

describe('ProductCard', () => {
  it('liga o nome à página do produto nos dois contextos', () => {
    for (const contexto of ['home', 'catalogo'] as const) {
      const { unmount } = render(<ProductCard queijo={queijo('manchego')} contexto={contexto} />);
      expect(screen.getByRole('link', { name: 'Manchego DOP' })).toHaveAttribute(
        'href',
        '/queijos/manchego',
      );
      unmount();
    }
  });

  it('mostra "a partir de" e o menor preço com vários formatos', () => {
    render(<ProductCard queijo={queijo('canastra-curado')} contexto="catalogo" />);
    expect(screen.getByText('a partir de')).toBeInTheDocument();
    expect(screen.getByText(textoDoPreco(4900))).toBeInTheDocument();
  });

  it('mostra o peso com um só formato', () => {
    render(<ProductCard queijo={queijo('creme-do-marajo')} contexto="catalogo" />);
    expect(screen.getByText('200 g')).toBeInTheDocument();
    expect(screen.getByText(textoDoPreco(6490))).toBeInTheDocument();
  });

  it('usa os textos da vitrine na Home e a §9 no catálogo', () => {
    const cabra = queijo('cabra-com-cinzas');
    const { unmount } = render(<ProductCard queijo={cabra} contexto="home" />);
    expect(screen.getByText('BRASIL · LEITE DE CABRA')).toBeInTheDocument();
    expect(screen.getByText('a partir de')).toBeInTheDocument();
    unmount();
    render(<ProductCard queijo={cabra} contexto="catalogo" />);
    expect(screen.getByText('BRASIL · SERRA DA MANTIQUEIRA, SP')).toBeInTheDocument();
    expect(screen.getByText('~160 g')).toBeInTheDocument();
  });

  it('tem um único botão Adicionar com nome acessível do queijo', () => {
    render(<ProductCard queijo={queijo('brie-frances')} contexto="home" />);
    const botoes = screen.getAllByRole('button');
    expect(botoes).toHaveLength(1);
    expect(botoes[0]).toHaveAccessibleName('Adicionar Brie francês à sacola');
    expect(botoes[0]).toHaveTextContent('Adicionar');
    expect(botoes[0]).toHaveAttribute('type', 'button');
  });

  it('Adicionar põe 1 unidade do formato do menor preço (P24) na sacola, sem aria-disabled', async () => {
    const usuario = userEvent.setup();
    window.localStorage.clear();
    render(
      <>
        <LinkDaSacola />
        <ProductCard queijo={queijo('canastra-curado')} contexto="catalogo" />
      </>,
    );
    const botao = screen.getByRole('button', { name: 'Adicionar Canastra curado à sacola' });
    expect(botao).not.toHaveAttribute('aria-disabled');
    await usuario.click(botao);
    expect(screen.getByRole('link', { name: 'Sacola 1 item' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('atelie:sacola:v1') ?? '{}').itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 1 },
    ]);
    expect(botao).toHaveFocus();
  });

  it('expõe a ilustração como imagem com rótulo descritivo (§13)', () => {
    render(<ProductCard queijo={queijo('manchego')} contexto="catalogo" />);
    expect(
      screen.getByRole('img', { name: 'Manchego DOP, ilustração do queijo' }),
    ).toBeInTheDocument();
  });

  it('escolhe a ilustração pelo contexto: A.4 na Home quando existe, A.6 nos demais', () => {
    const brie = queijo('brie-frances');
    const home = render(<ProductCard queijo={brie} contexto="home" />);
    expect(home.container.querySelector('linearGradient, lineargradient')).not.toBeNull();
    home.unmount();
    const catalogo = render(<ProductCard queijo={brie} contexto="catalogo" />);
    expect(catalogo.container.querySelector('linearGradient, lineargradient')).toBeNull();
    catalogo.unmount();
    const manchego = render(<ProductCard queijo={queijo('manchego')} contexto="home" />);
    expect(manchego.container.querySelector('linearGradient, lineargradient')).toBeNull();
    expect(
      screen.getByRole('img', { name: 'Manchego DOP, ilustração do queijo' }),
    ).toBeInTheDocument();
  });

  it('renderiza todos os queijos nos dois contextos sem erro', () => {
    for (const q of listarQueijos()) {
      const { unmount } = render(<ProductCard queijo={q} contexto="catalogo" />);
      expect(screen.getByRole('article')).toBeInTheDocument();
      unmount();
    }
    for (const q of destaquesDaSemana()) {
      const { unmount } = render(<ProductCard queijo={q} contexto="home" />);
      expect(
        within(screen.getByRole('article')).getByRole('heading', { level: 3 }),
      ).toHaveTextContent(q.nome);
      unmount();
    }
  });
});
