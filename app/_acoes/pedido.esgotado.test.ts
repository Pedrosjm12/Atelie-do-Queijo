import { describe, expect, it, vi } from 'vitest';

// Catálogo marca o queijo como esgotado: o índice da sacola ainda o aceita, então quem recusa é a
// precificação a partir do catálogo (segunda linha de defesa).
vi.mock('@/lib/catalogo', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('@/lib/catalogo')>();
  return {
    ...original,
    resumoParaSacola: () =>
      original.resumoParaSacola().map((q) => ({ ...q, esgotado: q.slug === 'canastra-curado' })),
  };
});

describe('confirmarPedido com queijo esgotado', () => {
  it('chamada direta com um queijo esgotado → sacola-invalida', async () => {
    const { confirmarPedido } = await import('./pedido');
    const r = await confirmarPedido({
      itens: [{ slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 }],
      presente: false,
      pagamento: 'pix',
      entrega: {
        cliente: { nome: 'Maria da Silva', email: 'maria@email.com', telefone: '11912345678' },
        endereco: {
          cep: '01310100',
          logradouro: 'Avenida Paulista',
          numero: '1578',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
        },
        presente: null,
      },
    });
    expect(r).toEqual({ ok: false, motivo: 'sacola-invalida' });
  });
});
