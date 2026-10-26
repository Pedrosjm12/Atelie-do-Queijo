import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { CheeseIllustration } from '../CheeseIllustration';
import { CanastraCortado, CanastraCortadoCelular, CanastraInteiro } from './CanastraProduto';
import { HeroCanastra } from './HeroCanastra';
import { MiniaturaDoChat } from './MiniaturaDoChat';
import {
  MINIATURAS_DA_CAVE,
  MiniaturaBrie,
  MiniaturaCabra,
  MiniaturaCanastra,
  MiniaturaGorgonzola,
} from './MiniaturasDaCave';

const COM_GRADIENTES: ReadonlyArray<[string, () => ReactElement]> = [
  ['A.3 hero', () => <HeroCanastra />],
  ['A.4.1 Canastra', () => <MiniaturaCanastra />],
  ['A.4.2 Brie', () => <MiniaturaBrie />],
  ['A.4.3 Gorgonzola', () => <MiniaturaGorgonzola />],
  ['A.4.4 Cabra', () => <MiniaturaCabra />],
  ['A.5.1 cortado', () => <CanastraCortado />],
  ['A.5.2 inteiro', () => <CanastraInteiro />],
  ['A.5.3 celular', () => <CanastraCortadoCelular />],
  ['A.7 chat', () => <MiniaturaDoChat />],
];

function idsDe(raiz: Element): string[] {
  return Array.from(raiz.querySelectorAll('[id]')).map((e) => e.id);
}

function urlsDe(html: string): string[] {
  return Array.from(html.matchAll(/url\(#([^)]+)\)/g), (m) => m[1] as string);
}

describe.each(COM_GRADIENTES)('ids de SVG: %s', (_nome, criar) => {
  it('duas instâncias na mesma página não repetem nenhum id', () => {
    const { container } = render(
      <>
        {criar()}
        {criar()}
      </>,
    );
    const ids = idsDe(container);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo url(#…) aponta para um id existente e o id é seguro para url()', () => {
    const { container } = render(
      <>
        {criar()}
        {criar()}
      </>,
    );
    const ids = new Set(idsDe(container));
    const urls = urlsDe(container.innerHTML);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(ids.has(u)).toBe(true);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
  });

  it('funciona na renderização síncrona do servidor, sem repetir ids', () => {
    const html = renderToStaticMarkup(
      <>
        {criar()}
        {criar()}
      </>,
    );
    const ids = Array.from(html.matchAll(/ id="([^"]+)"/g), (m) => m[1] as string);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const u of urlsDe(html)) expect(ids).toContain(u);
  });
});

describe('acessibilidade das ilustrações', () => {
  it('mantém role="img" e o rótulo do Apêndice A', () => {
    const { getByRole } = render(<MiniaturaBrie />);
    expect(getByRole('img', { name: 'Miniatura 3D do brie francês' })).toBeInTheDocument();
  });

  it('decorativa troca role e rótulo por aria-hidden', () => {
    const { container } = render(<MiniaturaCanastra decorativa />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
  });

  it('rótulos das ilustrações de produto e do hero batem com a spec', () => {
    const { getByRole } = render(
      <>
        <CanastraCortado />
        <CanastraInteiro />
        <CanastraCortadoCelular />
        <HeroCanastra />
      </>,
    );
    expect(
      getByRole('img', {
        name: 'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras',
      }),
    ).toBeInTheDocument();
    expect(getByRole('img', { name: 'Canastra curado, peça inteira' })).toBeInTheDocument();
    expect(
      getByRole('img', { name: 'Canastra curado em 3D, com fatia cortada' }),
    ).toBeInTheDocument();
    expect(
      getByRole('img', {
        name: 'Queijo curado em 3D, com uma fatia cortada à frente, sobre ardósia',
      }),
    ).toBeInTheDocument();
  });

  it('mapa de miniaturas cobre os 4 destaques da Home', () => {
    expect(Object.keys(MINIATURAS_DA_CAVE).sort()).toEqual([
      'brie-frances',
      'cabra-com-cinzas',
      'canastra-curado',
      'gorgonzola-dolce',
    ]);
  });
});

describe('CheeseIllustration (A.6)', () => {
  function desenhar(shape: 'wide' | 'tall' | 'flat' | 'small') {
    const { container } = render(
      <CheeseIllustration shape={shape} side="#111111" top="#EEEEEE" label="Queijo X" />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    return {
      svg,
      path: svg.querySelector('path') as SVGPathElement,
      elipses: Array.from(svg.querySelectorAll('ellipse')),
    };
  }

  it('wide: lateral, topo, sombra e anel conforme a fórmula da spec', () => {
    const { svg, path, elipses } = desenhar('wide');
    expect(svg).toHaveAttribute('viewBox', '0 0 300 190');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'Queijo X, ilustração do queijo');
    expect(path).toHaveAttribute('d', 'M40 76V120A110 34 0 0 0 260 120V76Z');
    expect(path).toHaveAttribute('fill', '#111111');
    const [halo, sombra, topo, anel] = elipses;
    expect(halo).toHaveAttribute('fill-opacity', '0.07');
    expect(sombra).toHaveAttribute('cy', '130');
    expect(sombra).toHaveAttribute('rx', '116');
    expect(topo).toHaveAttribute('cy', '76');
    expect(topo).toHaveAttribute('fill', '#EEEEEE');
    expect(anel).toHaveAttribute('rx', '81');
    expect(anel).toHaveAttribute('ry', '25');
  });

  it.each([
    ['tall', 'M66 62V128A84 26 0 0 0 234 128V62Z', '138', '88', '62', '19'],
    ['flat', 'M32 86V116A118 34 0 0 0 268 116V86Z', '126', '124', '87', '25'],
    ['small', 'M76 72V122A74 24 0 0 0 224 122V72Z', '132', '78', '55', '18'],
  ] as const)('%s', (shape, d, sombraCy, sombraRx, anelRx, anelRy) => {
    const { path, elipses } = desenhar(shape);
    expect(path).toHaveAttribute('d', d);
    expect(elipses[1]).toHaveAttribute('cy', sombraCy);
    expect(elipses[1]).toHaveAttribute('rx', sombraRx);
    expect(elipses[3]).toHaveAttribute('rx', anelRx);
    expect(elipses[3]).toHaveAttribute('ry', anelRy);
  });

  it('não tem ids nem url(#…), então repetir não colide', () => {
    const { container } = render(
      <>
        <CheeseIllustration shape="wide" side="#000" top="#fff" label="A" />
        <CheeseIllustration shape="wide" side="#000" top="#fff" label="A" />
      </>,
    );
    expect(container.querySelectorAll('[id]')).toHaveLength(0);
    expect(container.innerHTML).not.toContain('url(#');
  });

  it('decorativa usa aria-hidden', () => {
    const { container } = render(
      <CheeseIllustration shape="flat" side="#000" top="#fff" label="A" decorativa />,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[role="img"]')).toBeNull();
  });
});
