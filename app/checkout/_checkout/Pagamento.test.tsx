import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtendimentoProvider } from '@/components/Atendimento';
import { SacolaProvider } from '@/components/SacolaProvider';
import { resumoParaSacola } from '@/lib/catalogo';
import { calcularTotais } from '@/lib/commerce';
import { formatarPreco } from '@/lib/format';
import { MENSAGENS_DE_ERRO, intervaloDeEntrega } from '@/lib/pedido';
import { MENSAGEM_FORA_DE_AREA } from '@/lib/freteNaTela';
import { CHAVE_DA_SACOLA } from '@/lib/sacola';

const { consultarFrete, confirmarPedido, usePathname } = vi.hoisted(() => ({
  consultarFrete: vi.fn(),
  confirmarPedido: vi.fn(),
  usePathname: vi.fn<() => string>(),
}));
vi.mock('@/app/_acoes/frete', () => ({ consultarFrete }));
vi.mock('@/app/_acoes/pedido', () => ({ confirmarPedido }));
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

import { FluxoDoCheckout } from './FluxoDoCheckout';

const SUBTOTAL = 22495; // Brie francês, 500 g (acima de R$ 180: o frete sai grátis)
const SUBTOTAL_BAIXO = 4900; // Canastra curado, fração (abaixo de R$ 180: o frete conta)
const FRETE = 1500;
const ATENDIDO = { ok: true, resultado: { situacao: 'atendido', prazoDiasUteis: 3, valor: FRETE } };
const ATENDIDO_SEM_VALOR = {
  ok: true,
  resultado: { situacao: 'atendido', prazoDiasUteis: null, valor: null },
};

const TEXTO_DO_ERRO =
  'Não conseguimos confirmar o pagamento. Nada foi cobrado. Tente outra forma ou fale com a gente.';

function semear(
  presente = false,
  item = { slug: 'brie-frances', formatoId: '500g', quantidade: 1 },
) {
  window.localStorage.setItem(CHAVE_DA_SACOLA, JSON.stringify({ v: 1, itens: [item], presente }));
}

function semearBarata() {
  semear(false, { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 1 });
}

function renderizar() {
  return render(
    <SacolaProvider>
      <AtendimentoProvider>
        <FluxoDoCheckout queijos={resumoParaSacola()} />
      </AtendimentoProvider>
    </SacolaProvider>,
  );
}

const campo = (nome: string) => screen.getByLabelText(nome);
const confirmar = () => screen.getByRole('button', { name: 'Confirmar pedido' });
const sacolaSalva = () => JSON.parse(window.localStorage.getItem(CHAVE_DA_SACOLA) ?? 'null');
const resumoDoPedido = () => screen.getByRole('region', { name: 'Resumo do pedido' });
/** Nosso alerta de falha (sempre montado, vazio sem falha); o Next injeta outro `role=alert` fora do formulário. */
const alertaDaFalha = () => document.querySelector<HTMLElement>('form [role="alert"]')!;
const valorDe = (rotulo: string, dentro: HTMLElement) =>
  within(dentro).getByText(rotulo).nextSibling;

/** Preenche por `change` (digitar tecla a tecla custa ~2 s por campo); a digitação em si é testada no Fluxo. */
function preencher(rotulo: string, valor: string) {
  fireEvent.change(campo(rotulo), { target: { value: valor } });
}

async function irParaOPagamento(usuario: ReturnType<typeof userEvent.setup>, presente = false) {
  await screen.findByRole('heading', { name: 'Entrega' }, { timeout: 5000 });
  preencher('Nome completo', 'Maria Souza');
  preencher('E-mail', 'maria@exemplo.com');
  preencher('Telefone', '11912345678');
  preencher('CEP', '01310100');
  preencher('Rua ou avenida', 'Avenida Paulista');
  preencher('Número', '1578');
  preencher('Bairro', 'Bela Vista');
  preencher('Cidade', 'São Paulo');
  preencher('Estado', 'SP');
  if (presente) {
    preencher('Data de entrega', intervaloDeEntrega().min);
    preencher('Mensagem do cartão', '<img src=x onerror=alert(1)>\nFeliz aniversário');
  }
  await screen.findByText(/Chega refrigerado/, undefined, { timeout: 5000 });
  await usuario.click(screen.getByRole('button', { name: 'Continuar para o pagamento' }));
  await screen.findByRole('heading', { level: 2, name: 'Pagamento' }, { timeout: 5000 });
}

function totaisDoServidor() {
  return { subtotal: 111, frete: 0, descontoPix: 5, total: 106 };
}

beforeEach(() => {
  window.localStorage.clear();
  consultarFrete.mockReset();
  consultarFrete.mockResolvedValue(ATENDIDO);
  confirmarPedido.mockReset();
  usePathname.mockReturnValue('/checkout');
  semear();
});

describe('etapa 2: forma de pagamento e resumo', () => {
  it('mostra os dois rádios com o texto da spec, sem campo de cartão, CVV, CPF nem QR code', async () => {
    renderizar();
    await irParaOPagamento(userEvent.setup({ delay: null }));
    const grupo = screen.getByRole('group', { name: 'Forma de pagamento' });
    const pix = within(grupo).getByRole('radio', { name: 'Pix (5% de desconto)' });
    const cartao = within(grupo).getByRole('radio', { name: 'Cartão em até [n]x sem juros' });
    expect(pix).not.toBeChecked();
    expect(cartao).not.toBeChecked();
    expect(screen.queryByLabelText(/n[uú]mero do cart|cvv|validade|cpf/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para a entrega' })).toBeInTheDocument();
    expect(grupo.closest('form')).toHaveAttribute('method', 'post');
  });

  it('pagamento é obrigatório: sem escolha mostra o erro aprovado e não chama o servidor', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(confirmar());
    expect(await screen.findByText('Escolha Pix ou cartão.')).toBeInTheDocument();
    expect(MENSAGENS_DE_ERRO.pagamento).toBe('Escolha Pix ou cartão.');
    expect(confirmarPedido).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Pix (5% de desconto)' })).toHaveFocus(),
    );
    // Escolher uma forma tira o erro.
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    expect(screen.queryByText('Escolha Pix ou cartão.')).not.toBeInTheDocument();
  });

  it('trocar Pix por cartão muda o total e o desconto', async () => {
    semearBarata();
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    const resumo = resumoDoPedido();
    const pix = calcularTotais(SUBTOTAL_BAIXO, FRETE, 'pix');
    const cartao = calcularTotais(SUBTOTAL_BAIXO, FRETE, 'cartao');

    // Sem escolha: sem desconto.
    expect(within(resumo).queryByText('Desconto no Pix')).not.toBeInTheDocument();
    expect(valorDe('Subtotal', resumo)?.textContent).toBe(formatarPreco(SUBTOTAL_BAIXO));
    expect(valorDe('Frete', resumo)?.textContent).toBe(formatarPreco(FRETE));

    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    expect(valorDe('Desconto no Pix', resumo)?.textContent).toBe(
      `−${formatarPreco(pix.descontoPix)}`,
    );
    expect(valorDe('Total', resumo)?.textContent).toBe(formatarPreco(pix.total ?? 0));

    await usuario.click(screen.getByRole('radio', { name: 'Cartão em até [n]x sem juros' }));
    expect(within(resumo).queryByText('Desconto no Pix')).not.toBeInTheDocument();
    expect(valorDe('Total', resumo)?.textContent).toBe(formatarPreco(cartao.total ?? 0));
    expect(pix.total).not.toBe(cartao.total);
  });

  it('frete em lacuna: total em lacuna, nunca R$ 0,00 nem NaN', async () => {
    semearBarata();
    consultarFrete.mockResolvedValue(ATENDIDO_SEM_VALOR);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    const resumo = resumoDoPedido();
    expect(valorDe('Frete', resumo)).toHaveTextContent('R$ [PREÇO]');
    expect(valorDe('Total', resumo)).toHaveTextContent('R$ [PREÇO]');
    expect(resumo.textContent).not.toMatch(/NaN|R\$\s0,00/);
  });

  it('frete grátis (subtotal a partir de R$ 180) aparece como "Grátis"', async () => {
    consultarFrete.mockResolvedValue(ATENDIDO_SEM_VALOR);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    expect(valorDe('Frete', resumoDoPedido())).toHaveTextContent('Grátis');
    expect(valorDe('Subtotal', resumoDoPedido())?.textContent).toBe(formatarPreco(SUBTOTAL));
  });

  it('envia ao servidor só os itens, o presente, a entrega e o pagamento (sem preço nem total)', async () => {
    confirmarPedido.mockResolvedValue({
      ok: true,
      numero: 'AQ-123456',
      email: 'maria@exemplo.com',
      totais: totaisDoServidor(),
    });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    await usuario.click(confirmar());
    await waitFor(() => expect(confirmarPedido).toHaveBeenCalledTimes(1));
    expect(confirmarPedido).toHaveBeenCalledWith({
      itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }],
      presente: false,
      pagamento: 'pix',
      entrega: {
        cliente: { nome: 'Maria Souza', email: 'maria@exemplo.com', telefone: '(11) 91234-5678' },
        endereco: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1578',
          complemento: '',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
        },
        presente: null,
      },
    });
  });

  it('voltar para a entrega mantém os dados e a forma de pagamento escolhida', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Cartão em até [n]x sem juros' }));
    await usuario.click(screen.getByRole('button', { name: 'Voltar para a entrega' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Entrega' })).toBeInTheDocument();
    expect(campo('Nome completo')).toHaveValue('Maria Souza');
    await usuario.click(screen.getByRole('button', { name: 'Continuar para o pagamento' }));
    await screen.findByRole('heading', { level: 2, name: 'Pagamento' });
    expect(screen.getByRole('radio', { name: 'Cartão em até [n]x sem juros' })).toBeChecked();
  });
});

describe('etapa 2: presente', () => {
  it('mostra a mensagem do cartão como TEXTO (sem virar HTML) e a data de entrega', async () => {
    semear(true);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario, true);
    const resumo = resumoDoPedido();
    expect(document.querySelector('img')).toBeNull();
    const texto = within(resumo).getByText(/onerror=alert\(1\)/);
    expect(texto.textContent).toBe('<img src=x onerror=alert(1)>\nFeliz aniversário');
    expect(texto.className).toMatch(/textoDoCartao/); // white-space: pre-line (Checkout.module.css)
    const [ano, mes, dia] = intervaloDeEntrega().min.split('-');
    expect(within(resumo).getByText(`${dia}/${mes}/${ano}`)).toBeInTheDocument();
    expect(within(resumo).getByText('Embalar para presente')).toBeInTheDocument();
  });
});

describe('etapa 2: anúncios só para leitor de tela', () => {
  const anuncios = () =>
    Array.from(document.querySelectorAll<HTMLElement>('form p.sr-only[aria-live="polite"]'));

  it('trocar Pix por cartão anuncia o desconto e o total; as regiões ficam sempre montadas', async () => {
    semearBarata();
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    expect(anuncios().map((el) => el.textContent)).toEqual(['', '']);
    const pix = calcularTotais(SUBTOTAL_BAIXO, FRETE, 'pix');
    const cartao = calcularTotais(SUBTOTAL_BAIXO, FRETE, 'cartao');

    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    expect(anuncios()[0]!.textContent).toBe(
      `Pix escolhido. Desconto de ${formatarPreco(pix.descontoPix)}. Total ${formatarPreco(pix.total ?? 0)}.`,
    );
    await usuario.click(screen.getByRole('radio', { name: 'Cartão em até [n]x sem juros' }));
    expect(anuncios()[0]!.textContent).toBe(
      `Cartão escolhido. Sem desconto. Total ${formatarPreco(cartao.total ?? 0)}.`,
    );
  });

  it('com o frete em lacuna, o total anunciado é a lacuna, sem inventar valor', async () => {
    consultarFrete.mockResolvedValue(ATENDIDO_SEM_VALOR);
    semearBarata();
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Cartão em até [n]x sem juros' }));
    expect(anuncios()[0]!.textContent).toBe(
      'Cartão escolhido. Sem desconto. Total R$\u00A0[PREÇO].',
    );
  });

  it('enquanto confirma, anuncia "Confirmando o pedido…" e depois limpa', async () => {
    let liberar: (v: unknown) => void = () => {};
    confirmarPedido.mockImplementation(() => new Promise((resolve) => (liberar = resolve)));
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    await usuario.click(confirmar());
    await waitFor(() => expect(anuncios()[1]).toHaveTextContent('Confirmando o pedido…'));
    liberar({ ok: false, motivo: 'pagamento-recusado' });
    await waitFor(() => expect(anuncios()[1]).toBeEmptyDOMElement());
  });

  it('o alerta de falha existe vazio desde o início', async () => {
    renderizar();
    await irParaOPagamento(userEvent.setup({ delay: null }));
    expect(alertaDaFalha()).toBeEmptyDOMElement();
  });
});

describe('confirmar pedido', () => {
  async function confirmarComPix(usuario: ReturnType<typeof userEvent.setup>) {
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    await usuario.click(confirmar());
  }

  it('envio duplo: o segundo clique é ignorado e o botão fica aria-disabled enquanto pendente', async () => {
    let liberar: (v: unknown) => void = () => {};
    confirmarPedido.mockImplementation(() => new Promise((resolve) => (liberar = resolve)));
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await irParaOPagamento(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Pix (5% de desconto)' }));
    await usuario.dblClick(confirmar());
    await waitFor(() => expect(confirmar()).toHaveAttribute('aria-disabled', 'true'));
    await usuario.click(confirmar());
    expect(confirmarPedido).toHaveBeenCalledTimes(1);
    liberar({ ok: false, motivo: 'pagamento-recusado' });
    await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
    await waitFor(() => expect(confirmar()).not.toHaveAttribute('aria-disabled'));
  });

  it('sucesso: limpa a sacola, zera o formulário, mostra o e-mail e os totais do servidor, foca o título', async () => {
    confirmarPedido.mockResolvedValue({
      ok: true,
      numero: 'AQ-123456',
      email: 'servidor@exemplo.com',
      totais: totaisDoServidor(),
    });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);

    const titulo = await screen.findByRole('heading', {
      level: 2,
      name: 'Seu queijo já está sendo preparado.',
    });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(screen.getByText(/Enviamos os detalhes para/, { selector: 'p' }).textContent).toBe(
      'Enviamos os detalhes para servidor@exemplo.com. Você vai receber o código de rastreio assim que a caixa sair da cave.',
    );
    expect(
      within(screen.getByRole('list', { name: 'Etapas do pedido' })).getByText('3. Confirmação'),
    ).toHaveAttribute('aria-current', 'step');

    // Totais do servidor (valores que o cliente jamais calcularia).
    const totais = document.querySelector('dl') as HTMLElement;
    expect(valorDe('Subtotal', totais)).toHaveTextContent('R$ 1,11');
    expect(valorDe('Frete', totais)).toHaveTextContent('Grátis');
    expect(valorDe('Desconto no Pix', totais)).toHaveTextContent('R$ 0,05');
    expect(valorDe('Total', totais)).toHaveTextContent('R$ 1,06');

    // P36: sem número do pedido. Sem estado vazio por cima. Sem dado digitado na tela.
    const corpo = document.body.textContent ?? '';
    expect(corpo).not.toContain('AQ-123456');
    expect(corpo).not.toContain('Sua tábua ainda está vazia.');
    for (const digitado of ['Maria', 'Souza', 'Paulista', '1578', 'Bela Vista', '91234']) {
      expect(corpo).not.toContain(digitado);
    }
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );

    // A sacola foi limpa e nada digitado ficou no navegador.
    expect(sacolaSalva().itens).toEqual([]);
    const guardado =
      JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage });
    for (const digitado of ['maria', 'servidor', 'Souza', '01310', '1578']) {
      expect(guardado).not.toContain(digitado);
    }
    expect(document.cookie).toBe('');
  });

  const MOTIVOS = [
    ['pagamento-recusado', { ok: false, motivo: 'pagamento-recusado' }],
    ['indisponivel', { ok: false, motivo: 'indisponivel' }],
    ['motivo desconhecido', { ok: false, motivo: 'qualquer-coisa' }],
    ['dados-invalidos sem erros', { ok: false, motivo: 'dados-invalidos', erros: {} }],
  ] as const;

  for (const [nome, resposta] of MOTIVOS) {
    it(`erro (${nome}): role=alert com o texto literal, sacola intacta, sem confirmação`, async () => {
      confirmarPedido.mockResolvedValue(resposta);
      const antes = window.localStorage.getItem(CHAVE_DA_SACOLA);
      const usuario = userEvent.setup({ delay: null });
      renderizar();
      await confirmarComPix(usuario);
      await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
      const alerta = alertaDaFalha();
      expect(alerta.textContent).toBe(TEXTO_DO_ERRO);
      expect(window.localStorage.getItem(CHAVE_DA_SACOLA)).toBe(antes);
      expect(screen.queryByText('Seu queijo já está sendo preparado.')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Voltar para a sacola' })).not.toBeInTheDocument();
      // Dá para tentar de novo.
      await waitFor(() => expect(confirmar()).not.toHaveAttribute('aria-disabled'));
    });
  }

  it('erro de rede (a ação lança): mesma mensagem, sacola intacta', async () => {
    confirmarPedido.mockRejectedValue(new Error('Failed to find Server Action'));
    const antes = window.localStorage.getItem(CHAVE_DA_SACOLA);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
    expect(alertaDaFalha().textContent).toBe(TEXTO_DO_ERRO);
    expect(window.localStorage.getItem(CHAVE_DA_SACOLA)).toBe(antes);
  });

  it('"fale com a gente" abre o painel de atendimento', async () => {
    confirmarPedido.mockResolvedValue({ ok: false, motivo: 'pagamento-recusado' });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
    const alerta = alertaDaFalha();
    expect(screen.queryByRole('dialog', { name: 'Assistente do Ateliê' })).not.toBeInTheDocument();
    await usuario.click(within(alerta).getByRole('button', { name: 'fale com a gente' }));
    expect(screen.getByRole('dialog', { name: 'Assistente do Ateliê' })).toBeInTheDocument();
  });

  it('sacola inválida: mostra o erro e oferece voltar para a /sacola (sacola intacta)', async () => {
    confirmarPedido.mockResolvedValue({ ok: false, motivo: 'sacola-invalida' });
    const antes = window.localStorage.getItem(CHAVE_DA_SACOLA);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
    expect(alertaDaFalha().textContent).toBe(TEXTO_DO_ERRO);
    expect(screen.getByRole('link', { name: 'Voltar para a sacola' })).toHaveAttribute(
      'href',
      '/sacola',
    );
    expect(window.localStorage.getItem(CHAVE_DA_SACOLA)).toBe(antes);
  });

  it('dados inválidos com erros por campo: volta à etapa 1 com o resumo de erros focado', async () => {
    confirmarPedido.mockResolvedValue({
      ok: false,
      motivo: 'dados-invalidos',
      erros: { email: MENSAGENS_DE_ERRO.email },
    });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    await waitFor(() =>
      expect(
        within(resumo).getByRole('heading', { name: 'Revise os campos abaixo' }),
      ).toHaveFocus(),
    );
    expect(within(resumo).getByRole('link')).toHaveTextContent(
      `E-mail: ${MENSAGENS_DE_ERRO.email}`,
    );
    expect(campo('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(campo('Nome completo')).toHaveValue('Maria Souza');
    expect(document.querySelector('[role=alert]')).toBeNull();
    expect(sacolaSalva().itens).toHaveLength(1);
  });

  it('fora de área: volta à etapa 1 com o erro no CEP', async () => {
    confirmarPedido.mockResolvedValue({ ok: false, motivo: 'fora-de-area' });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(within(resumo).getByRole('link')).toHaveTextContent(`CEP: ${MENSAGEM_FORA_DE_AREA}`);
    expect(campo('CEP')).toHaveAttribute('aria-invalid', 'true');
    expect(sacolaSalva().itens).toHaveLength(1);
  });

  it('fora de área do servidor: o frete é reiniciado e o CEP é consultado de novo ao reenviar', async () => {
    confirmarPedido.mockResolvedValue({ ok: false, motivo: 'fora-de-area' });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(consultarFrete).toHaveBeenCalledTimes(1);
    await usuario.click(screen.getByRole('button', { name: 'Continuar para o pagamento' }));
    await screen.findByRole('heading', { level: 2, name: 'Pagamento' });
    expect(consultarFrete).toHaveBeenCalledTimes(2);
  });

  it('só o campo pagamento inválido: fica na etapa 2 com o erro do campo', async () => {
    confirmarPedido.mockResolvedValue({
      ok: false,
      motivo: 'dados-invalidos',
      erros: { pagamento: MENSAGENS_DE_ERRO.pagamento },
    });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    expect(await screen.findByText('Escolha Pix ou cartão.')).toBeInTheDocument();
    expect(alertaDaFalha()).toBeEmptyDOMElement();
  });

  it('depois de uma recusa, tentar de novo com sucesso confirma e some o alerta', async () => {
    confirmarPedido
      .mockResolvedValueOnce({ ok: false, motivo: 'pagamento-recusado' })
      .mockResolvedValueOnce({
        ok: true,
        numero: 'AQ-654321',
        email: 'maria@exemplo.com',
        totais: totaisDoServidor(),
      });
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await confirmarComPix(usuario);
    await waitFor(() => expect(alertaDaFalha()).not.toBeEmptyDOMElement());
    await usuario.click(confirmar());
    expect(await screen.findByText('Seu queijo já está sendo preparado.')).toBeInTheDocument();
    expect(document.querySelector('[role=alert]')).toBeNull();
    expect(sacolaSalva().itens).toEqual([]);
  });
});
