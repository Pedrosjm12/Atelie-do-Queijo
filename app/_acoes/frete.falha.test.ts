import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/pedido.server', () => ({
  calcularFrete: () => Promise.reject(new Error('transportadora fora do ar: 01310100')),
}));

describe('consultarFrete com falha interna', () => {
  it('devolve indisponivel, sem lançar e sem repetir a mensagem do erro', async () => {
    const { consultarFrete } = await import('./frete');
    const resposta = await consultarFrete('01310-100');
    expect(resposta).toEqual({ ok: false, erro: 'indisponivel' });
  });
});
