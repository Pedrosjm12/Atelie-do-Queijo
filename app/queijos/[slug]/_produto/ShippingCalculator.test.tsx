import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENSAGEM_DE_CEP_INVALIDO } from '@/lib/commerce';

const { consultarFrete } = vi.hoisted(() => ({ consultarFrete: vi.fn() }));
vi.mock('@/app/_acoes/frete', () => ({ consultarFrete }));

import { MENSAGEM_DE_FRETE_INDISPONIVEL, ShippingCalculator } from './ShippingCalculator';

const campo = () => screen.getByLabelText('Calcule o frete e o prazo');
const calcular = () => screen.getByRole('button', { name: 'Calcular' });
const regiao = () => document.querySelector('[aria-live="polite"]') as HTMLElement;

beforeEach(() => {
  consultarFrete.mockReset();
});

describe('ShippingCalculator', () => {
  it('é um formulário POST com campo de CEP configurado e botão de envio', () => {
    render(<ShippingCalculator />);
    const formulario = campo().closest('form');
    expect(formulario).toHaveAttribute('method', 'post');
    expect(campo()).toHaveAttribute('maxlength', '9');
    expect(campo()).toHaveAttribute('autocomplete', 'postal-code');
    expect(campo()).toHaveAttribute('inputmode', 'numeric');
    expect(campo()).toHaveAttribute('placeholder', '00000-000');
    expect(calcular()).toHaveAttribute('type', 'submit');
    expect(regiao()).toBeEmptyDOMElement();
  });

  it('aplica a máscara a cada digitação e ignora o que não é dígito', async () => {
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310');
    expect(campo()).toHaveValue('01310');
    await usuario.type(campo(), '1a00999');
    expect(campo()).toHaveValue('01310-100');
  });

  it('mantém o cursor no lugar ao editar no meio do CEP', async () => {
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    const input = campo() as HTMLInputElement;
    // Apaga o 2º dígito: "01310-100" -> "0310-100" -> "03101-00"; o cursor fica depois do "0".
    input.setSelectionRange(2, 2);
    await usuario.keyboard('{Backspace}');
    expect(input).toHaveValue('03101-00');
    expect(input.selectionStart).toBe(1);
    // Digita no começo: o cursor acompanha o dígito, não vai para o fim.
    await usuario.keyboard('9');
    expect(input).toHaveValue('09310-100');
    expect(input.selectionStart).toBe(2);
  });

  it('CEP atendido: mostra o prazo com [N] enquanto ele for null, em região aria-live', async () => {
    consultarFrete.mockResolvedValue({
      ok: true,
      resultado: { situacao: 'atendido', prazoDiasUteis: null, valor: null },
    });
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());

    expect(consultarFrete).toHaveBeenCalledExactlyOnceWith('01310-100');
    const texto = await screen.findByText('Chega refrigerado em até [N] dias úteis.');
    expect(regiao()).toContainElement(texto);
    expect(campo()).not.toHaveAttribute('aria-invalid');
  });

  it('com prazo conhecido, mostra o número (singular em 1)', async () => {
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    consultarFrete.mockResolvedValue({
      ok: true,
      resultado: { situacao: 'atendido', prazoDiasUteis: 2, valor: null },
    });
    await usuario.click(calcular());
    expect(await screen.findByText('Chega refrigerado em até 2 dias úteis.')).toBeInTheDocument();
    consultarFrete.mockResolvedValue({
      ok: true,
      resultado: { situacao: 'atendido', prazoDiasUteis: 1, valor: null },
    });
    await usuario.click(calcular());
    expect(await screen.findByText('Chega refrigerado em até 1 dia útil.')).toBeInTheDocument();
  });

  it('fora de área: texto da spec, sem campo de e-mail (P9/P15)', async () => {
    consultarFrete.mockResolvedValue({ ok: true, resultado: { situacao: 'fora-de-area' } });
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '00500000');
    await usuario.click(calcular());

    expect(
      await screen.findByText(
        'Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /e-mail/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('input')).toHaveLength(1);
  });

  it('Enter no campo envia', async () => {
    consultarFrete.mockResolvedValue({ ok: true, resultado: { situacao: 'fora-de-area' } });
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '00500000{Enter}');
    await waitFor(() => expect(consultarFrete).toHaveBeenCalledTimes(1));
  });

  it.each(['', '0131', '01310-10'])(
    'CEP inválido %j: mensagem do P25, aria-invalid, aria-describedby, foco e sem chamar a ação',
    async (digitado) => {
      const usuario = userEvent.setup();
      render(<ShippingCalculator />);
      if (digitado) await usuario.type(campo(), digitado);
      await usuario.click(calcular());

      const mensagem = screen.getByText(MENSAGEM_DE_CEP_INVALIDO);
      expect(campo()).toHaveAttribute('aria-invalid', 'true');
      expect(campo().getAttribute('aria-describedby')).toBe(regiao().id);
      expect(regiao()).toContainElement(mensagem);
      expect(campo()).toHaveFocus();
      expect(consultarFrete).not.toHaveBeenCalled();
    },
  );

  it('cep-invalido vindo do servidor mostra a mesma mensagem', async () => {
    consultarFrete.mockResolvedValue({ ok: false, erro: 'cep-invalido' });
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());
    expect(await screen.findByText(MENSAGEM_DE_CEP_INVALIDO)).toBeInTheDocument();
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
  });

  it('digitar de novo limpa o erro e o aria-invalid', async () => {
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.click(calcular());
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
    await usuario.type(campo(), '0');
    expect(campo()).not.toHaveAttribute('aria-invalid');
    expect(regiao()).toBeEmptyDOMElement();
  });

  it.each([
    [
      'ação que lança (rede, ação não encontrada)',
      () => consultarFrete.mockRejectedValue(new Error('x')),
    ],
    [
      'falha interna do servidor',
      () => consultarFrete.mockResolvedValue({ ok: false, erro: 'indisponivel' }),
    ],
  ])('%s: mensagem genérica (P25) e nova tentativa possível', async (_nome, preparar) => {
    preparar();
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());

    expect(await screen.findByText(MENSAGEM_DE_FRETE_INDISPONIVEL)).toBeInTheDocument();
    expect(campo()).not.toHaveAttribute('aria-invalid');
    expect(calcular()).not.toHaveAttribute('aria-disabled');

    consultarFrete.mockResolvedValue({ ok: true, resultado: { situacao: 'fora-de-area' } });
    await usuario.click(calcular());
    expect(await screen.findByText(/Ainda não chegamos/)).toBeInTheDocument();
    expect(screen.queryByText(MENSAGEM_DE_FRETE_INDISPONIVEL)).not.toBeInTheDocument();
  });

  it('calculando: botão aria-disabled e sem novo envio; depois volta ao normal', async () => {
    let concluir: (valor: unknown) => void = () => {};
    consultarFrete.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());

    expect(calcular()).toHaveAttribute('aria-disabled', 'true');
    await usuario.click(calcular());
    await usuario.type(campo(), '{Enter}');
    expect(consultarFrete).toHaveBeenCalledTimes(1);

    concluir({ ok: true, resultado: { situacao: 'fora-de-area' } });
    expect(await screen.findByText(/Ainda não chegamos/)).toBeInTheDocument();
    expect(calcular()).not.toHaveAttribute('aria-disabled');
  });

  it('calculando: anuncia "Calculando…" só para leitor de tela, na região viva', async () => {
    let concluir: (valor: unknown) => void = () => {};
    consultarFrete.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());

    const aviso = screen.getByText('Calculando…');
    expect(regiao()).toContainElement(aviso);
    expect(aviso).toHaveClass('sr-only');

    concluir({ ok: true, resultado: { situacao: 'fora-de-area' } });
    expect(await screen.findByText(/Ainda não chegamos/)).toBeInTheDocument();
    expect(screen.queryByText('Calculando…')).not.toBeInTheDocument();
  });

  it('CEP corrigido durante o cálculo: a resposta antiga é descartada', async () => {
    let concluir: (valor: unknown) => void = () => {};
    consultarFrete.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const usuario = userEvent.setup();
    render(<ShippingCalculator />);
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());
    await usuario.type(campo(), '{Backspace}');
    expect(campo()).toHaveValue('01310-10');

    await act(async () => {
      concluir({
        ok: true,
        resultado: { situacao: 'atendido', prazoDiasUteis: 2, valor: null },
      });
    });
    expect(regiao()).toBeEmptyDOMElement();
    expect(calcular()).not.toHaveAttribute('aria-disabled');
  });

  it('CEP inválido do servidor: não rouba o foco se a pessoa já foi para outro lugar', async () => {
    let concluir: (valor: unknown) => void = () => {};
    consultarFrete.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const usuario = userEvent.setup();
    render(
      <>
        <ShippingCalculator />
        <button type="button">Outro</button>
      </>,
    );
    await usuario.type(campo(), '01310100');
    await usuario.click(calcular());
    await usuario.click(screen.getByRole('button', { name: 'Outro' }));

    await act(async () => {
      concluir({ ok: false, erro: 'cep-invalido' });
    });
    expect(await screen.findByText(MENSAGEM_DE_CEP_INVALIDO)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outro' })).toHaveFocus();
  });
});
