import { afterEach, describe, expect, it } from 'vitest';
import {
  HORARIO_DO_ATENDIMENTO,
  TEXTO_DA_CAVE_FECHADA,
  TEXTO_DO_HORARIO,
  atendimentoHumanoAberto,
} from './horario';
import {
  lerNumeroDoPedido,
  linkDoWhatsApp,
  mensagemDoWhatsApp,
  type NumeroDoPedido,
} from './whatsapp';

const NUMERO = '5520900000000';

function textoDoLink(link: string): string {
  const url = new URL(link);
  return decodeURIComponent(url.searchParams.get('text') ?? '');
}

describe('mensagemDoWhatsApp', () => {
  it('traz os quatro textos literais da §8.3', () => {
    expect(mensagemDoWhatsApp({ tipo: 'geral' })).toBe(
      'Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.',
    );
    expect(mensagemDoWhatsApp({ tipo: 'produto', nomeDoQueijo: 'Canastra curado' })).toBe(
      'Olá! Tenho uma dúvida sobre o Canastra curado.',
    );
    expect(mensagemDoWhatsApp({ tipo: 'pedido', numero: 'AQ-123456' })).toBe(
      'Olá! Quero falar sobre o pedido nº AQ-123456.',
    );
    expect(mensagemDoWhatsApp({ tipo: 'corporativo' })).toBe(
      'Olá! Quero um orçamento de presentes para empresa.',
    );
  });

  it('recusa um número de pedido fora do formato, mesmo burlando o tipo', () => {
    const ruim = 'AQ-12345&x=1' as NumeroDoPedido;
    expect(() => mensagemDoWhatsApp({ tipo: 'pedido', numero: ruim })).toThrow(RangeError);
  });
});

describe('linkDoWhatsApp', () => {
  it('monta https://wa.me/<numero>?text=<mensagem codificada>', () => {
    const link = linkDoWhatsApp(NUMERO, { tipo: 'geral' });
    expect(link.startsWith(`https://wa.me/${NUMERO}?text=`)).toBe(true);
    expect(textoDoLink(link)).toBe(
      'Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.',
    );
  });

  it('codifica com encodeURIComponent: espaços, acentos, ?, & e #', () => {
    const nome = 'Queijo? A&B #1 ção';
    const link = linkDoWhatsApp(NUMERO, { tipo: 'produto', nomeDoQueijo: nome });
    const texto = link.slice(link.indexOf('?text=') + '?text='.length);
    expect(texto).toBe(encodeURIComponent(`Olá! Tenho uma dúvida sobre o ${nome}.`));
    expect(texto).not.toMatch(/[ ?&#]/);
    expect(textoDoLink(link)).toBe(`Olá! Tenho uma dúvida sobre o ${nome}.`);
    // Um único parâmetro e nenhum fragmento: o & e o # do nome não vazaram.
    expect([...new URL(link).searchParams.keys()]).toEqual(['text']);
    expect(new URL(link).hash).toBe('');
  });

  it('inclui o número do pedido validado', () => {
    const numero = lerNumeroDoPedido('aq 123456');
    expect(numero).not.toBeNull();
    if (numero === null) return;
    expect(textoDoLink(linkDoWhatsApp(NUMERO, { tipo: 'pedido', numero }))).toBe(
      'Olá! Quero falar sobre o pedido nº AQ-123456.',
    );
  });

  it('aceita número com 10 ou 11 dígitos depois do 55', () => {
    expect(() => linkDoWhatsApp('551140001234', { tipo: 'geral' })).not.toThrow();
    expect(() => linkDoWhatsApp('5511912345678', { tipo: 'geral' })).not.toThrow();
  });

  it.each([
    '',
    '20900000000',
    '+5520900000000',
    '55 20 90000 0000',
    '55209000000',
    '55209000000000',
    '5520900000000/../x',
    '5520900000000?a=1',
    'abc',
  ])('lança RangeError com o número inválido %j, sem repeti-lo na mensagem', (numero) => {
    let erro: unknown;
    try {
      linkDoWhatsApp(numero, { tipo: 'geral' });
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(RangeError);
    if (erro instanceof Error && numero.length > 3) {
      expect(erro.message).not.toContain(numero);
    }
  });
});

describe('lerNumeroDoPedido', () => {
  it.each([
    ['AQ-123456', 'AQ-123456'],
    ['aq-123456', 'AQ-123456'],
    ['AQ 123456', 'AQ-123456'],
    ['AQ123456', 'AQ-123456'],
    ['  aq-000123  ', 'AQ-000123'],
  ])('lê %j como %j', (entrada, esperado) => {
    expect(lerNumeroDoPedido(entrada)).toBe(esperado);
  });

  it.each([
    '',
    'AQ-12345',
    'AQ-1234567',
    'AQ-12345a',
    'AQ-ABCDEF',
    '123456',
    'AQ--123456',
    'XAQ-123456',
    'AQ-123456 obrigado',
    'meu pedido AQ-123456',
    'AQ-１２３４５６',
  ])('devolve null para %j', (entrada) => {
    expect(lerNumeroDoPedido(entrada)).toBeNull();
  });
});

describe('textos do horário', () => {
  it('são os literais da spec', () => {
    expect(TEXTO_DO_HORARIO).toBe('Seg a sex, 9h às 18h · sáb, 9h às 15h');
    expect(TEXTO_DA_CAVE_FECHADA).toBe(
      'Nossa cave está fechada agora. Atendemos de segunda a sexta, das 9h às 18h, e aos sábados, das 9h às 15h. Se preferir, o Assistente do Ateliê responde na hora pelo site.',
    );
  });

  it('a tabela tem 7 dias: domingo fechado, seg a sex 9h–18h, sábado 9h–15h', () => {
    expect(HORARIO_DO_ATENDIMENTO).toHaveLength(7);
    expect(HORARIO_DO_ATENDIMENTO[0]).toBeNull();
    for (const dia of [1, 2, 3, 4, 5]) {
      expect(HORARIO_DO_ATENDIMENTO[dia]).toEqual({ abre: 540, fecha: 1080 });
    }
    expect(HORARIO_DO_ATENDIMENTO[6]).toEqual({ abre: 540, fecha: 900 });
  });
});

describe('atendimentoHumanoAberto', () => {
  // São Paulo é UTC−3 o ano todo (sem horário de verão desde 2019). Datas de 2026:
  // 02/11 seg, 03/11 ter, 07/11 sáb, 08/11 dom, 09/11 seg. Hora local = hora UTC − 3.
  const sp = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`);

  const casos: readonly [string, Date, boolean][] = [
    ['seg 8:59', sp('2026-11-02', '08:59'), false],
    ['seg 9:00', sp('2026-11-02', '09:00'), true],
    ['ter 12:00', sp('2026-11-03', '12:00'), true],
    ['ter 17:59', sp('2026-11-03', '17:59'), true],
    ['ter 18:00', sp('2026-11-03', '18:00'), false],
    ['ter 00:00', sp('2026-11-03', '00:00'), false],
    ['ter 23:59', sp('2026-11-03', '23:59'), false],
    ['sex 17:59', sp('2026-11-06', '17:59'), true],
    ['sex 18:00', sp('2026-11-06', '18:00'), false],
    ['sáb 8:59', sp('2026-11-07', '08:59'), false],
    ['sáb 9:00', sp('2026-11-07', '09:00'), true],
    ['sáb 14:59', sp('2026-11-07', '14:59'), true],
    ['sáb 15:00', sp('2026-11-07', '15:00'), false],
    ['sáb 17:00', sp('2026-11-07', '17:00'), false],
    ['dom 00:00', sp('2026-11-08', '00:00'), false],
    ['dom 10:00', sp('2026-11-08', '10:00'), false],
    ['dom 12:00', sp('2026-11-08', '12:00'), false],
    ['dom 23:59', sp('2026-11-08', '23:59'), false],
  ];

  it.each(casos)('%s', (_nome, agora, esperado) => {
    expect(atendimentoHumanoAberto(agora)).toBe(esperado);
  });

  it('usa o dia de São Paulo, não o do UTC, na virada da meia-noite', () => {
    // 2026-11-07 (sáb) 23:30 em SP = 2026-11-08 02:30Z, já domingo no UTC. Fechado de qualquer jeito.
    expect(atendimentoHumanoAberto(new Date('2026-11-08T02:30:00Z'))).toBe(false);
    // 2026-11-09 (seg) 09:00 em SP = 12:00Z: aberto. Às 08:59 em SP (11:59Z) ainda fechado.
    expect(atendimentoHumanoAberto(new Date('2026-11-09T11:59:00Z'))).toBe(false);
    expect(atendimentoHumanoAberto(new Date('2026-11-09T12:00:00Z'))).toBe(true);
    // 2026-11-03 (ter) 17:59 em SP = 20:59Z; 18:00 = 21:00Z.
    expect(atendimentoHumanoAberto(new Date('2026-11-03T20:59:00Z'))).toBe(true);
    expect(atendimentoHumanoAberto(new Date('2026-11-03T21:00:00Z'))).toBe(false);
    // Segunda 00:30Z = domingo 21:30 em SP: fechado, mesmo sendo segunda no UTC.
    expect(atendimentoHumanoAberto(new Date('2026-11-09T00:30:00Z'))).toBe(false);
    // Domingo 12:00Z = domingo 09:00 em SP: fechado, mesmo sendo horário comercial.
    expect(atendimentoHumanoAberto(new Date('2026-11-08T12:00:00Z'))).toBe(false);
  });

  describe('com o fuso da máquina diferente de São Paulo', () => {
    const fusoOriginal = process.env.TZ;

    afterEach(() => {
      if (fusoOriginal === undefined) delete process.env.TZ;
      else process.env.TZ = fusoOriginal;
    });

    it.each(['UTC', 'Asia/Tokyo', 'Pacific/Kiritimati', 'America/Los_Angeles'])(
      'dá a mesma resposta com TZ=%s em todas as fronteiras',
      (fuso) => {
        process.env.TZ = fuso;
        // Confirma que o fuso da máquina mudou de fato (Tóquio e Kiritimati nunca são UTC−3).
        if (fuso !== 'UTC') {
          expect(new Date('2026-11-03T12:00:00Z').getTimezoneOffset()).not.toBe(180);
        }
        for (const [nome, agora, esperado] of casos) {
          expect(atendimentoHumanoAberto(agora), `${nome} com TZ=${fuso}`).toBe(esperado);
        }
      },
    );
  });
});
