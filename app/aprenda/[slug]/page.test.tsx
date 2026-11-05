import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SacolaProvider } from '@/components/SacolaProvider';
import { ARTIGOS } from '@/data/artigos';
import PaginaDoArtigo, { dynamicParams, generateMetadata, generateStaticParams } from './page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const props = (slug: string) => ({ params: Promise.resolve({ slug }) }) as never;

describe('página /aprenda/[slug]', () => {
  it('é estática: um parâmetro por artigo e nenhum outro slug', () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual(ARTIGOS.map((a) => ({ slug: a.slug })));
  });

  it('metadados: título do artigo; slug desconhecido não gera título', async () => {
    const meta = await generateMetadata(props('queijo-e-vinho'));
    expect(meta.title).toBe('Queijo e vinho: um guia sem regras chatas');
    expect(meta.alternates?.canonical).toBe('/aprenda/queijo-e-vinho');
    expect(meta.openGraph).toMatchObject({ type: 'article', locale: 'pt_BR' });
    expect((meta.description as string).length).toBeLessThanOrEqual(160);
    expect(await generateMetadata(props('nao-existe'))).toEqual({});
  });

  it('slug desconhecido chama notFound', async () => {
    await expect(PaginaDoArtigo(props('nao-existe'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('mostra h1, sobretítulo, trilha, corpo e queijos citados como lacunas', async () => {
    render(<SacolaProvider>{await PaginaDoArtigo(props('queijo-e-vinho'))}</SacolaProvider>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Queijo e vinho: um guia sem regras chatas',
    );
    expect(screen.getByText('Harmonização')).toBeInTheDocument();
    expect(screen.getByText('[TEXTO DO ARTIGO]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Queijos citados' })).toBeInTheDocument();
    expect(screen.getByText('[A DEFINIR: queijos citados]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aprenda' })).toHaveAttribute('href', '/aprenda');
    expect(
      screen.getByText('Queijo e vinho: um guia sem regras chatas', {
        selector: '[aria-current="page"]',
      }),
    ).toBeInTheDocument();
  });
});
