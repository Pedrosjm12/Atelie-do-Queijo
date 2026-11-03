import { describe, expect, it } from 'vitest';
import { dadosDoCartao, listarQueijos } from './catalogo';
import {
  CARTOES_DO_CHAT,
  FORMATOS_DO_CANASTRA_NO_CHAT,
  QUEIJOS_DO_QUIZ_NO_CHAT,
} from './cartoesDoChat';
import { maiorFormatoEmGramas } from './quiz';

describe('CARTOES_DO_CHAT', () => {
  it('tem um cartão para cada queijo do catálogo, e só para eles', () => {
    expect(Object.keys(CARTOES_DO_CHAT).sort()).toEqual(
      listarQueijos()
        .map((q) => q.slug)
        .sort(),
    );
  });

  it.each(listarQueijos().map((q) => [q.slug, q] as const))(
    '%s bate com dadosDoCartao(q, "chat") e com a ilustração do catálogo',
    (slug, queijo) => {
      const { tag, linhaPequena, preco } = dadosDoCartao(queijo, 'chat');
      expect(CARTOES_DO_CHAT[slug]).toEqual({
        nome: queijo.nome,
        tag,
        linhaPequena,
        preco,
        ilustracao: {
          shape: queijo.ilustracao.shape,
          side: queijo.ilustracao.side,
          top: queijo.ilustracao.top,
        },
      });
    },
  );
});

describe('QUEIJOS_DO_QUIZ_NO_CHAT', () => {
  it('bate com o catálogo: mesma ordem e maior formato em gramas', () => {
    expect(QUEIJOS_DO_QUIZ_NO_CHAT).toEqual(
      listarQueijos().map((q) => ({
        slug: q.slug,
        maiorFormatoEmGramas: maiorFormatoEmGramas(q.formatos),
      })),
    );
  });
});

describe('FORMATOS_DO_CANASTRA_NO_CHAT', () => {
  it('bate com os formatos do Canastra curado (id e "nome peso")', () => {
    const canastra = listarQueijos().find((q) => q.slug === 'canastra-curado');
    expect(FORMATOS_DO_CANASTRA_NO_CHAT).toEqual(
      canastra?.formatos.map((f) => ({ id: f.id, rotulo: `${f.nome} ${f.peso}` })),
    );
  });
});
