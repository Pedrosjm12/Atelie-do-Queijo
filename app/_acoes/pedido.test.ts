import { afterEach, describe, expect, it, vi } from 'vitest';
import { QUEIJOS } from '@/data/cheeses';
import { calcularTotais, precoNoPix } from '@/lib/commerce';
import { MENSAGENS_DE_ERRO, intervaloDeEntrega } from '@/lib/pedido';
import * as modulo from './pedido';
import { confirmarPedido } from './pedido';

const queijo = QUEIJOS.find((q) => q.slug === 'canastra-curado')!;
const formato = queijo.formatos.find((f) => f.id === 'inteira')!;

function entradaValida(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    itens: [{ slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 }],
    presente: false,
    pagamento: 'pix',
    entrega: {
      cliente: { nome: 'Maria da Silva', email: 'maria@email.com', telefone: '(11) 91234-5678' },
      endereco: {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        numero: '1578',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      presente: null,
    },
    ...mudancas,
  };
}

function comEntrega(parte: 'cliente' | 'endereco', campos: Record<string, unknown>) {
  const base = entradaValida();
  const entrega = base.entrega as Record<string, Record<string, unknown>>;
  return { ...base, entrega: { ...entrega, [parte]: { ...entrega[parte], ...campos } } };
}

describe('confirmarPedido (Server Action chamada direto)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exporta só confirmarPedido', () => {
    expect(Object.keys(modulo)).toEqual(['confirmarPedido']);
  });

  it('caso feliz: número AQ-dddddd e totais iguais a calcularTotais (Pix, frete em lacuna)', async () => {
    const r = await confirmarPedido(entradaValida());
    expect(r).toMatchObject({ ok: true, email: 'maria@email.com' });
    if (!r.ok) throw new Error('esperava ok');
    expect(r).toHaveProperty('numero');
    expect((r as { numero: string }).numero).toMatch(/^AQ-\d{6}$/);
    expect((r as { totais: unknown }).totais).toEqual(calcularTotais(formato.preco, null, 'pix'));
    expect((r as { totais: { descontoPix: number } }).totais.descontoPix).toBe(
      formato.preco - precoNoPix(formato.preco),
    );
  });

  it('cartão: sem desconto do Pix', async () => {
    const r = await confirmarPedido(entradaValida({ pagamento: 'cartao' }));
    expect(r).toMatchObject({ ok: true, totais: { descontoPix: 0, subtotal: formato.preco } });
  });

  it('ignora preço e total vindos do cliente', async () => {
    const r = await confirmarPedido(
      entradaValida({
        total: 1,
        itens: [{ slug: 'canastra-curado', formatoId: 'inteira', quantidade: 2, preco: 1 }],
      }),
    );
    expect(r).toMatchObject({
      ok: true,
      totais: calcularTotais(formato.preco * 2, 0, 'pix'), // acima de R$ 180: frete grátis
    });
  });

  it('soma linhas repetidas (4 + 6 = 10 passa; 6 + 6 = 12 é recusado)', async () => {
    const linha = (quantidade: number) => ({
      slug: 'canastra-curado',
      formatoId: 'inteira',
      quantidade,
    });
    await expect(
      confirmarPedido(entradaValida({ itens: [linha(4), linha(6)] })),
    ).resolves.toMatchObject({ ok: true, totais: { subtotal: formato.preco * 10 } });
    await expect(confirmarPedido(entradaValida({ itens: [linha(6), linha(6)] }))).resolves.toEqual({
      ok: false,
      motivo: 'sacola-invalida',
    });
  });

  it.each([
    ['slug inexistente', { slug: 'nao-existe', formatoId: 'inteira', quantidade: 1 }],
    ['formato fora do índice', { slug: 'canastra-curado', formatoId: 'xyz', quantidade: 1 }],
    ['formato de outro queijo', { slug: 'brie-frances', formatoId: 'inteira', quantidade: 1 }],
    ['constructor', { slug: 'constructor', formatoId: 'x', quantidade: 1 }],
    ['__proto__', { slug: '__proto__', formatoId: '__proto__', quantidade: 1 }],
    ['quantidade 11', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 11 }],
    ['quantidade 0', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 0 }],
    ['quantidade fracionária', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1.5 }],
    ['NaN', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: Number.NaN }],
    ['Infinity', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: Infinity }],
    ['quantidade em texto', { slug: 'canastra-curado', formatoId: 'inteira', quantidade: '1' }],
    ['item null', null],
  ])('item inválido (%s) → sacola-invalida', async (_nome, item) => {
    await expect(confirmarPedido(entradaValida({ itens: [item] }))).resolves.toEqual({
      ok: false,
      motivo: 'sacola-invalida',
    });
  });

  it('um item inválido recusa o pedido todo (não conserta em silêncio)', async () => {
    const itens = [
      { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 },
      { slug: 'nao-existe', formatoId: 'inteira', quantidade: 1 },
    ];
    await expect(confirmarPedido(entradaValida({ itens }))).resolves.toEqual({
      ok: false,
      motivo: 'sacola-invalida',
    });
  });

  it.each([
    ['vazio', []],
    ['não array', 'abc'],
    ['ausente', undefined],
  ])('itens %s → sacola-invalida', async (_nome, itens) => {
    await expect(confirmarPedido(entradaValida({ itens }))).resolves.toEqual({
      ok: false,
      motivo: 'sacola-invalida',
    });
  });

  it('itens com 31 e com 10.000 linhas → sacola-invalida, sem percorrer os elementos', async () => {
    const item = { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 };
    for (const n of [31, 10_000]) {
      const itens = Array.from({ length: n }, () => item);
      Object.defineProperty(itens, 0, {
        get() {
          throw new Error('elemento lido');
        },
      });
      await expect(confirmarPedido(entradaValida({ itens }))).resolves.toEqual({
        ok: false,
        motivo: 'sacola-invalida',
      });
    }
  });

  it('itens com 30 linhas repetidas é aceito se a soma couber (e recusado se passar de 10)', async () => {
    const item = { slug: 'canastra-curado', formatoId: 'inteira', quantidade: 1 };
    const trinta = Array.from({ length: 30 }, () => item);
    await expect(confirmarPedido(entradaValida({ itens: trinta }))).resolves.toEqual({
      ok: false,
      motivo: 'sacola-invalida',
    });
    await expect(
      confirmarPedido(entradaValida({ itens: trinta.slice(0, 10) })),
    ).resolves.toMatchObject({ ok: true });
  });

  it('e-mail inválido → dados-invalidos com erros.email (mensagem fixa)', async () => {
    const r = await confirmarPedido(comEntrega('cliente', { email: 'sem-arroba' }));
    expect(r).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      erros: { email: MENSAGENS_DE_ERRO.email },
    });
  });

  it('vários campos inválidos → só chaves da lista fixa e valores de MENSAGENS_DE_ERRO', async () => {
    const base = comEntrega('cliente', { nome: '', telefone: '123' });
    const r = await confirmarPedido({ ...base, pagamento: 'boleto' });
    if (r.ok || r.motivo !== 'dados-invalidos') throw new Error('esperava dados-invalidos');
    expect(Object.keys(r.erros).sort()).toEqual(['nome', 'pagamento', 'telefone']);
    for (const [campo, msg] of Object.entries(r.erros)) {
      expect(msg).toBe(MENSAGENS_DE_ERRO[campo as keyof typeof MENSAGENS_DE_ERRO]);
    }
  });

  it('entrega ausente → dados-invalidos com os campos da entrega', async () => {
    const r = await confirmarPedido(entradaValida({ entrega: undefined }));
    expect(r).toMatchObject({ ok: false, motivo: 'dados-invalidos' });
    expect(r).toHaveProperty('erros.email', MENSAGENS_DE_ERRO.email);
  });

  it('recusa@exemplo.com → pagamento-recusado', async () => {
    const r = await confirmarPedido(comEntrega('cliente', { email: 'Recusa@Exemplo.com' }));
    expect(r).toEqual({ ok: false, motivo: 'pagamento-recusado' });
  });

  it('CEP fora de área → fora-de-area', async () => {
    await expect(confirmarPedido(comEntrega('endereco', { cep: '00500-000' }))).resolves.toEqual({
      ok: false,
      motivo: 'fora-de-area',
    });
  });

  it('presente:false com mensagem → a mensagem é descartada', async () => {
    const base = entradaValida();
    const entrega = base.entrega as Record<string, unknown>;
    const r = await confirmarPedido({
      ...base,
      entrega: {
        ...entrega,
        presente: { mensagem: 'segredo-da-mensagem', dataDeEntrega: intervaloDeEntrega().min },
      },
    });
    expect(r).toMatchObject({ ok: true });
    expect(JSON.stringify(r)).not.toContain('segredo-da-mensagem');
  });

  it('presente:false com mensagem e data INVÁLIDAS → descartadas, o pedido não é recusado', async () => {
    const base = entradaValida();
    const entrega = base.entrega as Record<string, unknown>;
    const r = await confirmarPedido({
      ...base,
      entrega: { ...entrega, presente: { mensagem: 'x'.repeat(500), dataDeEntrega: 'ontem' } },
    });
    expect(r).toMatchObject({ ok: true });
  });

  it('lê `itens` uma única vez (um getter que muda na segunda leitura não engana a validação)', async () => {
    const base = entradaValida();
    const validos = base.itens;
    let leituras = 0;
    const entrada = {
      ...base,
      get itens() {
        leituras += 1;
        return leituras === 1 ? validos : [{ slug: 'inexistente', formatoId: 'x', quantidade: 1 }];
      },
    };
    await expect(confirmarPedido(entrada)).resolves.toMatchObject({ ok: true });
    expect(leituras).toBe(1);
  });

  it('presente:true com dados válidos passa; sem dados de presente → dados-invalidos', async () => {
    const base = entradaValida();
    const entrega = base.entrega as Record<string, unknown>;
    const presente = { mensagem: 'Feliz aniversário', dataDeEntrega: intervaloDeEntrega().min };
    await expect(
      confirmarPedido({ ...base, presente: true, entrega: { ...entrega, presente } }),
    ).resolves.toMatchObject({ ok: true });
    await expect(confirmarPedido({ ...base, presente: true })).resolves.toMatchObject({
      ok: false,
      motivo: 'dados-invalidos',
      erros: { dataDeEntrega: MENSAGENS_DE_ERRO.dataDeEntrega },
    });
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['Map', new Map()],
    ['array', [entradaValida()]],
    ['número', 123],
    ['texto', 'abc'],
    ['instância de classe', new (class X {})()],
  ])('entrada %s → dados-invalidos, sem lançar', async (_nome, entrada) => {
    const r = await confirmarPedido(entrada);
    expect(r).toMatchObject({ ok: false, motivo: 'dados-invalidos' });
    expect(r).toHaveProperty('erros.nome', MENSAGENS_DE_ERRO.nome);
  });

  it('não repete a entrada na resposta nem registra nada no console', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const respostas = await Promise.all([
      confirmarPedido(entradaValida()),
      confirmarPedido(comEntrega('cliente', { email: 'recusa@exemplo.com' })),
      confirmarPedido(comEntrega('cliente', { nome: 'Nome-Secreto', telefone: 'x-tel-x' })),
      confirmarPedido(comEntrega('endereco', { logradouro: 'Rua-Secreta', cep: '00500-000' })),
      confirmarPedido({ lixo: 'lixo-secreto' }),
    ]);
    const texto = JSON.stringify(respostas).replace(/AQ-[0-9]{6}/, ''); // o número é sorteado
    expect(texto).not.toMatch(/Silva|11912|Nome-Secreto|Rua-Secreta|lixo-secreto|x-tel-x|01310/);
    for (const e of espioes) expect(e).not.toHaveBeenCalled();
  });
});
