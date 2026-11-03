import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ESTADO_INICIAL,
  TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE,
  type EntradaDoCliente,
  type EstadoDaConversa,
  type EtapaDoRoteiro,
} from './assistant';
import { CARTOES_DO_CHAT } from './cartoesDoChat';
import { TEXTOS_DO_ROTEIRO, assistenteDeterministico, reconhecerIntencao } from './roteiro';
import { atendimentoHumanoAberto, linkDoWhatsApp, mensagemDoWhatsApp } from './whatsapp';

const texto = (t: string): EntradaDoCliente => ({ tipo: 'texto', texto: t });
const clique = (id: string): EntradaDoCliente => ({ tipo: 'resposta-rapida', id });
const responder = (estado: EstadoDaConversa, entrada: EntradaDoCliente) =>
  assistenteDeterministico.responder(estado, entrada);
const noEstado = (etapa: string, extra: Partial<EstadoDaConversa> = {}): EstadoDaConversa => ({
  ...ESTADO_INICIAL,
  etapa: etapa as EtapaDoRoteiro,
  ...extra,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('atendimentoHumanoAberto: relógio falso e datas especiais', () => {
  it('sem argumento, usa o relógio atual (sábado 14:59 em SP aberto, 15:00 fechado)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T17:59:00Z'));
    expect(atendimentoHumanoAberto()).toBe(true);
    vi.setSystemTime(new Date('2026-11-07T18:00:00Z'));
    expect(atendimentoHumanoAberto()).toBe(false);
  });

  it('virada de ano: 1º de janeiro (sex) às 10h abre; 31/12 (qui) abre às 17:59 e fecha às 18:00', () => {
    expect(atendimentoHumanoAberto(new Date('2027-01-01T13:00:00Z'))).toBe(true);
    expect(atendimentoHumanoAberto(new Date('2026-12-31T20:59:00Z'))).toBe(true);
    expect(atendimentoHumanoAberto(new Date('2026-12-31T21:00:00Z'))).toBe(false);
  });

  it('29 de fevereiro de ano bissexto (ter, 2028) segue a regra de dia útil', () => {
    expect(atendimentoHumanoAberto(new Date('2028-02-29T15:00:00Z'))).toBe(true);
  });

  it('meia-noite de São Paulo nunca é lida como hora 24 (seg 00:00 fechado)', () => {
    expect(atendimentoHumanoAberto(new Date('2026-11-09T03:00:00Z'))).toBe(false);
  });

  it('data inválida não abre o atendimento: fechado, sem lançar erro', () => {
    expect(() => atendimentoHumanoAberto(new Date('lixo'))).not.toThrow();
    expect(atendimentoHumanoAberto(new Date('lixo'))).toBe(false);
  });
});

describe('links do WhatsApp com entradas hostis', () => {
  it('nome com injeção de parâmetro e quebra de linha continua dentro de um único text=', () => {
    const nome = 'X&text=hack#frag\r\n%0A<script>';
    const link = linkDoWhatsApp('5520900000000', { tipo: 'produto', nomeDoQueijo: nome });
    const url = new URL(link);
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.hash).toBe('');
    expect(url.searchParams.get('text')).toBe(
      mensagemDoWhatsApp({ tipo: 'produto', nomeDoQueijo: nome }),
    );
    expect(link).not.toMatch(/[\r\n<>]/);
  });

  it('número com quebra de linha no fim ou dígitos de outro alfabeto é recusado', () => {
    expect(() => linkDoWhatsApp('5520900000000\n', { tipo: 'geral' })).toThrow(RangeError);
    expect(() => linkDoWhatsApp('55٢٠٩٠٠٠٠٠٠٠٠', { tipo: 'geral' })).toThrow(RangeError);
  });

  it('número de pedido com quebra de linha no fim é recusado na mensagem', () => {
    const ruim = 'AQ-123456\n' as `AQ-${string}`;
    expect(() => mensagemDoWhatsApp({ tipo: 'pedido', numero: ruim })).toThrow(RangeError);
  });
});

describe('prioridade das palavras-chave: pares ainda não cobertos', () => {
  it.each([
    ['quero falar com um atendente, estou grávida', 'saude'],
    ['gravida e quero presentear com vinho tinto', 'saude'],
    ['reclamação: o pedido não chegou', 'humano'],
    ['atendente, pedido AQ-123456', 'humano'],
    ['frete do presente com vinho tinto', 'humano'],
    ['status do meu pedido', 'pedido'],
    ['pedido de uma tábua com vinho', 'tabua'],
    ['presente', 'sugerir'],
    ['vinho tinto', 'harmonizar'],
    ['um tinto para o presente', 'presente-tinto'],
    ['tábua de frios para o presente com tinto', 'presente-tinto'],
    ['QUERO UM QUEIJO PARA HARMONIZAR', 'harmonizar'],
    ['PEDIDO', 'pedido'],
    ['Quero fazer um pedido de presente para quem adora vinho tinto', 'presente-tinto'],
    ['Quero encomendar um presente para quem gosta de tinto', 'presente-tinto'],
    ['queijo para um brinde de aniversário', 'sugerir'],
    ['fiquei doente com o queijo', 'saude'],
    ['intoxicação alimentar com queijo', 'saude'],
    ['posso dar queijo pro meu bebê', 'saude'],
    ['tem glúten no queijo?', 'saude'],
    ['sou celíaca, qual queijo?', 'saude'],
    ['passei mal depois de comer o brie', 'saude'],
    ['presente com cerveja', 'harmonizar'],
  ] as const)('%j → %s', (frase, esperada) => {
    expect(reconhecerIntencao(frase)).toBe(esperada);
  });

  it('palavra-chave dentro de outra palavra não casa (limite de palavra)', () => {
    expect(reconhecerIntencao('subintolerancia')).toBe('nao-entendi');
    expect(reconhecerIntencao('desatendente')).toBe('nao-entendi');
  });

  it('passagem sem palavra corporativa nem número mantém o contato do estado', async () => {
    const r = await responder(
      noEstado('inicio', { contato: { tipo: 'produto', nomeDoQueijo: 'Brie francês' } }),
      texto('quero falar com o gerente'),
    );
    expect(r.transferirParaHumano).toEqual({ tipo: 'produto', nomeDoQueijo: 'Brie francês' });
  });

  it('o número de pedido vence o motivo corporativo quando ambos aparecem', async () => {
    const r = await responder(ESTADO_INICIAL, texto('orçamento para empresa, pedido aq 123456'));
    expect(r.transferirParaHumano).toEqual({ tipo: 'pedido', numero: 'AQ-123456' });
  });
});

describe('entradas hostis, vazias e gigantes', () => {
  it('texto gigante (1 milhão de caracteres) é cortado e responde rápido', async () => {
    const gigante = 'a '.repeat(500_000);
    const t0 = performance.now();
    const r = await responder(ESTADO_INICIAL, texto(gigante));
    expect(performance.now() - t0).toBeLessThan(1000);
    const eco = r.mensagens.find((m) => m.tipo === 'cliente');
    expect(eco && eco.tipo === 'cliente' && [...eco.texto].length).toBe(
      TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE,
    );
  });

  it('palavra-chave depois do limite de caracteres é ignorada', async () => {
    const r = await responder(ESTADO_INICIAL, texto(`${'x'.repeat(600)} grávida`));
    const respondeuSaude = r.mensagens.some(
      (m) => m.tipo === 'assistente' && m.texto === TEXTOS_DO_ROTEIRO.saude,
    );
    expect(respondeuSaude).toBe(false);
  });

  it('padrão repetido de "falar" (risco de ReDoS) termina rápido', () => {
    const t0 = performance.now();
    reconhecerIntencao(`falar ${'falar '.repeat(80)} xyz`);
    expect(performance.now() - t0).toBeLessThan(500);
  });

  it('reconhecerIntencao direto com entrada enorme é rápido', () => {
    const t0 = performance.now();
    reconhecerIntencao(`falar ${'falar '.repeat(500_000)} xyz`);
    expect(performance.now() - t0).toBeLessThan(1000);
  });

  it('o corte não parte um emoji ao meio', async () => {
    const entrada = '🧀'.repeat(TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE + 5);
    const r = await responder(ESTADO_INICIAL, texto(entrada));
    const eco = r.mensagens[0];
    expect(eco?.tipo === 'cliente' && eco.texto).toBe(
      '🧀'.repeat(TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE),
    );
  });

  it('HTML, aspas e interpolação aparecem como texto e não viram intenção, ação nem passagem', async () => {
    const r = await responder(ESTADO_INICIAL, texto('<img src=x onerror=alert(1)>"`${7*7}'));
    expect(r.mensagens.map((m) => m.tipo)).toEqual(['cliente', 'assistente', 'respostas-rapidas']);
    expect(r.acoes).toEqual([]);
    expect(r.transferirParaHumano).toBeUndefined();
  });

  it('nomes de propriedade perigosos como id de resposta rápida são ignorados em todas as etapas', async () => {
    const etapas = [
      'inicio',
      'quiz-sabor',
      'quiz-uso',
      'quiz-acompanhamento',
      'harmonizar',
      'presente',
      'presente-formato',
      'pedido-numero',
      'livre',
    ];
    for (const etapa of etapas) {
      for (const id of [
        '__proto__',
        'constructor',
        'toString',
        'hasOwnProperty',
        '',
        'sabor:__proto__',
      ]) {
        const estado = noEstado(etapa);
        const r = await responder(estado, clique(id));
        expect(r.mensagens, `${etapa} / ${id}`).toEqual([]);
        expect(r.acoes).toEqual([]);
        expect(r.estado).toBe(estado);
      }
    }
  });

  it('ids de formato com variações (maiúscula, espaço) não geram ação de sacola', async () => {
    for (const id of [
      'formato:',
      'formato:INTEIRA',
      'formato: inteira',
      'formato:inteira ',
      'inteira',
    ]) {
      const r = await responder(noEstado('presente-formato'), clique(id));
      expect(r.acoes, id).toEqual([]);
    }
  });

  it('texto não-string em tempo de execução (null, número, objeto) não derruba o painel', async () => {
    for (const lixo of [null, undefined, 42, {}, []]) {
      await expect(
        responder(ESTADO_INICIAL, { tipo: 'texto', texto: lixo as unknown as string }),
      ).resolves.toBeDefined();
    }
  });
});

describe('estados inválidos ou fora de ordem', () => {
  it('quiz-uso sem sabor guardado recomeça o quiz em vez de lançar erro', async () => {
    const r = await responder(noEstado('quiz-uso'), clique('uso:tabua'));
    expect(r.estado.etapa).toBe('quiz-sabor');
    expect(r.estado.respostasDoQuiz).toEqual({});
    expect(r.acoes).toEqual([]);
  });

  it('quiz-acompanhamento com respostas incompletas recomeça o quiz e não recomenda', async () => {
    const estado = noEstado('quiz-acompanhamento', { respostasDoQuiz: { sabor: 'suaves' } });
    const r = await responder(estado, clique('acompanhamento:tinto'));
    expect(r.estado.etapa).toBe('quiz-sabor');
    expect(r.mensagens.some((m) => m.tipo === 'produto')).toBe(false);
  });

  it('etapa desconhecida em tempo de execução não lança erro nem gera ação', async () => {
    const r = await responder(noEstado('inexistente'), clique('sugerir-queijo')).catch(
      (e: unknown) => e,
    );
    expect(r).not.toBeInstanceOf(Error);
  });

  it('presente-formato só aceita formatos do Canastra e gera uma única ação', async () => {
    const estado = noEstado('presente-formato');
    expect((await responder(estado, clique('formato:inventado'))).acoes).toEqual([]);
    const r = await responder(estado, clique('formato:inteira'));
    expect(r.acoes).toHaveLength(1);
    expect(r.estado.etapa).toBe('inicio');
    expect((await responder(r.estado, clique('formato:inteira'))).acoes).toEqual([]);
  });

  it('proximoId alto continua gerando ids únicos e crescentes a partir dele', async () => {
    const r = await responder(noEstado('inicio', { proximoId: 9_999 }), clique('sugerir-queijo'));
    const ids = r.mensagens.map((m) => m.id);
    expect(ids[0]).toBe('m9999');
    expect(new Set(ids).size).toBe(ids.length);
    expect(r.estado.proximoId).toBe(9_999 + ids.length);
  });

  it('o cartão de produto de cada resposta é o de CARTOES_DO_CHAT', async () => {
    const r = await responder(ESTADO_INICIAL, clique('montar-tabua'));
    const produtos = r.mensagens.filter((m) => m.tipo === 'produto');
    expect(produtos.length).toBeGreaterThan(0);
    for (const m of produtos) {
      if (m.tipo === 'produto') expect(m.cartao).toBe(CARTOES_DO_CHAT[m.slug]);
    }
  });
});
