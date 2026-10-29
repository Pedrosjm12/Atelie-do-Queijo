import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/pedido.server', () => ({
  calcularFrete: () => Promise.reject(new Error('transportadora fora do ar: maria@email.com')),
  criarPedido: () => Promise.reject(new Error('gateway fora do ar')),
}));

describe('confirmarPedido com falha interna', () => {
  it('devolve indisponivel, sem lançar e sem repetir a mensagem do erro', async () => {
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
    expect(r).toEqual({ ok: false, motivo: 'indisponivel' });
  });
});
