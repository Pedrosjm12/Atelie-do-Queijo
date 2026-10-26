import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icone } from './icons';

describe('Icone', () => {
  it('é decorativo por padrão', () => {
    const { container } = render(<Icone nome="menu" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('com rótulo vira role="img" e deixa de ser aria-hidden', () => {
    render(<Icone nome="presente" rotulo="Presente" />);
    const svg = screen.getByRole('img', { name: 'Presente' });
    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it('usa os atributos da spec e aceita tamanho e espessura', () => {
    const { container } = render(<Icone nome="conversa" tamanho={26} espessura={1.75} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '1.75');
    expect(svg).toHaveAttribute('width', '26');
    expect(svg?.querySelector('path')).toHaveAttribute(
      'd',
      'M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z',
    );
  });

  it('a versão curta de "girar" tem só dois caminhos', () => {
    const { container } = render(<Icone nome="girar-curto" />);
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
});
