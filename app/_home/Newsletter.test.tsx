import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Newsletter } from './Newsletter';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Newsletter', () => {
  it('mostra o título, o texto e o campo com rótulo associado', () => {
    render(<Newsletter />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Receba primeiro os lotes raros.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Algumas peças chegam em poucas unidades. Avisamos você antes de todo mundo.',
      ),
    ).toBeInTheDocument();
    const campo = screen.getByLabelText('Seu e-mail');
    expect(campo).toHaveAttribute('type', 'email');
    expect(campo).toHaveAttribute('placeholder', 'voce@email.com');
    expect(screen.getByRole('button', { name: 'Quero receber' })).toBeInTheDocument();
  });

  it.each(['', 'sem-arroba', 'a@b', 'a b@c.com'])('recusa o e-mail inválido %j', async (valor) => {
    const usuario = userEvent.setup();
    render(<Newsletter />);
    if (valor) await usuario.type(screen.getByLabelText('Seu e-mail'), valor);
    await usuario.click(screen.getByRole('button', { name: 'Quero receber' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido');
    expect(screen.getByLabelText('Seu e-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Seu e-mail')).toHaveFocus();
    expect(screen.queryByText(/Pronto!/)).not.toBeInTheDocument();
  });

  it('troca o formulário pela mensagem de sucesso, sem enviar nada para a rede (P9)', async () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);
    const usuario = userEvent.setup();
    render(<Newsletter />);

    await usuario.type(screen.getByLabelText('Seu e-mail'), 'ana@exemplo.com.br');
    await usuario.click(screen.getByRole('button', { name: 'Quero receber' }));

    const mensagem = screen.getByText('Pronto! Você vai receber os próximos lotes raros.');
    expect(mensagem).toBeInTheDocument();
    expect(mensagem).toHaveFocus();
    expect(screen.queryByLabelText('Seu e-mail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quero receber' })).not.toBeInTheDocument();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it('limpa o erro ao voltar a digitar e aceita o e-mail corrigido', async () => {
    const usuario = userEvent.setup();
    render(<Newsletter />);
    await usuario.click(screen.getByRole('button', { name: 'Quero receber' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Seu e-mail'), 'ana@exemplo.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await usuario.keyboard('{Enter}');
    expect(screen.getByText(/Pronto!/)).toBeInTheDocument();
  });
});
