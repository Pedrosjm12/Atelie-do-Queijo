import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  carregarAssistente,
  TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE,
  type Assistente,
} from '@/lib/assistant';
import { FORMATOS_DO_CANASTRA_NO_CHAT } from '@/lib/cartoesDoChat';
import { TEXTO_DA_CAVE_FECHADA, TEXTO_DO_HORARIO } from '@/lib/horario';
import { AVISO_DE_NOVA_ABA } from '@/lib/whatsapp';
import { AtendimentoProvider } from './Atendimento';
import { SacolaProvider, TEXTO_ADICIONADO, useEstadoDaSacola } from './SacolaProvider';
import { SupportFab } from './SupportFab';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// O motor real por padrão; cada teste pode trocar a PRÓXIMA chamada (promessa adiada ou rejeitada).
vi.mock('@/lib/assistant', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('@/lib/assistant')>();
  return { ...original, carregarAssistente: vi.fn(original.carregarAssistente) };
});

function promessaAdiada<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (erro: unknown) => void;
  const promessa = new Promise<T>((ok, erro) => {
    resolver = ok;
    rejeitar = erro;
  });
  return { promessa, resolver, rejeitar };
}

const NUMERO = '5520900000000';
const FRASE_DO_PROTOTIPO = 'Quero presentear alguém que adora vinho tinto.';

type Usuario = ReturnType<typeof userEvent.setup>;

function SacolaVista() {
  const { sacola } = useEstadoDaSacola();
  return (
    <p data-testid="sacola">
      {sacola.itens.map((i) => `${i.slug}:${i.formatoId}:${i.quantidade}`).join(',')}|
      {sacola.presente ? 'presente' : 'sem presente'}
    </p>
  );
}

async function abrir(numero: string | null = NUMERO): Promise<Usuario> {
  window.localStorage.clear();
  const usuario = userEvent.setup();
  render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={numero}>
        <SacolaVista />
        <SupportFab />
      </AtendimentoProvider>
    </SacolaProvider>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
  await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
  return usuario;
}

/** Escreve no campo de mensagem e envia com Enter. */
async function digitar(usuario: Usuario, texto: string) {
  const campo = screen.getByLabelText('Escreva sua mensagem');
  await usuario.click(campo);
  await usuario.paste(texto);
  await usuario.keyboard('{Enter}');
}

const dialogo = () => screen.getByRole('dialog', { name: 'Assistente do Ateliê' });
const links = () => Array.from(dialogo().querySelectorAll<HTMLAnchorElement>('a[href*="wa.me"]'));
const textoDoLink = (a: HTMLAnchorElement) => decodeURIComponent(a.href.split('?text=')[1] ?? '');
const gruposDeRespostas = () =>
  within(dialogo()).queryAllByRole('group', { name: 'Respostas sugeridas' });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SupportPanel: conversa', () => {
  it('rola a conversa até o fim ao abrir: suave, ou instantâneo com movimento reduzido', async () => {
    const rolar = vi.fn();
    const original = Element.prototype.scrollTo;
    Element.prototype.scrollTo = rolar;
    const matchMediaOriginal = window.matchMedia;
    try {
      for (const reduzido of [false, true]) {
        window.matchMedia = ((consulta: string) => ({
          matches: reduzido && consulta.includes('prefers-reduced-motion'),
        })) as typeof window.matchMedia;
        rolar.mockClear();
        await abrir();
        expect(rolar).toHaveBeenCalledTimes(1);
        expect(rolar).toHaveBeenCalledWith(
          expect.objectContaining({ behavior: reduzido ? 'auto' : 'smooth' }),
        );
        cleanup();
      }
    } finally {
      Element.prototype.scrollTo = original;
      window.matchMedia = matchMediaOriginal;
    }
  });

  it('rola de novo a cada resposta nova', async () => {
    const rolar = vi.fn();
    const original = Element.prototype.scrollTo;
    Element.prototype.scrollTo = rolar;
    try {
      const usuario = await abrir();
      rolar.mockClear();
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Sugira um queijo' }));
      await waitFor(() => expect(rolar).toHaveBeenCalledTimes(1));
    } finally {
      Element.prototype.scrollTo = original;
    }
  });

  it('abre só com a saudação e as três respostas rápidas (P4)', async () => {
    await abrir();
    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(within(log).getByText(/Olá! Sou o assistente do Ateliê do Queijo/)).toBeVisible();
    for (const nome of ['Sugira um queijo', 'Montar uma tábua', 'Onde está meu pedido?']) {
      expect(within(log).getByRole('button', { name: nome })).toBeInTheDocument();
    }
    expect(gruposDeRespostas()).toHaveLength(1);
    expect(within(log).queryByText('BRASIL · CANASTRA, MG')).not.toBeInTheDocument();
    expect(within(dialogo()).getByText('Responde na hora, 24 horas')).toBeInTheDocument();
    expect(within(dialogo()).getByText('Prefere falar com uma pessoa?')).toBeInTheDocument();
    expect(within(dialogo()).getByPlaceholderText('Escreva sua mensagem…')).toBeInTheDocument();
  });

  it('identifica quem fala, nomeia o log e agrupa as respostas sugeridas', async () => {
    const usuario = await abrir();
    await digitar(usuario, FRASE_DO_PROTOTIPO);
    await screen.findByText('Sim, com cartão');
    const log = screen.getByRole('log', { name: 'Conversa' });
    for (const prefixo of within(log).getAllByText('Assistente:')) {
      expect(prefixo).toHaveClass('sr-only');
    }
    expect(within(log).getByText('Você:')).toHaveClass('sr-only');
    expect(within(log).getByRole('group', { name: 'Respostas sugeridas' })).toBeInTheDocument();
  });

  it('reproduz o roteiro do protótipo (§8.2, itens 3 a 7) ao digitar a frase do item 3', async () => {
    const usuario = await abrir();
    await digitar(usuario, FRASE_DO_PROTOTIPO);
    const d = dialogo();

    expect(await within(d).findByText('BRASIL · CANASTRA, MG')).toBeInTheDocument();
    expect(within(d).getByText(FRASE_DO_PROTOTIPO)).toBeInTheDocument();
    expect(
      within(d).getByText(
        'Ótima ocasião! Com tinto, um queijo curado e intenso costuma brilhar. Minha sugestão:',
      ),
    ).toBeInTheDocument();
    expect(d).toHaveTextContent(/a partir de R\$\s49,00/);
    expect(within(d).getByRole('img', { name: /Miniatura 3D/ })).toBeInTheDocument();
    expect(
      within(d).getByText('Quer que eu inclua embalagem de presente e um cartão com mensagem?'),
    ).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Sim, com cartão' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Ver outras opções' })).toBeInTheDocument();
    // O grupo inicial saiu: só o último aceita clique.
    expect(gruposDeRespostas()).toHaveLength(1);
    expect(within(d).queryByRole('button', { name: 'Sugira um queijo' })).not.toBeInTheDocument();
    // O campo foi esvaziado e mantém o foco.
    await waitFor(() => expect(screen.getByLabelText('Escreva sua mensagem')).toHaveValue(''));
    expect(screen.getByLabelText('Escreva sua mensagem')).toHaveFocus();
  });

  it('resposta rápida: eco do cliente, resposta do motor e foco no campo', async () => {
    const usuario = await abrir();
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Sugira um queijo' }));

    const log = screen.getByRole('log');
    await waitFor(() => expect(within(log).getByText('Você:')).toBeInTheDocument());
    expect(within(log).getByText('Sugira um queijo', { selector: 'p' })).toBeInTheDocument();
    expect(await within(log).findByRole('group', { name: 'Respostas sugeridas' })).toBeVisible();
    expect(gruposDeRespostas()).toHaveLength(1);
    expect(screen.getByLabelText('Escreva sua mensagem')).toHaveFocus();
  });

  it('mostra cartões de qualquer queijo (A.6 decorativa a 84 px) com o link do produto', async () => {
    const usuario = await abrir();
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Montar uma tábua' }));
    const brie = await within(dialogo()).findByRole('link', { name: 'Ver Brie francês em 3D' });
    expect(brie).toHaveAttribute('href', '/queijos/brie-frances');
    const cartao = brie.closest('article');
    expect(cartao).toHaveTextContent('FRANÇA · IMPORTADO');
    expect(cartao?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(within(cartao as HTMLElement).queryByRole('img')).not.toBeInTheDocument();
    // O Canastra da tábua usa a miniatura A.7.
    expect(within(dialogo()).getByRole('img', { name: /Miniatura 3D/ })).toBeInTheDocument();
  });

  it('Enter envia; campo vazio ou só com espaços não gera mensagem; o limite vai em maxLength', async () => {
    const usuario = await abrir();
    const campo = screen.getByLabelText('Escreva sua mensagem');
    expect(campo).toHaveAttribute('maxlength', String(TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE));

    await usuario.type(campo, '{Enter}');
    await usuario.type(campo, '   {Enter}');
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Enviar' }));
    expect(within(dialogo()).queryByText('Você:')).not.toBeInTheDocument();

    await digitar(usuario, 'oi');
    expect(await within(dialogo()).findByText('Você:')).toBeInTheDocument();
    expect(within(dialogo()).getByText('oi')).toBeInTheDocument();
  });

  it('o texto digitado entra como texto, nunca como HTML', async () => {
    const usuario = await abrir();
    const perigoso = '<img src=x onerror=alert(1)> <b>negrito</b>';
    await digitar(usuario, perigoso);
    expect(await within(dialogo()).findByText(perigoso)).toBeInTheDocument();
    expect(dialogo().querySelector('b, img[src="x"]')).toBeNull();
  });

  it('a conversa continua ao fechar e reabrir o painel (P51)', async () => {
    const usuario = await abrir();
    await digitar(usuario, FRASE_DO_PROTOTIPO);
    await within(dialogo()).findByText('Sim, com cartão');

    await usuario.click(screen.getByRole('button', { name: 'Fechar atendimento' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    expect(within(dialogo()).getByText(FRASE_DO_PROTOTIPO)).toBeInTheDocument();
    expect(within(dialogo()).getByRole('button', { name: 'Sim, com cartão' })).toBeInTheDocument();
  });

  it('Sim, com cartão pergunta o formato e põe o presente na sacola (P46)', async () => {
    const usuario = await abrir();
    await digitar(usuario, FRASE_DO_PROTOTIPO);
    await usuario.click(await within(dialogo()).findByRole('button', { name: 'Sim, com cartão' }));

    const escolhido = FORMATOS_DO_CANASTRA_NO_CHAT[1];
    if (!escolhido) throw new Error('formato');
    expect(screen.getByTestId('sacola')).toHaveTextContent('|sem presente');
    await usuario.click(await within(dialogo()).findByRole('button', { name: escolhido.rotulo }));

    await waitFor(() =>
      expect(screen.getByTestId('sacola')).toHaveTextContent(
        `canastra-curado:${escolhido.id}:1|presente`,
      ),
    );
    expect(gruposDeRespostas()).toHaveLength(1);
    // O aviso visual da sacola fica fora do <dialog> (inerte): a confirmação também entra no log.
    expect(
      within(screen.getByRole('log', { name: 'Conversa' })).getByText(TEXTO_ADICIONADO),
    ).toBeVisible();
  });

  it('o log rolável entra na ordem do Tab (WCAG 2.1.1)', async () => {
    await abrir();
    expect(screen.getByRole('log', { name: 'Conversa' })).toHaveAttribute('tabindex', '0');
  });
});

describe('SupportPanel: texto digitado nunca se perde', () => {
  const doCliente = () =>
    within(screen.getByRole('log', { name: 'Conversa' }))
      .queryAllByText(/./, { selector: 'p' })
      .filter((p) => p.querySelector('.sr-only')?.textContent === 'Você: ')
      .map((p) => p.textContent?.replace('Você: ', ''));

  it('enquanto o motor não chega, as entradas ficam em ordem', async () => {
    const adiada = promessaAdiada<Assistente>();
    vi.mocked(carregarAssistente).mockImplementationOnce(() => adiada.promessa);
    const usuario = await abrir();

    await usuario.click(within(dialogo()).getByRole('button', { name: 'Sugira um queijo' }));
    await digitar(usuario, 'oi');
    // Nada foi respondido ainda: o texto segue no campo.
    expect(screen.getByLabelText('Escreva sua mensagem')).toHaveValue('oi');

    adiada.resolver(
      await vi
        .importActual<typeof import('@/lib/roteiro')>('@/lib/roteiro')
        .then((m) => m.assistenteDeterministico),
    );
    await waitFor(() => expect(doCliente()).toEqual(['Sugira um queijo', 'oi']));
    await waitFor(() => expect(screen.getByLabelText('Escreva sua mensagem')).toHaveValue(''));
  });

  it('se o motor falhar, o texto permanece no campo e o reenvio funciona', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const adiada = promessaAdiada<Assistente>();
    vi.mocked(carregarAssistente).mockImplementationOnce(() => adiada.promessa);
    const usuario = await abrir();

    await digitar(usuario, 'oi');
    adiada.rejeitar(new Error('chunk falhou'));
    await waitFor(() => expect(erro).toHaveBeenCalled());
    const campo = screen.getByLabelText('Escreva sua mensagem');
    expect(campo).toHaveValue('oi');
    expect(doCliente()).toEqual([]);

    await usuario.keyboard('{Enter}');
    await waitFor(() => expect(doCliente()).toEqual(['oi']));
    await waitFor(() => expect(campo).toHaveValue(''));
    erro.mockRestore();
  });
});

describe('SupportPanel: WhatsApp (P49)', () => {
  it('o botão da faixa e o da aba são links wa.me em nova aba, com a mensagem geral', async () => {
    await abrir();
    expect(links()).toHaveLength(2);
    for (const a of links()) {
      expect(a.href.startsWith(`https://wa.me/${NUMERO}?text=`)).toBe(true);
      expect(textoDoLink(a)).toBe(
        'Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.',
      );
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a).toHaveAccessibleDescription(AVISO_DE_NOVA_ABA);
    }
    const aba = within(dialogo()).getByRole('tabpanel', { name: 'Assistente', hidden: true });
    expect(within(aba).getByRole('link', { name: 'Falar com um queijista' })).toBeInTheDocument();
  });

  it('a mensagem do botão acompanha o contexto: produto sugerido, depois pedido informado', async () => {
    const usuario = await abrir();
    await digitar(usuario, FRASE_DO_PROTOTIPO);
    await within(dialogo()).findByText('Sim, com cartão');
    for (const a of links()) {
      expect(textoDoLink(a)).toBe('Olá! Tenho uma dúvida sobre o Canastra curado.');
    }

    await digitar(usuario, 'Meu pedido AQ-123456');
    await within(dialogo()).findByText(/Vou chamar um queijista da nossa equipe/);
    for (const a of links()) {
      expect(textoDoLink(a)).toBe('Olá! Quero falar sobre o pedido nº AQ-123456.');
    }
  });

  it('nenhum texto livre digitado vai para a URL', async () => {
    const usuario = await abrir();
    await digitar(usuario, 'quero falar com um atendente, meu cpf é 123.456.789-00');
    await within(dialogo()).findByText(/Vou chamar um queijista da nossa equipe/);
    for (const a of links()) {
      expect(decodeURIComponent(a.href)).not.toMatch(/cpf|123\.456/);
    }
  });

  it('sem número (null), nenhum link wa.me no painel; a faixa e o horário continuam', async () => {
    const usuario = await abrir(null);
    expect(links()).toHaveLength(0);
    expect(within(dialogo()).queryByRole('link', { name: /queijista/ })).not.toBeInTheDocument();
    // Sem número, a faixa inteira (texto, horário e botão) sai; o horário segue na aba Queijista.
    expect(within(dialogo()).queryByText('Prefere falar com uma pessoa?')).not.toBeInTheDocument();
    expect(dialogo().querySelector('[role="tabpanel"][hidden]')).toHaveTextContent(
      /Seg a sex|Nossa cave está fechada/,
    );
    await digitar(usuario, 'quero falar com um atendente');
    await within(dialogo()).findByText(/Vou chamar um queijista da nossa equipe/);
    expect(links()).toHaveLength(0);
  });
});

describe('SupportPanel: horário da aba Queijista (P5; §8.3)', () => {
  async function abrirNaAba(instante: string, numero: string | null = NUMERO) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(instante));
    const usuario = await abrir(numero);
    await usuario.click(screen.getByRole('tab', { name: 'Queijista (WhatsApp)' }));
    return { usuario, aba: screen.getByRole('tabpanel', { name: 'Queijista (WhatsApp)' }) };
  }

  it('terça 10h (São Paulo): mostra a linha de horário e o botão', async () => {
    const { aba } = await abrirNaAba('2026-11-10T10:00:00-03:00');
    expect(within(aba).getByText(TEXTO_DO_HORARIO)).toBeVisible();
    expect(within(aba).queryByText(TEXTO_DA_CAVE_FECHADA)).not.toBeInTheDocument();
    expect(within(aba).getByRole('link', { name: 'Falar com um queijista' })).toBeVisible();
  });

  it.each([
    ['sábado 15h00', '2026-11-07T15:00:00-03:00'],
    ['domingo 11h', '2026-11-08T11:00:00-03:00'],
    ['terça 8h59', '2026-11-10T08:59:00-03:00'],
  ])('%s: cave fechada no lugar da linha, e o botão continua', async (_nome, instante) => {
    const { aba } = await abrirNaAba(instante);
    expect(within(aba).getByText(TEXTO_DA_CAVE_FECHADA)).toBeVisible();
    expect(within(aba).queryByText(TEXTO_DO_HORARIO)).not.toBeInTheDocument();
    expect(within(aba).getByRole('link', { name: 'Falar com um queijista' })).toBeVisible();
  });

  it('recalcula ao trocar de aba, mas não enquanto a pessoa lê', async () => {
    const { usuario, aba } = await abrirNaAba('2026-11-10T17:59:00-03:00');
    expect(within(aba).getByText(TEXTO_DO_HORARIO)).toBeVisible();

    // Passa das 18h com a aba aberta: nada muda sozinho.
    vi.setSystemTime(new Date('2026-11-10T18:01:00-03:00'));
    expect(within(aba).getByText(TEXTO_DO_HORARIO)).toBeVisible();

    await usuario.click(screen.getByRole('tab', { name: 'Assistente' }));
    await usuario.click(screen.getByRole('tab', { name: 'Queijista (WhatsApp)' }));
    const nova = screen.getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });
    expect(within(nova).getByText(TEXTO_DA_CAVE_FECHADA)).toBeVisible();
  });

  it('sem número, a aba mantém o texto do horário e não tem botão', async () => {
    const { aba } = await abrirNaAba('2026-11-08T11:00:00-03:00', null);
    expect(within(aba).getByText(TEXTO_DA_CAVE_FECHADA)).toBeVisible();
    expect(within(aba).queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('SupportPanel: abas', () => {
  it('setas, Home e End trocam e movem o foco; só a ativa entra no Tab', async () => {
    const usuario = await abrir();
    const lista = screen.getByRole('tablist', { name: 'Como prefere conversar?' });
    const [assistente, queijista] = within(lista).getAllByRole('tab');
    if (!assistente || !queijista) throw new Error('abas ausentes');

    expect(assistente).toHaveAttribute('aria-selected', 'true');
    expect(assistente).toHaveAttribute('tabindex', '0');
    expect(queijista).toHaveAttribute('tabindex', '-1');
    expect(queijista).toHaveTextContent('Queijista (WhatsApp)');

    assistente.focus();
    await usuario.keyboard('{ArrowRight}');
    expect(queijista).toHaveFocus();
    expect(queijista).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('log')).not.toBeInTheDocument();

    await usuario.keyboard('{ArrowRight}');
    expect(assistente).toHaveFocus();
    expect(screen.getByRole('log')).toBeInTheDocument();

    await usuario.keyboard('{End}');
    expect(queijista).toHaveFocus();
    await usuario.keyboard('{Home}');
    expect(assistente).toHaveFocus();
    await usuario.keyboard('{ArrowLeft}');
    expect(queijista).toHaveFocus();
  });
});
