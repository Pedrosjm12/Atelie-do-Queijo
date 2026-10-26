import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { HeaderNav } from './HeaderNav';

const usePathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

describe('HeaderNav', () => {
  it('marca o link da seção atual com aria-current="page"', () => {
    usePathname.mockReturnValue('/queijos');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'Queijos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Presentes' })).not.toHaveAttribute('aria-current');
  });

  it('mantém a seção ativa em rotas filhas', () => {
    usePathname.mockReturnValue('/queijos/canastra-curado');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'Queijos' })).toHaveAttribute('aria-current', 'page');
  });

  it('não marca nenhum link na Home', () => {
    usePathname.mockReturnValue('/');
    render(<HeaderNav />);
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('aponta para as rotas da spec', () => {
    usePathname.mockReturnValue('/');
    render(<HeaderNav />);
    const destinos = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(destinos).toEqual(['/queijos', '/presentes', '/aprenda', '/produtores']);
  });
});

describe('Header', () => {
  it('expõe a sacola com rótulo e destino', () => {
    usePathname.mockReturnValue('/');
    render(<Header />);
    const sacola = screen.getByRole('link', { name: 'Sacola, 0 itens' });
    expect(sacola).toHaveAttribute('href', '/sacola');
  });

  it('tem botões de busca e conta com rótulo', () => {
    usePathname.mockReturnValue('/');
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minha conta' })).toBeInTheDocument();
  });
});
