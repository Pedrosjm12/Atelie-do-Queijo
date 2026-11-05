import { describe, expect, it } from 'vitest';
import { ARTIGOS } from '@/data/artigos';
import { QUEIJOS } from '@/data/cheeses';
import {
  DESCRICAO_DO_SITE,
  IMAGEM_DE_COMPARTILHAMENTO,
  caminhosIndexaveis,
  descricaoCurta,
  descricaoDoArtigo,
  metadadosDaPagina,
} from './seo';

describe('caminhosIndexaveis', () => {
  const caminhos = caminhosIndexaveis();

  it('tem a ordem do sitemap e a contagem esperada', () => {
    expect(caminhos[0]).toBe('/');
    expect(caminhos[1]).toBe('/queijos');
    expect(caminhos.at(-1)).toBe('/produtores');
    expect(caminhos).toHaveLength(2 + QUEIJOS.length + 2 + ARTIGOS.length + 1);
  });

  it('nunca inclui sacola, checkout, nem repete caminhos', () => {
    expect(caminhos).not.toContain('/sacola');
    expect(caminhos).not.toContain('/checkout');
    expect(new Set(caminhos).size).toBe(caminhos.length);
  });
});

describe('descricaoCurta', () => {
  it('mantém textos curtos e normaliza espaços', () => {
    expect(descricaoCurta('  a   b ')).toBe('a b');
  });

  it('corta em palavra inteira, com reticências, até o limite', () => {
    const r = descricaoCurta('palavra '.repeat(40), 50);
    expect(r.length).toBeLessThanOrEqual(50);
    expect(r.endsWith('…')).toBe(true);
    expect(r).not.toMatch(/palav…$/);
  });

  it('nunca deixa uma lacuna aberta', () => {
    const r = descricaoCurta('Texto inicial longo [A DEFINIR pelo dono do projeto] fim', 30);
    expect(r).not.toContain('[');
  });

  it('corte vazio devolve a descrição do site', () => {
    expect(descricaoCurta('[A DEFINIR pelo dono do projeto] fim', 20)).toBe(DESCRICAO_DO_SITE);
  });
});

describe('descricaoDoArtigo', () => {
  it('prefere a descrição do dono', () => {
    expect(descricaoDoArtigo({ descricao: 'Minha descrição', corpo: ['Outro'] })).toBe(
      'Minha descrição',
    );
  });
  it('usa o início do corpo e, sem ele, a do site', () => {
    expect(descricaoDoArtigo({ corpo: ['Primeiro parágrafo.', 'Segundo'] })).toBe(
      'Primeiro parágrafo.',
    );
    expect(descricaoDoArtigo({ corpo: null })).toBe(DESCRICAO_DO_SITE);
  });
});

describe('metadadosDaPagina', () => {
  it('monta canônica, Open Graph e Twitter com o título completo', () => {
    const m = metadadosDaPagina({ caminho: '/queijos', titulo: 'Queijos', descricao: 'd' });
    expect(m.alternates?.canonical).toBe('/queijos');
    expect(m.openGraph).toMatchObject({
      title: 'Queijos — Ateliê do Queijo',
      url: '/queijos',
      locale: 'pt_BR',
      type: 'website',
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', description: 'd' });
  });

  it('repete a imagem de compartilhamento em openGraph e twitter (merge raso)', () => {
    const m = metadadosDaPagina({ caminho: '/queijos', titulo: 'Queijos', descricao: 'd' });
    expect(IMAGEM_DE_COMPARTILHAMENTO).toMatchObject({
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Ateliê do Queijo',
      type: 'image/png',
    });
    expect(m.openGraph).toMatchObject({ images: [IMAGEM_DE_COMPARTILHAMENTO] });
    expect(m.twitter).toMatchObject({ images: [IMAGEM_DE_COMPARTILHAMENTO] });
  });

  it('Home usa só o nome do site e artigo usa type article', () => {
    expect(
      metadadosDaPagina({ caminho: '/', titulo: null, descricao: 'd' }).openGraph,
    ).toMatchObject({ title: 'Ateliê do Queijo' });
    expect(
      metadadosDaPagina({ caminho: '/aprenda/x', titulo: 'X', descricao: 'd', tipo: 'article' })
        .openGraph,
    ).toMatchObject({ type: 'article' });
  });
});

describe('app/opengraph-image.tsx', () => {
  it('mantém alt, size e contentType iguais a IMAGEM_DE_COMPARTILHAMENTO', async () => {
    const arquivo = await import('../app/opengraph-image');
    expect(arquivo.alt).toBe(IMAGEM_DE_COMPARTILHAMENTO.alt);
    expect(arquivo.size).toEqual({
      width: IMAGEM_DE_COMPARTILHAMENTO.width,
      height: IMAGEM_DE_COMPARTILHAMENTO.height,
    });
    expect(arquivo.contentType).toBe(IMAGEM_DE_COMPARTILHAMENTO.type);
  });
});
