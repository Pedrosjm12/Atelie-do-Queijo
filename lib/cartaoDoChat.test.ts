import { describe, expect, it } from 'vitest';
import { CARTAO_DO_CHAT } from './cartaoDoChat';
import { dadosDoCartao, obterQueijo } from './catalogo';

describe('CARTAO_DO_CHAT', () => {
  it('bate com os dados reais do Canastra curado no contexto do chat', () => {
    const queijo = obterQueijo('canastra-curado');
    if (!queijo) throw new Error('canastra-curado ausente do catálogo');
    const { tag, linhaPequena, preco } = dadosDoCartao(queijo, 'chat');

    expect(CARTAO_DO_CHAT).toEqual({
      slug: queijo.slug,
      nome: queijo.nome,
      tag,
      linhaPequena,
      preco,
    });
  });
});
