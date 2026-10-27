import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider, BotaoAbrirAtendimento, useAtendimento } from './Atendimento';
import { SupportFab } from './SupportFab';

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn<() => string>() }));
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

beforeEach(() => {
  usePathname.mockReturnValue('/');
});

function EstadoAberto() {
  const { aberto } = useAtendimento();
  return <p>{aberto ? 'estado: aberto' : 'estado: fechado'}</p>;
}

function renderizar() {
  return render(
    <AtendimentoProvider>
      <EstadoAberto />
      <BotaoAbrirAtendimento className="rodape">Fale conosco</BotaoAbrirAtendimento>
      <BotaoAbrirAtendimento variante="principal" tamanho="compacto">
        Pedir ajuda
      </BotaoAbrirAtendimento>
      <SupportFab />
    </AtendimentoProvider>,
  );
}

const painel = () => screen.queryByRole('dialog', { name: 'Assistente do Ateliê' });

async function abrirPainel() {
  const usuario = userEvent.setup();
  renderizar();
  await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
  return usuario;
}

describe('Atendimento', () => {
  it('começa fechado e não monta o conteúdo do painel', () => {
    renderizar();
    expect(painel()).not.toBeInTheDocument();
    expect(screen.getByText('estado: fechado')).toBeInTheDocument();
    expect(screen.queryByText('Responde na hora, 24 horas')).not.toBeInTheDocument();
  });

  it('os três gatilhos anunciam um diálogo e abrem o painel', async () => {
    const usuario = userEvent.setup();
    renderizar();

    for (const nome of ['Fale conosco', 'Pedir ajuda', 'Abrir atendimento']) {
      const gatilho = screen.getByRole('button', { name: nome });
      expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
      expect(gatilho).toHaveAttribute('type', 'button');

      await usuario.click(gatilho);
      expect(painel()).toBeInTheDocument();
      expect(screen.getByText('estado: aberto')).toBeInTheDocument();

      await usuario.click(screen.getByRole('button', { name: 'Fechar atendimento' }));
      expect(painel()).not.toBeInTheDocument();
    }
  });

  it('devolve o foco ao gatilho que abriu o painel', async () => {
    const usuario = userEvent.setup();
    renderizar();

    for (const nome of ['Fale conosco', 'Pedir ajuda', 'Abrir atendimento']) {
      const gatilho = screen.getByRole('button', { name: nome });
      await usuario.click(gatilho);
      await usuario.click(screen.getByRole('button', { name: 'Fechar atendimento' }));
      expect(gatilho).toHaveFocus();
    }
  });

  it('fecha pelo evento close do <dialog> (tecla Esc) e devolve o foco', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const gatilho = screen.getByRole('button', { name: 'Fale conosco' });
    await usuario.click(gatilho);

    // No navegador o Esc fecha o <dialog> e dispara "close"; o e2e cobre a tecla de verdade.
    (screen.getByRole('dialog') as HTMLDialogElement).close();

    expect(painel()).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('o cartão navega para o produto e fecha o painel sem devolver o foco', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const gatilho = screen.getByRole('button', { name: 'Pedir ajuda' });
    await usuario.click(gatilho);

    const link = screen.getByRole('link', { name: 'Ver Canastra curado em 3D' });
    expect(link).toHaveAttribute('href', '/queijos/canastra-curado');
    // O jsdom não implementa a navegação: silencia só o comportamento padrão do clique.
    link.addEventListener('click', (evento) => evento.preventDefault(), { capture: true });
    await usuario.click(link);

    expect(painel()).not.toBeInTheDocument();
    expect(gatilho).not.toHaveFocus();
  });

  it('um arrasto que começa dentro do painel e termina no fundo não o fecha', async () => {
    const usuario = await abrirPainel();
    const dialogo = screen.getByRole('dialog');
    const campo = screen.getByLabelText('Escreva sua mensagem');

    fireEvent.pointerDown(campo);
    fireEvent.click(dialogo);
    expect(painel()).toBeInTheDocument();

    // Um clique de verdade no fundo (início e fim no próprio <dialog>) fecha.
    fireEvent.pointerDown(dialogo);
    fireEvent.click(dialogo);
    expect(painel()).not.toBeInTheDocument();
    expect(usuario).toBeDefined();
  });

  it('fecha ao mudar de rota e leva o foco a #conteudo, não ao gatilho; não fecha ao re-renderizar sem mudar o caminho', async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(
      <AtendimentoProvider>
        <main id="conteudo" tabIndex={-1} />
        <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
      </AtendimentoProvider>,
    );
    const gatilho = screen.getByRole('button', { name: 'Fale conosco' });
    await usuario.click(gatilho);
    expect(painel()).toBeInTheDocument();
    // O jsdom não move o foco para o <dialog>; o navegador move (o e2e cobre).
    screen.getByRole('button', { name: 'Fechar atendimento' }).focus();

    // searchParams não entram no pathname: nada muda para o provider.
    rerender(
      <AtendimentoProvider>
        <main id="conteudo" tabIndex={-1} />
        <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
      </AtendimentoProvider>,
    );
    expect(painel()).toBeInTheDocument();

    usePathname.mockReturnValue('/queijos');
    rerender(
      <AtendimentoProvider>
        <main id="conteudo" tabIndex={-1} />
        <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
      </AtendimentoProvider>,
    );
    expect(painel()).not.toBeInTheDocument();
    expect(gatilho).not.toHaveFocus();
    expect(document.getElementById('conteudo')).toHaveFocus();
  });

  it('exige o provider', () => {
    expect(() => render(<SupportFab />)).toThrow('AtendimentoProvider');
  });
});

describe('SupportPanel', () => {
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
        const { unmount } = renderizar();
        await userEvent.setup().click(screen.getByRole('button', { name: 'Abrir atendimento' }));
        expect(rolar).toHaveBeenCalledTimes(1);
        expect(rolar).toHaveBeenCalledWith(
          expect.objectContaining({ behavior: reduzido ? 'auto' : 'smooth' }),
        );
        unmount();
      }
    } finally {
      Element.prototype.scrollTo = original;
      window.matchMedia = matchMediaOriginal;
    }
  });

  async function abrir() {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
    return usuario;
  }

  it('identifica quem fala, nomeia o log e agrupa as respostas sugeridas', async () => {
    await abrir();
    const log = screen.getByRole('log', { name: 'Conversa' });
    for (const prefixo of within(log).getAllByText('Assistente:')) {
      expect(prefixo).toHaveClass('sr-only');
    }
    expect(within(log).getByText('Você:')).toHaveClass('sr-only');
    expect(
      within(log).getAllByRole('group', { name: 'Respostas sugeridas' }).length,
    ).toBeGreaterThan(0);
  });

  it('mostra o roteiro do protótipo, o cartão do Canastra e a faixa de passagem', async () => {
    await abrir();
    const dialogo = screen.getByRole('dialog', { name: 'Assistente do Ateliê' });

    expect(within(dialogo).getByText('Responde na hora, 24 horas')).toBeInTheDocument();
    expect(within(dialogo).getByText(/Olá! Sou o assistente do Ateliê do Queijo/)).toBeVisible();
    expect(
      within(dialogo).getByText('Quero presentear alguém que adora vinho tinto.'),
    ).toBeInTheDocument();
    expect(within(dialogo).getByText('BRASIL · CANASTRA, MG')).toBeInTheDocument();
    expect(dialogo).toHaveTextContent(/a partir de R\$\s49,00/);
    expect(within(dialogo).getByRole('img', { name: /Miniatura 3D/ })).toBeInTheDocument();
    expect(within(dialogo).getByText('Prefere falar com uma pessoa?')).toBeInTheDocument();
    expect(
      within(dialogo).getAllByText('Seg a sex, 9h às 18h · sáb, 9h às 15h').length,
    ).toBeGreaterThan(0);
    expect(within(dialogo).getByLabelText('Escreva sua mensagem')).toBeInTheDocument();
    expect(within(dialogo).getByPlaceholderText('Escreva sua mensagem…')).toBeInTheDocument();
  });

  it('controles sem ação ficam focáveis e anunciam aria-disabled com o aviso', async () => {
    const usuario = await abrir();
    const dialogo = screen.getByRole('dialog');

    for (const nome of ['Sugira um queijo', 'Sim, com cartão', 'Enviar']) {
      const botao = within(dialogo).getByRole('button', { name: nome });
      expect(botao).toHaveAttribute('aria-disabled', 'true');
      expect(botao).toHaveAccessibleDescription('Atendimento disponível em breve');
      await usuario.click(botao);
    }
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Enter no campo não envia nada nem recarrega a página', async () => {
    const usuario = await abrir();
    const campo = screen.getByLabelText('Escreva sua mensagem');
    await usuario.type(campo, 'Oi{Enter}');
    expect(campo).toHaveValue('Oi');
  });

  it('abas: setas, Home e End trocam e movem o foco; só a ativa entra no Tab', async () => {
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

    const painelDaAba = screen.getByRole('tabpanel', { name: 'Queijista (WhatsApp)' });
    expect(within(painelDaAba).getByText('Seg a sex, 9h às 18h · sáb, 9h às 15h')).toBeVisible();
    expect(
      within(painelDaAba).getByRole('button', { name: 'Falar com um queijista' }),
    ).toHaveAttribute('aria-disabled', 'true');
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
