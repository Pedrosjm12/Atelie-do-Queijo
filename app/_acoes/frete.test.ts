import { afterEach, describe, expect, it, vi } from 'vitest';
import * as modulo from './frete';
import { consultarFrete } from './frete';

describe('consultarFrete (Server Action chamada direto)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exporta só consultarFrete', () => {
    expect(Object.keys(modulo)).toEqual(['consultarFrete']);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['objeto vazio', {}],
    ['número', 123],
    ['array', ['01310100']],
    ['Map', new Map()],
    ['texto', 'abc'],
    ['vazio', ''],
    ['7 dígitos', '0131010'],
    ['9 dígitos', '013101009'],
    ['hífen no lugar errado', '0131-0100'],
    ['10 caracteres', '01310-1009'],
    ['10 mil zeros', '0'.repeat(10_000)],
  ])('entrada %s → cep-invalido, sem lançar', async (_nome, entrada) => {
    await expect(consultarFrete(entrada)).resolves.toEqual({ ok: false, erro: 'cep-invalido' });
  });

  it('CEP com hífen ou sem → atendido, com prazo e valor ainda em lacuna (P27)', async () => {
    const esperado = {
      ok: true,
      resultado: { situacao: 'atendido', prazoDiasUteis: null, valor: null },
    };
    await expect(consultarFrete('01310100')).resolves.toEqual(esperado);
    await expect(consultarFrete('01310-100')).resolves.toEqual(esperado);
  });

  it('faixa 00000-000 a 00999-999 → fora de área (P28)', async () => {
    const esperado = { ok: true, resultado: { situacao: 'fora-de-area' } };
    await expect(consultarFrete('00500-000')).resolves.toEqual(esperado);
    await expect(consultarFrete('00999999')).resolves.toEqual(esperado);
    await expect(consultarFrete('01000000')).resolves.toMatchObject({
      resultado: { situacao: 'atendido' },
    });
  });

  it('não repete a entrada na resposta nem registra nada no console', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const respostas = await Promise.all([
      consultarFrete('01310-100'),
      consultarFrete('segredo-1234'),
      consultarFrete({ cep: '01310100' }),
    ]);
    expect(JSON.stringify(respostas)).not.toMatch(/01310|segredo/);
    for (const e of espioes) expect(e).not.toHaveBeenCalled();
  });
});
