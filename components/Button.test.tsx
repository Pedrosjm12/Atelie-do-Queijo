import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza um link quando recebe href', () => {
    render(<Button href="/queijos">Explorar a cave</Button>);
    const link = screen.getByRole('link', { name: 'Explorar a cave' });
    expect(link).toHaveAttribute('href', '/queijos');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renderiza um button type="button" quando não recebe href', () => {
    render(<Button variante="secundario">Ver mais</Button>);
    const botao = screen.getByRole('button', { name: 'Ver mais' });
    expect(botao).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('permite type="submit"', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('a variante opcao expõe aria-pressed conforme a seleção', () => {
    const { rerender } = render(
      <Button variante="opcao" selecionado={false}>
        Cremoso
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Cremoso' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(
      <Button variante="opcao" selecionado>
        Cremoso
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Cremoso' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('as outras variantes não têm aria-pressed', () => {
    render(<Button>Adicionar</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });

  it('mostra a seta decorativa quando pedida', () => {
    const { container } = render(<Button seta>Continuar</Button>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Button tamanho', () => {
  it('não vaza a prop tamanho para o DOM', () => {
    render(
      <Button variante="opcao" selecionado={false} tamanho="compacto">
        Brasil (7)
      </Button>,
    );
    const botao = screen.getByRole('button', { name: 'Brasil (7)' });
    expect(botao).not.toHaveAttribute('tamanho');
    expect(botao.className).toMatch(/compacto/);
  });
});
