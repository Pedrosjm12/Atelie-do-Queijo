import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import {
  MENSAGENS_DE_ERRO,
  UFS,
  esquemaEntradaDoPedido,
  esquemaEntrega,
  hojeEmSaoPaulo,
  intervaloDeEntrega,
  validarEntrega,
} from './pedido';
import type { CampoDoCheckout } from './pedido';
import { MENSAGEM_DE_CEP_INVALIDO } from './commerce';

// Relógio falso: 2026-10-28 02:30 UTC = 2026-10-27 23:30 em São Paulo (UTC−3).
const AGORA = new Date('2026-10-28T02:30:00Z');

const entregaValida = () => ({
  cliente: { nome: 'Maria Souza', email: 'maria@email.com', telefone: '(11) 91234-5678' },
  endereco: {
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1578',
    complemento: 'apto 42',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
  presente: null as null | { mensagem: string; dataDeEntrega: string },
});

const comPresente = (mensagem: string, dataDeEntrega = '2026-10-28') => ({
  ...entregaValida(),
  presente: { mensagem, dataDeEntrega },
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});
afterEach(() => vi.useRealTimers());

describe('MENSAGENS_DE_ERRO', () => {
  it('traz os textos aprovados no P25 e cobre todos os campos', () => {
    expect(MENSAGENS_DE_ERRO.nome).toBe('Informe seu nome.');
    expect(MENSAGENS_DE_ERRO.email).toBe('Informe um e-mail válido, por exemplo voce@email.com.');
    expect(MENSAGENS_DE_ERRO.telefone).toBe(
      'Informe um telefone com DDD, por exemplo (11) 91234-5678.',
    );
    expect(MENSAGENS_DE_ERRO.cep).toBe('Informe um CEP com 8 números, por exemplo 01310-100.');
    expect(MENSAGENS_DE_ERRO.cep).toBe(MENSAGEM_DE_CEP_INVALIDO); // mesma fonte do navegador
    expect(Object.keys(MENSAGENS_DE_ERRO).sort()).toEqual(
      [
        'nome',
        'email',
        'telefone',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'uf',
        'mensagem',
        'dataDeEntrega',
        'pagamento',
      ].sort(),
    );
  });

  it('UFS e MENSAGENS_DE_ERRO estão congeladas', () => {
    expect(Object.isFrozen(UFS)).toBe(true);
    expect(Object.isFrozen(MENSAGENS_DE_ERRO)).toBe(true);
  });

  it('a mensagem do cartão cita o limite de linhas', () => {
    expect(MENSAGENS_DE_ERRO.mensagem).toBe(
      'Escreva uma mensagem de até 200 caracteres e 6 linhas, por exemplo Feliz aniversário.',
    );
  });

  it('são fixas: sem marcador de interpolação nem texto em inglês', () => {
    for (const texto of Object.values(MENSAGENS_DE_ERRO)) {
      expect(texto).not.toMatch(/\$\{|\{\}|%s|undefined|\bexpected\b|\bInvalid\b/);
      expect(texto.endsWith('.')).toBe(true);
    }
  });
});

describe('fuso e intervalo da data de entrega', () => {
  it('"hoje" é o dia de São Paulo, não o de UTC', () => {
    expect(hojeEmSaoPaulo(AGORA)).toBe('2026-10-27');
    expect(hojeEmSaoPaulo(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-28');
  });

  it('vai de amanhã a +60 dias', () => {
    expect(intervaloDeEntrega(AGORA)).toEqual({ min: '2026-10-28', max: '2026-12-26' });
  });
});

describe('esquemaEntrega / validarEntrega', () => {
  it('aceita uma entrega válida e normaliza telefone e CEP', () => {
    const r = validarEntrega(entregaValida());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.cliente.telefone).toBe('11912345678');
      expect(r.valor.endereco.cep).toBe('01310100');
      expect(r.valor.presente).toBeNull();
    }
  });

  it('descarta chaves desconhecidas (preço, __proto__)', () => {
    const r = validarEntrega({ ...entregaValida(), preco: 1, total: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.valor).sort()).toEqual(['cliente', 'endereco', 'presente']);
  });

  it('mensagem de 201 caracteres é rejeitada; 200 com acentos e emoji é aceita', () => {
    const duzentos = 'á🧀'.repeat(100); // 200 pontos de código, 300 unidades UTF-16
    expect(Array.from(duzentos)).toHaveLength(200);
    expect(validarEntrega(comPresente(duzentos)).ok).toBe(true);

    const r = validarEntrega(comPresente(duzentos + 'a'));
    expect(r).toEqual({ ok: false, erros: { mensagem: MENSAGENS_DE_ERRO.mensagem } });
  });

  it('conta depois da normalização NFC (e + acento combinado = 1 ponto)', () => {
    const nfd = 'é'.repeat(200); // 400 unidades, 200 pontos em NFC
    expect(validarEntrega(comPresente(nfd)).ok).toBe(true);
    const r = validarEntrega(comPresente(nfd + 'é'));
    expect(r.ok).toBe(false);
  });

  it('aplica trim e NFC nos textos', () => {
    const r = validarEntrega({
      ...entregaValida(),
      cliente: { ...entregaValida().cliente, nome: '  José  ' },
    });
    expect(r.ok && r.valor.cliente.nome).toBe('José');
  });

  it('UF XX é rejeitada; todas as 27 UFs são aceitas', () => {
    const base = entregaValida();
    expect(UFS).toHaveLength(27);
    expect(new Set(UFS).size).toBe(27);
    expect(validarEntrega({ ...base, endereco: { ...base.endereco, uf: 'XX' } })).toEqual({
      ok: false,
      erros: { uf: MENSAGENS_DE_ERRO.uf },
    });
    for (const uf of UFS) {
      expect(validarEntrega({ ...base, endereco: { ...base.endereco, uf } }).ok, uf).toBe(true);
    }
    expect(validarEntrega({ ...base, endereco: { ...base.endereco, uf: 'sp' } }).ok).toBe(false);
  });

  it('data de hoje é rejeitada; amanhã e +60 dias são aceitas; +61 é rejeitada', () => {
    const erroData = { ok: false, erros: { dataDeEntrega: MENSAGENS_DE_ERRO.dataDeEntrega } };
    expect(validarEntrega(comPresente('Feliz!', '2026-10-27'))).toEqual(erroData);
    expect(validarEntrega(comPresente('Feliz!', '2026-10-28')).ok).toBe(true);
    expect(validarEntrega(comPresente('Feliz!', '2026-12-26')).ok).toBe(true);
    expect(validarEntrega(comPresente('Feliz!', '2026-12-27'))).toEqual(erroData);
    expect(validarEntrega(comPresente('Feliz!', '2026-10-26'))).toEqual(erroData);
  });

  it('a "virada" do dia segue São Paulo: às 00:10 de amanhã, o dia seguinte passa a valer', () => {
    vi.setSystemTime(new Date('2026-10-28T03:10:00Z')); // 00:10 do dia 28 em São Paulo
    expect(validarEntrega(comPresente('Feliz!', '2026-10-28')).ok).toBe(false);
    expect(validarEntrega(comPresente('Feliz!', '2026-10-29')).ok).toBe(true);
  });

  it('rejeita datas impossíveis e em outro formato', () => {
    for (const d of [
      '2026-02-30',
      '2026-13-01',
      '28/10/2026',
      '2026-1-28',
      '',
      '2026-10-28T00:00',
      'abc',
    ]) {
      expect(validarEntrega(comPresente('Feliz!', d)).ok, d).toBe(false);
    }
  });

  it('presente é opcional (null) e a mensagem pode ficar vazia', () => {
    expect(validarEntrega(entregaValida()).ok).toBe(true);
    expect(validarEntrega(comPresente('')).ok).toBe(true);
  });

  it('complemento é opcional e tem teto de 60', () => {
    const base = entregaValida();
    const { complemento: _, ...semComplemento } = base.endereco;
    void _;
    expect(validarEntrega({ ...base, endereco: semComplemento }).ok).toBe(true);
    expect(
      validarEntrega({ ...base, endereco: { ...base.endereco, complemento: 'x'.repeat(61) } }),
    ).toEqual({
      ok: false,
      erros: { complemento: MENSAGENS_DE_ERRO.complemento },
    });
  });

  it('campos obrigatórios vazios geram uma mensagem fixa por campo', () => {
    const r = validarEntrega({
      cliente: { nome: '', email: '', telefone: '' },
      endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
      presente: null,
    });
    expect(r).toEqual({
      ok: false,
      erros: {
        nome: MENSAGENS_DE_ERRO.nome,
        email: MENSAGENS_DE_ERRO.email,
        telefone: MENSAGENS_DE_ERRO.telefone,
        cep: MENSAGENS_DE_ERRO.cep,
        logradouro: MENSAGENS_DE_ERRO.logradouro,
        numero: MENSAGENS_DE_ERRO.numero,
        bairro: MENSAGENS_DE_ERRO.bairro,
        cidade: MENSAGENS_DE_ERRO.cidade,
        uf: MENSAGENS_DE_ERRO.uf,
      },
    });
  });

  it.each([
    ['e-mail sem @', { email: 'maria.email.com' }, 'email'],
    ['e-mail sem domínio', { email: 'maria@email' }, 'email'],
    ['e-mail com espaço', { email: 'ma ria@email.com' }, 'email'],
    ['e-mail com dois @', { email: 'a@b@email.com' }, 'email'],
    ['e-mail com vírgula', { email: 'a,b@x.com' }, 'email'],
    ['e-mail com < >', { email: '<script>@x.com' }, 'email'],
    ['e-mail com LRM', { email: 'a\u200E@x.com' }, 'email'],
    ['e-mail com RLO', { email: 'a\u202E@x.com' }, 'email'],
    ['e-mail em cirílico', { email: 'почта@пример.рф' }, 'email'],
    ['e-mail com domínio em IDN (não punycode)', { email: 'a@exemplo.cafés' }, 'email'],
    ['e-mail com acento no local', { email: 'josé@x.com' }, 'email'],
    ['e-mail com ponto duplo', { email: 'a..b@x.com' }, 'email'],
    ['e-mail com ponto no começo', { email: '.a@x.com' }, 'email'],
    ['e-mail com ponto no fim do local', { email: 'a.@x.com' }, 'email'],
    ['e-mail com rótulo vazio', { email: 'a@x..com' }, 'email'],
    ['e-mail com rótulo começando em hífen', { email: 'a@-x.com' }, 'email'],
    ['e-mail com rótulo terminando em hífen', { email: 'a@x-.com' }, 'email'],
    ['e-mail com local de 65', { email: `${'a'.repeat(65)}@x.com` }, 'email'],
    ['e-mail com rótulo de 64', { email: `a@${'b'.repeat(64)}.com` }, 'email'],
    ['e-mail com aspas', { email: '"a"@x.com' }, 'email'],
    ['nome de 1 letra', { nome: 'A' }, 'nome'],
    ['nome de 101 letras', { nome: 'a'.repeat(101) }, 'nome'],
    ['telefone com 9 dígitos', { telefone: '123456789' }, 'telefone'],
    ['telefone com 12 dígitos', { telefone: '119123456789' }, 'telefone'],
    ['telefone com letras', { telefone: '11 91234-567a' }, 'telefone'],
  ])('%s → erro só em %s', (_nome, mudanca, campo) => {
    const r = validarEntrega({
      ...entregaValida(),
      cliente: { ...entregaValida().cliente, ...mudanca },
    });
    expect(r).toEqual({
      ok: false,
      erros: { [campo]: MENSAGENS_DE_ERRO[campo as CampoDoCheckout] },
    });
  });

  it.each([
    ['CEP com 7 dígitos', { cep: '0131010' }],
    ['CEP com letras', { cep: '01310-10a' }],
    ['CEP com 10 caracteres', { cep: '01310-100 ' }],
    ['CEP com espaço no meio', { cep: '01310 100' }],
    ['logradouro de 121', { logradouro: 'a'.repeat(121) }],
    ['número de 11', { numero: '1'.repeat(11) }],
    ['bairro de 61', { bairro: 'a'.repeat(61) }],
    ['cidade de 61', { cidade: 'a'.repeat(61) }],
  ])('%s → rejeitado', (_nome, mudanca) => {
    const base = entregaValida();
    expect(validarEntrega({ ...base, endereco: { ...base.endereco, ...mudanca } }).ok).toBe(false);
  });

  it('objeto de grupo inválido → erros nos campos do grupo, não no genérico', () => {
    const base = entregaValida();
    const so = (v: unknown) => {
      const r = validarEntrega(v);
      return r.ok ? null : Object.keys(r.erros).sort();
    };
    expect(so({ ...base, cliente: null })).toEqual(['email', 'nome', 'telefone']);
    expect(so({ ...base, endereco: 'x' })).toEqual(
      ['bairro', 'cep', 'cidade', 'logradouro', 'numero', 'uf'].sort(),
    );
    expect(so({ ...base, presente: 'sim' })).toEqual(['dataDeEntrega', 'mensagem']);
    expect(so({ ...base, presente: {} })).toEqual(['dataDeEntrega', 'mensagem']);
  });

  it('entrada que não é objeto → erros genéricos dos campos obrigatórios, sem lançar', () => {
    for (const v of [null, undefined, 1, 'x', [], { cliente: null }]) {
      const r = validarEntrega(v);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(Object.keys(r.erros).length).toBeGreaterThan(0);
        for (const [campo, msg] of Object.entries(r.erros)) {
          expect(msg).toBe(MENSAGENS_DE_ERRO[campo as CampoDoCheckout]);
        }
      }
    }
  });
});

describe('mensagem do cartão com várias linhas', () => {
  const ok = (m: string) => validarEntrega(comPresente(m)).ok;

  it('"a\\r\\nb" é aceita e contada como 3 pontos de código', () => {
    const r = validarEntrega(comPresente('a\r\nb'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.presente?.mensagem).toBe('a\nb');
      expect(Array.from(r.valor.presente?.mensagem ?? '')).toHaveLength(3);
    }
  });

  it('\\r sozinho também vira \\n; 6 linhas passam e 7 são recusadas', () => {
    expect(ok('1\r2\r3\r4\r5\r6')).toBe(true);
    expect(ok('1\n2\n3\n4\n5\n6')).toBe(true);
    expect(ok('1\r\n2\r\n3\r\n4\r\n5\r\n6')).toBe(true);
    const r = validarEntrega(comPresente('1\n2\n3\n4\n5\n6\n7'));
    expect(r).toEqual({ ok: false, erros: { mensagem: MENSAGENS_DE_ERRO.mensagem } });
    expect(ok('1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7')).toBe(false);
  });

  it('a quebra de linha conta para os 200 pontos de código', () => {
    expect(ok('a\n'.repeat(5) + 'a'.repeat(190))).toBe(true); // 6 linhas, 5 + 190 + 5 = 200
    expect(ok('a\n'.repeat(5) + 'a'.repeat(191))).toBe(false);
  });

  it('só o \\n é liberado: tab, NUL, ESC, U+0085, U+2028 e U+2029 seguem proibidos', () => {
    for (const c of ['\t', '\u0000', '\u001B', '\u0085', '\u2028', '\u2029', '\u000B', '\u000C']) {
      expect(ok(`Feliz${c}aniversário`), JSON.stringify(c)).toBe(false);
    }
  });

  it('\\n e \\r nos outros campos continuam recusados', () => {
    const base = entregaValida();
    for (const c of ['\n', '\r', '\r\n']) {
      expect(
        validarEntrega({ ...base, cliente: { ...base.cliente, nome: `Maria${c}Souza` } }).ok,
      ).toBe(false);
      for (const campo of ['logradouro', 'numero', 'complemento', 'bairro', 'cidade'] as const) {
        expect(
          validarEntrega({ ...base, endereco: { ...base.endereco, [campo]: `ab${c}cd` } }).ok,
          `${campo} ${JSON.stringify(c)}`,
        ).toBe(false);
      }
    }
  });

  it('ZWJ e VS16 passam só na mensagem (emoji composto), não nos outros campos', () => {
    const familia = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'; // homem + mulher + menina
    const coracao = '❤\uFE0F';
    expect(ok(`Com amor ${familia} ${coracao}`)).toBe(true);
    for (const c of ['\u200D', '\uFE0F']) {
      const base = entregaValida();
      expect(validarEntrega({ ...base, cliente: { ...base.cliente, nome: `Ma${c}ria` } }).ok).toBe(
        false,
      );
    }
  });
});

describe('segurança de texto', () => {
  const comNome = (nome: string) => ({
    ...entregaValida(),
    cliente: { ...entregaValida().cliente, nome },
  });

  it.each([
    ['NUL', 'Maria\u0000Souza'],
    ['TAB', 'Maria\tSouza'],
    ['quebra de linha', 'Maria\nSouza'],
    ['ESC', 'Maria\u001BSouza'],
    ['DEL', 'Maria\u007FSouza'],
    ['C1 (U+0085)', 'Maria\u0085Souza'],
  ])('recusa caractere de controle: %s', (_nome, valor) => {
    expect(validarEntrega(comNome(valor)).ok).toBe(false);
  });

  it.each([
    ['U+202A', '\u202A'],
    ['U+202E (RLO)', '\u202E'],
    ['U+2066', '\u2066'],
    ['U+2069', '\u2069'],
  ])('recusa bidirecional %s', (_nome, c) => {
    expect(validarEntrega(comNome(`Maria${c}Souza`)).ok).toBe(false);
    expect(validarEntrega(comPresente(`Feliz${c}`)).ok).toBe(false);
  });

  it.each([
    ['ZWSP U+200B', '\u200B'],
    ['ZWNJ U+200C', '\u200C'],
    ['LRM U+200E', '\u200E'],
    ['RLM U+200F', '\u200F'],
    ['ALM U+061C', '\u061C'],
    ['BOM U+FEFF', '\uFEFF'],
    ['word joiner U+2060', '\u2060'],
    ['U+2064', '\u2064'],
    ['hífen suave U+00AD', '\u00AD'],
    ['separador de linha U+2028', '\u2028'],
    ['separador de parágrafo U+2029', '\u2029'],
    ['tag U+E0041', '\u{E0041}'],
    ['uso privado U+E000', ''],
    ['substituto solto (alto)', '\uD800'],
    ['substituto solto (baixo)', '\uDC00'],
  ])('recusa invisível/malformado %s no nome e na mensagem', (_nome, c) => {
    expect(validarEntrega(comNome(`Maria${c}Souza`)).ok).toBe(false);
    expect(validarEntrega(comPresente(`Fe${c}liz`)).ok).toBe(false);
  });

  it('nome, logradouro, bairro e cidade exigem ao menos uma letra ou número', () => {
    const base = entregaValida();
    expect(validarEntrega(comNome('--')).ok).toBe(false);
    expect(validarEntrega(comNome('!!')).ok).toBe(false);
    expect(validarEntrega(comNome('  ..  ')).ok).toBe(false);
    expect(validarEntrega(comNome('J1')).ok).toBe(true);
    for (const campo of ['logradouro', 'bairro', 'cidade'] as const) {
      expect(validarEntrega({ ...base, endereco: { ...base.endereco, [campo]: '...' } })).toEqual({
        ok: false,
        erros: { [campo]: MENSAGENS_DE_ERRO[campo] },
      });
      expect(validarEntrega({ ...base, endereco: { ...base.endereco, [campo]: 'Rua 9' } }).ok).toBe(
        true,
      );
    }
    // O número e o complemento não exigem letra.
    expect(validarEntrega({ ...base, endereco: { ...base.endereco, numero: 's/n' } }).ok).toBe(
      true,
    );
  });

  it('aceita acentos, cedilha, apóstrofo, hífen e emoji', () => {
    expect(validarEntrega(comNome("João d'Ávila-Conceição")).ok).toBe(true);
    expect(validarEntrega(comPresente('Parabéns! 🎉🧀 Com carinho, ç')).ok).toBe(true);
  });

  it('e-mail: aceita o que a lista permite, em minúsculas, e punycode', () => {
    const r = (email: string) =>
      validarEntrega({ ...entregaValida(), cliente: { ...entregaValida().cliente, email } });
    const a = r('  Maria.Souza+loja@Email.COM.br ');
    expect(a.ok && a.valor.cliente.email).toBe('maria.souza+loja@email.com.br');
    expect(r("o'neil_1@sub-dominio.xn--exemplo-9ua.com").ok).toBe(true);
    expect(r(`${'a'.repeat(64)}@x.co`).ok).toBe(true);
    expect(r(`a@${'b'.repeat(63)}.com`).ok).toBe(true);
    expect(r('a!#$%&*+/=?^_`{|}~-b@x.co').ok).toBe(true);
  });

  it('telefone: DDD sem zero e sem dígito 0 na segunda posição', () => {
    const t = (telefone: string) =>
      validarEntrega({ ...entregaValida(), cliente: { ...entregaValida().cliente, telefone } }).ok;
    expect(t('(11) 91234-5678')).toBe(true);
    expect(t('(11) 1234-5678')).toBe(true);
    expect(t('(99) 91234-5678')).toBe(true);
    expect(t('(01) 91234-5678')).toBe(false);
    expect(t('0119123456')).toBe(false);
    expect(t('(10) 91234-5678')).toBe(false);
    expect(t('(11) 91234-56789')).toBe(false);
  });

  it('e-mail de 1 MB é recusado em menos de 50 ms', () => {
    const enorme = 'a'.repeat(1024 * 1024) + '@email.com';
    vi.useRealTimers();
    const inicio = performance.now();
    const r = validarEntrega({
      ...entregaValida(),
      cliente: { ...entregaValida().cliente, email: enorme },
    });
    const ms = performance.now() - inicio;
    expect(r).toEqual({ ok: false, erros: { email: MENSAGENS_DE_ERRO.email } });
    expect(ms).toBeLessThan(50);
  });

  it('textos gigantes (nome, mensagem, telefone, CEP) são recusados rápido', () => {
    vi.useRealTimers();
    const gigante = 'x'.repeat(1024 * 1024);
    const inicio = performance.now();
    const r = validarEntrega({
      cliente: { nome: gigante, email: 'a@b.co', telefone: gigante },
      endereco: { ...entregaValida().endereco, cep: gigante, logradouro: gigante },
      presente: { mensagem: gigante, dataDeEntrega: gigante },
    });
    expect(r.ok).toBe(false);
    expect(performance.now() - inicio).toBeLessThan(50);
  });

  it('e-mail com muitos pontos não causa backtracking', () => {
    vi.useRealTimers();
    const patologico = 'a@' + 'a.'.repeat(120) + '!'.repeat(10) + ' ';
    const inicio = performance.now();
    validarEntrega({
      ...entregaValida(),
      cliente: { ...entregaValida().cliente, email: patologico },
    });
    expect(performance.now() - inicio).toBeLessThan(50);
  });

  it('as mensagens de erro nunca contêm o valor digitado', () => {
    const r = validarEntrega(comNome('<script>alert(1)</script>\u0000'));
    expect(JSON.stringify(r)).not.toMatch(/script|alert/);
  });
});

describe('esquemaEntradaDoPedido', () => {
  const item = (quantidade: unknown) => ({
    slug: 'canastra-curado',
    formatoId: 'meia',
    quantidade,
  });
  const entrada = (extra: Record<string, unknown> = {}) => ({
    itens: [item(2)],
    presente: false,
    entrega: entregaValida(),
    pagamento: 'pix',
    ...extra,
  });
  const ok = (v: unknown) => z.safeParse(esquemaEntradaDoPedido, v).success;

  it('aceita a entrada completa', () => {
    expect(ok(entrada())).toBe(true);
    expect(ok(entrada({ pagamento: 'cartao' }))).toBe(true);
  });

  it('ignora preço e total enviados pelo cliente (chaves desconhecidas são removidas)', () => {
    const r = z.safeParse(
      esquemaEntradaDoPedido,
      entrada({ total: 1, itens: [{ ...item(1), preco: 1 }] }),
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.itens[0]).toEqual(item(1));
      expect('total' in r.data).toBe(false);
    }
  });

  it('recusa quantidade fora de 1–10 ou não inteira (sem consertar em silêncio)', () => {
    for (const q of [0, -1, 11, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2', null, 2 ** 53]) {
      expect(ok(entrada({ itens: [item(q)] })), String(q)).toBe(false);
    }
    expect(ok(entrada({ itens: [item(1)] }))).toBe(true);
    expect(ok(entrada({ itens: [item(10)] }))).toBe(true);
  });

  it('recusa 0 itens e mais de 30 linhas', () => {
    expect(ok(entrada({ itens: [] }))).toBe(false);
    expect(ok(entrada({ itens: Array.from({ length: 30 }, () => item(1)) }))).toBe(true);
    expect(ok(entrada({ itens: Array.from({ length: 31 }, () => item(1)) }))).toBe(false);
  });

  it('recusa pagamento fora de pix/cartao e presente que não é booleano', () => {
    for (const p of ['boleto', '', null, 'PIX', undefined]) {
      expect(ok(entrada({ pagamento: p }))).toBe(false);
    }
    expect(ok(entrada({ presente: 'true' }))).toBe(false);
  });

  it('recusa slug ou formatoId com mais de 64 caracteres', () => {
    expect(ok(entrada({ itens: [{ ...item(1), slug: 'a'.repeat(65) }] }))).toBe(false);
    expect(ok(entrada({ itens: [{ ...item(1), formatoId: 'a'.repeat(65) }] }))).toBe(false);
  });

  it('o esquema de entrega é o mesmo usado em validarEntrega', () => {
    expect(z.safeParse(esquemaEntrega, entregaValida()).success).toBe(true);
  });
});
