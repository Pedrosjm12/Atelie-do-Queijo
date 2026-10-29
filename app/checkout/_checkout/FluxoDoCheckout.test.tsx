import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { SacolaProvider } from '@/components/SacolaProvider';
import { resumoParaSacola } from '@/lib/catalogo';
import { MENSAGEM_DE_CEP_INVALIDO } from '@/lib/commerce';
import { MENSAGEM_FORA_DE_AREA } from '@/lib/freteNaTela';
import { MENSAGENS_DE_ERRO, hojeEmSaoPaulo, intervaloDeEntrega } from '@/lib/pedido';
import { CHAVE_DA_SACOLA } from '@/lib/sacola';

const { consultarFrete } = vi.hoisted(() => ({ consultarFrete: vi.fn() }));
vi.mock('@/app/_acoes/frete', () => ({ consultarFrete }));

import { FluxoDoCheckout } from './FluxoDoCheckout';

const ATENDIDO = {
  ok: true,
  resultado: { situacao: 'atendido', prazoDiasUteis: null, valor: null },
};
const FORA_DE_AREA = { ok: true, resultado: { situacao: 'fora-de-area' } };

function semear(presente = false) {
  window.localStorage.setItem(
    CHAVE_DA_SACOLA,
    JSON.stringify({
      v: 1,
      itens: [{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }],
      presente,
    }),
  );
}

function renderizar() {
  return render(
    <SacolaProvider>
      <FluxoDoCheckout queijos={resumoParaSacola()} />
    </SacolaProvider>,
  );
}

const campo = (nome: string) => screen.getByLabelText(nome);
const continuar = () => screen.getByRole('button', { name: 'Continuar para o pagamento' });
const resumoDeErros = () => screen.queryByRole('region', { name: 'Revise os campos abaixo' });

/** Por `change`: digitar tecla a tecla custa ~2 s por campo e a digitação tem testes próprios. */
function preencher(rotulo: string, valor: string) {
  fireEvent.change(campo(rotulo), { target: { value: valor } });
}

function preencherTudo() {
  preencher('Nome completo', 'Maria Souza');
  preencher('E-mail', 'maria@exemplo.com');
  preencher('Telefone', '11912345678');
  preencher('CEP', '01310100');
  preencher('Rua ou avenida', 'Avenida Paulista');
  preencher('Número', '1578');
  preencher('Bairro', 'Bela Vista');
  preencher('Cidade', 'São Paulo');
  preencher('Estado', 'SP');
}

const tituloDoResumo = () => screen.getByRole('heading', { name: 'Revise os campos abaixo' });

beforeEach(() => {
  window.localStorage.clear();
  consultarFrete.mockReset();
  consultarFrete.mockResolvedValue(ATENDIDO);
  semear();
});

describe('FluxoDoCheckout: estrutura', () => {
  it('mostra o indicador de etapas, o aviso literal e o título da etapa 1', async () => {
    renderizar();
    const etapas = await screen.findByRole('list', { name: 'Etapas do pedido' });
    const itens = within(etapas).getAllByRole('listitem');
    expect(itens.map((i) => i.textContent)).toEqual([
      '1. Entrega (etapa atual)',
      '2. Pagamento',
      '3. Confirmação',
    ]);
    expect(itens[0]).toHaveAttribute('aria-current', 'step');
    expect(etapas).toHaveAttribute('role', 'list');
    expect(itens[1]).not.toHaveAttribute('aria-current');
    expect(
      screen.getByText(
        'Enviamos de segunda a quarta, para que seu queijo nunca passe o fim de semana em trânsito.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Entrega' })).toBeInTheDocument();
  });

  it('campos com rótulo visível, autocomplete certo, 27 UFs, sem CPF nem cartão; form POST', async () => {
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    const esperado: [string, string | null][] = [
      ['Nome completo', 'name'],
      ['E-mail', 'email'],
      ['Telefone', 'tel-national'],
      ['CEP', 'postal-code'],
      ['Rua ou avenida', 'address-line1'],
      ['Complemento (opcional)', 'address-line2'],
      ['Bairro', 'address-level3'],
      ['Cidade', 'address-level2'],
      ['Estado', 'address-level1'],
    ];
    for (const [rotulo, auto] of esperado) {
      expect(campo(rotulo)).toHaveAttribute('autocomplete', auto);
    }
    expect(campo('CEP')).toHaveAttribute('inputmode', 'numeric');
    expect(campo('Telefone')).toHaveAttribute('inputmode', 'tel');
    expect(within(campo('Estado')).getAllByRole('option')).toHaveLength(28); // 27 UFs + "Selecione"
    expect(campo('Nome completo').closest('form')).toHaveAttribute('method', 'post');
    expect(screen.queryByLabelText(/cpf|cart[aã]o|cvv/i)).not.toBeInTheDocument();
  });

  it('aplica a máscara de CEP e de telefone', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    await usuario.type(campo('CEP'), '01310100');
    expect(campo('CEP')).toHaveValue('01310-100');
    await usuario.type(campo('Telefone'), '11912345678');
    expect(campo('Telefone')).toHaveValue('(11) 91234-5678');
  });

  it('sacola vazia: mostra o mesmo estado vazio da /sacola', async () => {
    window.localStorage.clear();
    renderizar();
    expect(await screen.findByText('Sua tábua ainda está vazia.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );
    expect(screen.queryByRole('list', { name: 'Etapas do pedido' })).not.toBeInTheDocument();
  });

  it('antes da leitura do localStorage (HTML do servidor) não mostra nada da sacola', () => {
    const html = renderToString(
      <SacolaProvider>
        <FluxoDoCheckout queijos={resumoParaSacola()} />
      </SacolaProvider>,
    );
    expect(html).not.toContain('Entrega');
    expect(html).not.toContain('vazia');
  });
});

describe('FluxoDoCheckout: validação e resumo de erros', () => {
  it('tudo vazio: foca o resumo, lista os campos com link e marca cada campo (P17)', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    await usuario.click(continuar());

    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    await waitFor(() => expect(tituloDoResumo()).toHaveFocus());
    expect(tituloDoResumo()).toHaveAttribute('tabindex', '-1');
    expect(resumo).not.toHaveAttribute('tabindex');
    const links = within(resumo).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      `Nome completo: ${MENSAGENS_DE_ERRO.nome}`,
      `E-mail: ${MENSAGENS_DE_ERRO.email}`,
      `Telefone: ${MENSAGENS_DE_ERRO.telefone}`,
      `CEP: ${MENSAGENS_DE_ERRO.cep}`,
      `Rua ou avenida: ${MENSAGENS_DE_ERRO.logradouro}`,
      `Número: ${MENSAGENS_DE_ERRO.numero}`,
      `Bairro: ${MENSAGENS_DE_ERRO.bairro}`,
      `Cidade: ${MENSAGENS_DE_ERRO.cidade}`,
      `Estado: ${MENSAGENS_DE_ERRO.uf}`,
    ]);
    expect(links[0]).toHaveAttribute('href', '#checkout-nome');

    const nome = campo('Nome completo');
    expect(nome).toHaveAttribute('aria-invalid', 'true');
    const descricao = nome.getAttribute('aria-describedby');
    expect(descricao).toBeTruthy();
    expect(document.getElementById(descricao ?? '')).toHaveTextContent(MENSAGENS_DE_ERRO.nome);
    expect(campo('Complemento (opcional)')).not.toHaveAttribute('aria-invalid');

    await usuario.click(links[1] as HTMLElement);
    expect(campo('E-mail')).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();
  });

  it('e-mail inválido: bloqueia e mostra o texto aprovado; corrigir tira o erro', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    preencher('E-mail', 'maria@');
    await usuario.click(continuar());

    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(within(resumo).getAllByRole('link')).toHaveLength(1);
    expect(campo('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(MENSAGENS_DE_ERRO.email, { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();

    preencher('E-mail', 'maria@exemplo.com');
    expect(campo('E-mail')).not.toHaveAttribute('aria-invalid');
    expect(resumoDeErros()).not.toBeInTheDocument();
  });

  it('CEP incompleto no envio: erro do CEP, sem consultar o frete', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencher('CEP', '0131');
    await usuario.click(continuar());
    expect(await screen.findByText(MENSAGEM_DE_CEP_INVALIDO, { selector: 'p' })).toBeVisible();
    expect(consultarFrete).not.toHaveBeenCalled();
  });
});

describe('FluxoDoCheckout: frete', () => {
  it('consulta ao completar o CEP e mostra o prazo; resposta de CEP antigo é descartada', async () => {
    const usuario = userEvent.setup({ delay: null });
    let liberarPrimeira: (v: unknown) => void = () => {};
    consultarFrete.mockImplementationOnce(
      () => new Promise((resolve) => (liberarPrimeira = resolve)),
    );
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    await usuario.type(campo('CEP'), '01310100');
    expect(consultarFrete).toHaveBeenCalledWith('01310-100');
    // O CEP muda antes de a primeira resposta chegar; a segunda consulta responde "atendido".
    await usuario.type(campo('CEP'), '{Backspace}1');
    expect(await screen.findByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
    liberarPrimeira(FORA_DE_AREA);
    await Promise.resolve();
    expect(screen.queryByText(MENSAGEM_FORA_DE_AREA)).not.toBeInTheDocument();
    expect(screen.getByText('Chega refrigerado em até [N] dias úteis.')).toBeVisible();
  });

  it('fora de área impede avançar, lista o CEP no resumo e marca o campo', async () => {
    const usuario = userEvent.setup({ delay: null });
    consultarFrete.mockResolvedValue(FORA_DE_AREA);
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    expect(await screen.findByText(MENSAGEM_FORA_DE_AREA)).toBeVisible();
    expect(campo('CEP')).toHaveAttribute('aria-invalid', 'true');
    await usuario.click(continuar());

    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(within(resumo).getByRole('link')).toHaveTextContent(`CEP: ${MENSAGEM_FORA_DE_AREA}`);
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();
  });

  it('falha ao consultar: mostra a mensagem genérica e tenta de novo ao enviar', async () => {
    const usuario = userEvent.setup({ delay: null });
    consultarFrete.mockRejectedValueOnce(new Error('rede'));
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    expect(
      await screen.findByText('Não conseguimos calcular agora. Tente de novo em instantes.'),
    ).toBeVisible();
    await usuario.click(continuar()); // a nova tentativa responde "atendido"
    expect(await screen.findByRole('heading', { name: 'Pagamento' })).toBeInTheDocument();
    expect(consultarFrete).toHaveBeenCalledTimes(2);
  });

  it('duplo clique em Continuar não duplica a consulta nem avança duas vezes', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    await screen.findByText('Chega refrigerado em até [N] dias úteis.');
    await usuario.dblClick(continuar());
    expect(await screen.findByRole('heading', { name: 'Pagamento' })).toBeInTheDocument();
    expect(consultarFrete).toHaveBeenCalledTimes(1);
  });
});

describe('FluxoDoCheckout: avançar e voltar', () => {
  it('tudo válido: avança, foca o título da etapa 2 e voltar mantém os dados', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    await usuario.click(continuar());

    const titulo = await screen.findByRole('heading', { level: 2, name: 'Pagamento' });
    await waitFor(() => expect(titulo).toHaveFocus());
    const etapas = screen.getByRole('list', { name: 'Etapas do pedido' });
    expect(within(etapas).getByText('2. Pagamento')).toHaveAttribute('aria-current', 'step');

    await usuario.click(screen.getByRole('button', { name: 'Voltar para a entrega' }));
    const entrega = await screen.findByRole('heading', { level: 2, name: 'Entrega' });
    await waitFor(() => expect(entrega).toHaveFocus());
    expect(campo('Nome completo')).toHaveValue('Maria Souza');
    expect(campo('E-mail')).toHaveValue('maria@exemplo.com');
    expect(campo('Telefone')).toHaveValue('(11) 91234-5678');
    expect(campo('CEP')).toHaveValue('01310-100');
    expect(campo('Estado')).toHaveValue('SP');
  });

  it('não grava nenhum dado digitado no navegador (P37)', async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    await usuario.click(continuar());
    await screen.findByRole('heading', { name: 'Pagamento' });
    const guardado =
      JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage });
    expect(guardado).not.toContain('maria');
    expect(guardado).not.toContain('Souza');
    expect(guardado).not.toContain('01310');
    expect(document.cookie).toBe('');
  });
});

describe('FluxoDoCheckout: presente', () => {
  it('sem presente não há cartão nem data', async () => {
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    expect(screen.queryByLabelText('Mensagem do cartão')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Data de entrega')).not.toBeInTheDocument();
    expect(screen.queryByText(/nota fiscal/i)).not.toBeInTheDocument();
  });

  async function abrirComPresente() {
    window.localStorage.clear();
    semear(true);
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    await screen.findByRole('heading', { name: 'Entrega' });
    preencherTudo();
    return usuario;
  }

  it('mostra cartão (sem maxlength), data com min/max de P34 e a nota fiscal', async () => {
    window.localStorage.clear();
    semear(true);
    renderizar();
    const cartao = await screen.findByLabelText('Mensagem do cartão');
    expect(cartao.tagName).toBe('TEXTAREA');
    expect(cartao).not.toHaveAttribute('maxlength');
    const data = screen.getByLabelText('Data de entrega');
    const { min, max } = intervaloDeEntrega();
    expect(data).toHaveAttribute('type', 'date');
    expect(data).toHaveAttribute('min', min);
    expect(data).toHaveAttribute('max', max);
    expect(screen.getByText(/nota fiscal sem valor visível ao presenteado/i)).toBeVisible();
  });

  it('mensagem de 201 caracteres bloqueia; 200 passa', async () => {
    const usuario = await abrirComPresente();
    fireEvent.change(campo('Data de entrega'), { target: { value: intervaloDeEntrega().min } });
    fireEvent.change(campo('Mensagem do cartão'), { target: { value: 'a'.repeat(201) } });
    expect(screen.getAllByText('201 de 200 caracteres')).toHaveLength(1); // só o visível
    await usuario.click(continuar());
    const resumo = await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(within(resumo).getByRole('link')).toHaveTextContent(
      `Mensagem do cartão: ${MENSAGENS_DE_ERRO.mensagem}`,
    );
    expect(campo('Mensagem do cartão')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();

    fireEvent.change(campo('Mensagem do cartão'), { target: { value: 'a'.repeat(200) } });
    await usuario.click(continuar());
    expect(await screen.findByRole('heading', { name: 'Pagamento' })).toBeInTheDocument();
  });

  it('mensagem de 7 linhas bloqueia', async () => {
    const usuario = await abrirComPresente();
    fireEvent.change(campo('Data de entrega'), { target: { value: intervaloDeEntrega().min } });
    fireEvent.change(campo('Mensagem do cartão'), { target: { value: 'a\nb\nc\nd\ne\nf\ng' } });
    await usuario.click(continuar());
    await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(campo('Mensagem do cartão')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();
  });

  it('data de hoje é recusada; sem data também; amanhã passa', async () => {
    const usuario = await abrirComPresente();
    await usuario.click(continuar());
    await screen.findByRole('region', { name: 'Revise os campos abaixo' });
    expect(campo('Data de entrega')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(campo('Data de entrega'), { target: { value: hojeEmSaoPaulo() } });
    await usuario.click(continuar());
    expect(
      await screen.findByText(MENSAGENS_DE_ERRO.dataDeEntrega, { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pagamento' })).not.toBeInTheDocument();

    fireEvent.change(campo('Data de entrega'), { target: { value: intervaloDeEntrega().min } });
    await usuario.click(continuar());
    expect(await screen.findByRole('heading', { name: 'Pagamento' })).toBeInTheDocument();
  });

  it('o contador só é anunciado nos marcos 160, 190 e ao exceder (aria-live estável)', async () => {
    await abrirComPresente();
    const regiao = () =>
      document.querySelector<HTMLElement>('[data-presente] [aria-live="polite"]')!;
    const digitar = (n: number) =>
      fireEvent.change(campo('Mensagem do cartão'), { target: { value: 'a'.repeat(n) } });
    expect(regiao()).toBeEmptyDOMElement();
    digitar(159);
    expect(regiao()).toBeEmptyDOMElement();
    digitar(160);
    const marco160 = regiao().textContent;
    expect(marco160).toBe('160 caracteres ou mais, de 200.');
    digitar(175);
    expect(regiao().textContent).toBe(marco160); // não muda a cada caractere
    digitar(190);
    expect(regiao().textContent).toBe('190 caracteres ou mais, de 200.');
    digitar(200);
    expect(regiao().textContent).toBe('190 caracteres ou mais, de 200.');
    digitar(201);
    expect(regiao().textContent).toBe('Limite excedido: no máximo 200 caracteres e 6 linhas.');
    digitar(10);
    expect(regiao()).toBeEmptyDOMElement();
  });

  it('o cartão aponta para a dica estável "Até 200 caracteres e 6 linhas."', async () => {
    window.localStorage.clear();
    semear(true);
    renderizar();
    const cartao = await screen.findByLabelText('Mensagem do cartão');
    const ids = (cartao.getAttribute('aria-describedby') ?? '').split(' ');
    const dica = ids.map((id) => document.getElementById(id)?.textContent);
    expect(dica).toContain('Até 200 caracteres e 6 linhas.');
    fireEvent.change(cartao, { target: { value: 'a'.repeat(180) } });
    expect(document.getElementById(ids.find((id) => id.endsWith('-dica')) ?? '')?.textContent).toBe(
      'Até 200 caracteres e 6 linhas.',
    );
  });

  it('mostra a mensagem como texto, não como HTML', async () => {
    await abrirComPresente();
    fireEvent.change(campo('Mensagem do cartão'), {
      target: { value: '<img src=x onerror=alert(1)>' },
    });
    expect(document.querySelector('img')).toBeNull();
    expect(campo('Mensagem do cartão')).toHaveValue('<img src=x onerror=alert(1)>');
  });
});
