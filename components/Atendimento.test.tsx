import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider, BotaoAbrirAtendimento, useAtendimento } from './Atendimento';
import { SacolaProvider } from './SacolaProvider';
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

const NUMERO = '5520900000000';

function renderizar(numero: string | null = NUMERO) {
  window.localStorage.clear();
  return render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={numero}>
        <EstadoAberto />
        <BotaoAbrirAtendimento className="rodape">Fale conosco</BotaoAbrirAtendimento>
        <BotaoAbrirAtendimento variante="principal" tamanho="compacto">
          Pedir ajuda
        </BotaoAbrirAtendimento>
        <SupportFab />
      </AtendimentoProvider>
    </SacolaProvider>,
  );
}

const FRASE_DO_PROTOTIPO = 'Quero presentear alguém que adora vinho tinto.';

/** Escreve no campo de mensagem e envia com Enter. */
async function digitar(usuario: ReturnType<typeof userEvent.setup>, texto: string) {
  const campo = screen.getByLabelText('Escreva sua mensagem');
  await usuario.click(campo);
  await usuario.paste(texto);
  await usuario.keyboard('{Enter}');
}

const painel = () => screen.queryByRole('dialog', { name: 'Assistente do Ateliê' });

async function abrirPainel() {
  const usuario = userEvent.setup();
  renderizar();
  await usuario.click(screen.getByRole('button', { name: 'Abrir atendimento' }));
  await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
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
      await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
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
      await usuario.click(await screen.findByRole('button', { name: 'Fechar atendimento' }));
      expect(gatilho).toHaveFocus();
    }
  });

  it('fecha pelo evento close do <dialog> (tecla Esc) e devolve o foco', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const gatilho = screen.getByRole('button', { name: 'Fale conosco' });
    await usuario.click(gatilho);
    await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });

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
    await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
    await digitar(usuario, FRASE_DO_PROTOTIPO);

    const link = await screen.findByRole('link', { name: 'Ver Canastra curado em 3D' });
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
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <main id="conteudo" tabIndex={-1} />
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    const gatilho = screen.getByRole('button', { name: 'Fale conosco' });
    await usuario.click(gatilho);
    await screen.findByRole('dialog', { name: 'Assistente do Ateliê' });
    expect(painel()).toBeInTheDocument();
    // O jsdom não move o foco para o <dialog>; o navegador move (o e2e cobre).
    screen.getByRole('button', { name: 'Fechar atendimento' }).focus();

    // searchParams não entram no pathname: nada muda para o provider.
    rerender(
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <main id="conteudo" tabIndex={-1} />
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    expect(painel()).toBeInTheDocument();

    usePathname.mockReturnValue('/queijos');
    rerender(
      <SacolaProvider>
        <AtendimentoProvider numeroDoWhatsApp={null}>
          <main id="conteudo" tabIndex={-1} />
          <BotaoAbrirAtendimento>Fale conosco</BotaoAbrirAtendimento>
        </AtendimentoProvider>
      </SacolaProvider>,
    );
    expect(painel()).not.toBeInTheDocument();
    expect(gatilho).not.toHaveFocus();
    expect(document.getElementById('conteudo')).toHaveFocus();
  });

  it('exige o provider', () => {
    expect(() => render(<SupportFab />)).toThrow('AtendimentoProvider');
  });
});
