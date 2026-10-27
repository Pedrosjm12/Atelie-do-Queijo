import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { calcularTotais, normalizarCep } from './commerce';
import type { Cep, PedidoPrecificado } from './commerce';
import { calcularFrete, criarPedido } from './pedido.server';

describe('calcularFrete (simulado)', () => {
  it('faixa 00000-000 a 00999-999 → fora de área', async () => {
    for (const cep of ['00000000', '00500000', '00999999']) {
      expect(await calcularFrete(normalizarCep(cep)!)).toEqual({ situacao: 'fora-de-area' });
    }
  });

  it('demais CEPs → atendido com prazo e valor em lacuna (P27)', async () => {
    for (const cep of ['01000000', '01310100', '99999999']) {
      expect(await calcularFrete(normalizarCep(cep)!)).toEqual({
        situacao: 'atendido',
        prazoDiasUteis: null,
        valor: null,
      });
    }
  });

  it('defensiva: o que não é CEP de 8 dígitos vira fora de área, sem lançar', async () => {
    for (const v of [
      undefined,
      null,
      1310100,
      {},
      ['01310100'],
      '',
      '0131010',
      '013101000',
      '01310-10',
      'abcdefgh',
    ]) {
      expect(await calcularFrete(v as unknown as Cep), String(v)).toEqual({
        situacao: 'fora-de-area',
      });
    }
  });
});

describe('criarPedido (simulado)', () => {
  const base = (email: string): PedidoPrecificado => ({
    cliente: { nome: 'Maria Souza', email, telefone: '11912345678' },
    endereco: {
      cep: '01310100' as Cep,
      logradouro: 'Avenida Paulista',
      numero: '1578',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    presente: null,
    pagamento: 'pix',
    linhas: [],
    totais: calcularTotais(18000, 0, 'pix'),
  });

  it('recusa@exemplo.com → pagamento-recusado (em qualquer caixa)', async () => {
    expect(await criarPedido(base('recusa@exemplo.com'))).toEqual({
      ok: false,
      motivo: 'pagamento-recusado',
    });
    expect(await criarPedido(base('Recusa@Exemplo.com'))).toEqual({
      ok: false,
      motivo: 'pagamento-recusado',
    });
  });

  it('caso feliz → número AQ- + 6 dígitos, e-mail e totais devolvidos', async () => {
    const r = await criarPedido(base('maria@email.com'));
    expect(r).toMatchObject({
      ok: true,
      email: 'maria@email.com',
      totais: calcularTotais(18000, 0, 'pix'),
    });
    if (r.ok) expect(r.numero).toMatch(/^AQ-\d{6}$/);
  });

  it('usa o gerador criptográfico e preenche com zeros à esquerda', async () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((
      a: Uint32Array,
    ) => {
      a[0] = 42;
      return a;
    }) as typeof crypto.getRandomValues);
    try {
      const r = await criarPedido(base('maria@email.com'));
      expect(r).toMatchObject({ ok: true, numero: 'AQ-000042' });
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('descarta amostras do fim da faixa (sem viés de módulo)', async () => {
    const amostras = [4_294_000_000, 4_294_967_295, 1_234_567];
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((
      a: Uint32Array,
    ) => {
      a[0] = amostras.shift() ?? 0;
      return a;
    }) as typeof crypto.getRandomValues);
    try {
      expect(await criarPedido(base('maria@email.com'))).toMatchObject({ numero: 'AQ-234567' });
      expect(spy).toHaveBeenCalledTimes(3);
    } finally {
      spy.mockRestore();
    }
  });

  it('não registra nada em log', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    try {
      await criarPedido(base('recusa@exemplo.com'));
      await criarPedido(base('maria@email.com'));
      for (const e of espioes) expect(e).not.toHaveBeenCalled();
    } finally {
      for (const e of espioes) e.mockRestore();
    }
  });

  it('o gatilho de recusa está marcado como simulação a remover com o gateway', () => {
    const codigo = readFileSync(join(process.cwd(), 'lib', 'pedido.server.ts'), 'utf8');
    expect(codigo.match(/\/\/ SIMULAÇÃO: remover com o gateway/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('o módulo declara que é só do servidor', () => {
    const codigo = readFileSync(join(process.cwd(), 'lib', 'pedido.server.ts'), 'utf8');
    expect(codigo).toMatch(/^import 'server-only';/m);
  });

  it('commerce.ts (importável no cliente) não contém mais as funções de servidor', () => {
    const codigo = readFileSync(join(process.cwd(), 'lib', 'commerce.ts'), 'utf8');
    expect(codigo).not.toMatch(/export (async )?function (calcularFrete|criarPedido)/);
  });
});
