import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from './MobileMenu';

const usePathname = vi.fn<() => string>(() => '/');
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

describe('MobileMenu', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/');
  });

  it('começa fechado, com aria-expanded e aria-controls', () => {
    render(<MobileMenu />);
    const botao = screen.getByRole('button', { name: 'Menu' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    const idDoPainel = botao.getAttribute('aria-controls');
    expect(idDoPainel).toBeTruthy();
    expect(document.getElementById(idDoPainel as string)).not.toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('abre e fecha pelo botão', async () => {
    const usuario = userEvent.setup();
    render(<MobileMenu />);
    const botao = screen.getByRole('button', { name: 'Menu' });

    await usuario.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible();

    await usuario.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('Esc fecha o menu e devolve o foco ao botão', async () => {
    const usuario = userEvent.setup();
    render(<MobileMenu />);
    const botao = screen.getByRole('button', { name: 'Menu' });

    await usuario.click(botao);
    await usuario.tab();
    expect(screen.getByRole('link', { name: 'Queijos' })).toHaveFocus();

    await usuario.keyboard('{Escape}');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveFocus();
  });

  it('fecha ao escolher um link', async () => {
    const usuario = userEvent.setup();
    render(<MobileMenu />);
    const botao = screen.getByRole('button', { name: 'Menu' });

    await usuario.click(botao);
    await usuario.click(screen.getByRole('link', { name: 'Presentes' }));
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha quando a rota muda por outro meio (voltar, logo, sacola)', async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(<MobileMenu />);
    const botao = screen.getByRole('button', { name: 'Menu' });
    await usuario.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    usePathname.mockReturnValue('/sacola');
    rerender(<MobileMenu />);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });
});
