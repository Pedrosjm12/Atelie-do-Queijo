import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { CheeseViewer } from './CheeseViewer';

function queijo(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q;
}

const ROTULO_CORTADO = 'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras';
const ROTULO_INTEIRO = 'Canastra curado, peça inteira';

describe('CheeseViewer', () => {
  it('começa cortado: ilustração A.5.1, indicador POR DENTRO e alternador "Ver peça inteira"', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeInTheDocument();
    expect(screen.getByText('POR DENTRO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver por dentro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('o alternador troca o SVG, o indicador e o aria-pressed, com rótulo fixo', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));

    expect(screen.getByRole('img', { name: ROTULO_INTEIRO })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: ROTULO_CORTADO })).not.toBeInTheDocument();
    expect(screen.getByText('PEÇA INTEIRA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver por dentro' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver por dentro' }));
    expect(screen.getByText('POR DENTRO')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: ROTULO_CORTADO })).toBeInTheDocument();
  });

  it('a dica some após a primeira interação', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByText(/Arraste para girar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    expect(screen.queryByText(/Arraste para girar/)).not.toBeInTheDocument();
  });

  it('a dica também some ao tocar na ilustração', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    fireEvent.pointerDown(screen.getByRole('img', { name: ROTULO_CORTADO }));
    expect(screen.queryByText(/Arraste para girar/)).not.toBeInTheDocument();
  });

  it('Girar começa ligado e Aproximar desligado; ambos alternam aria-pressed', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const girar = screen.getByRole('button', { name: 'Girar' });
    const aproximar = screen.getByRole('button', { name: 'Aproximar' });
    expect(girar).toHaveAttribute('aria-pressed', 'true');
    expect(aproximar).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(girar);
    fireEvent.click(aproximar);
    expect(girar).toHaveAttribute('aria-pressed', 'false');
    expect(aproximar).toHaveAttribute('aria-pressed', 'true');
  });

  it('expõe a barra de controles, Tela cheia e as miniaturas', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    expect(screen.getByRole('toolbar', { name: 'Controles do 3D' })).toBeInTheDocument();
    const telaCheia = screen.getByRole('button', { name: 'Tela cheia' });
    expect(telaCheia).toHaveAttribute('aria-disabled', 'true');
    expect(telaCheia).toHaveAccessibleDescription('Tela cheia disponível em breve');
    expect(screen.getByText('Visualização 3D (atual)')).toBeInTheDocument();
    for (const d of ['na tábua', 'produtor', 'fazenda']) {
      expect(screen.getByText(`[FOTO: ${d}]`)).toBeInTheDocument();
    }
  });

  it('barra de ferramentas: um só botão na ordem de Tab e setas, Home e End movem o foco', () => {
    render(<CheeseViewer queijo={queijo('canastra-curado')} />);
    const barra = screen.getByRole('toolbar', { name: 'Controles do 3D' });
    const botoes = within(barra).getAllByRole('button');
    expect(botoes.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);

    botoes[0]?.focus();
    fireEvent.keyDown(botoes[0] as HTMLElement, { key: 'ArrowRight' });
    expect(botoes[1]).toHaveFocus();
    expect(botoes.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);

    fireEvent.keyDown(botoes[1] as HTMLElement, { key: 'End' });
    expect(botoes[3]).toHaveFocus();
    fireEvent.keyDown(botoes[3] as HTMLElement, { key: 'ArrowRight' });
    expect(botoes[0]).toHaveFocus();
    fireEvent.keyDown(botoes[0] as HTMLElement, { key: 'ArrowLeft' });
    expect(botoes[3]).toHaveFocus();
    fireEvent.keyDown(botoes[3] as HTMLElement, { key: 'Home' });
    expect(botoes[0]).toHaveFocus();
  });

  it('queijo sem arte A.5 usa a A.6, sem alternador de corte e com PEÇA INTEIRA', () => {
    render(<CheeseViewer queijo={queijo('manchego')} />);
    expect(screen.getByText('PEÇA INTEIRA')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Manchego DOP, ilustração do queijo/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Ver por dentro/ })).toBeNull();
    expect(screen.queryByText(/Ver na mesa/)).toBeNull();
  });
});
