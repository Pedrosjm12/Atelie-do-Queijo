import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { LinkDaSacola } from '@/components/LinkDaSacola';
import { SacolaProvider } from '@/components/SacolaProvider';
import { resumoParaSacola } from '@/lib/catalogo';
import { CHAVE_DA_SACOLA, type ResumoParaSacola } from '@/lib/sacola';
import { ConteudoDaSacola } from './ConteudoDaSacola';
import { ID_DO_TITULO_DA_SACOLA } from './ids';

/** O texto de preço usa U+00A0 depois de "R$"; os testes comparam com espaço comum. */
const semNbsp = (texto: string | null | undefined) => (texto ?? '').replace(/\u00a0/g, ' ');

type Salvo = { slug: string; formatoId: string; quantidade: number };

function semear(itens: Salvo[], presente = false) {
  window.localStorage.setItem(CHAVE_DA_SACOLA, JSON.stringify({ v: 1, itens, presente }));
}

/** Catálogo real, com o preço do Brie 500 g trocado para montar subtotais exatos. */
function catalogoComBrieA(preco: number): readonly ResumoParaSacola[] {
  return resumoParaSacola().map((q) =>
    q.slug === 'brie-frances'
      ? { ...q, formatos: q.formatos.map((f) => (f.id === '500g' ? { ...f, preco } : f)) }
      : q,
  );
}

function renderizar(queijos: readonly ResumoParaSacola[] = resumoParaSacola()) {
  return render(
    <SacolaProvider>
      <h1 id={ID_DO_TITULO_DA_SACOLA} tabIndex={-1}>
        Sua sacola
      </h1>
      <LinkDaSacola />
      <ConteudoDaSacola queijos={queijos} />
    </SacolaProvider>,
  );
}

const subtotal = () =>
  semNbsp(within(resumo()).getByText('Subtotal').nextElementSibling?.textContent);

const resumo = () => screen.getByRole('region', { name: 'Resumo do pedido' });

beforeEach(() => {
  window.localStorage.clear();
});

describe('ConteudoDaSacola: frete grátis (P29, P38)', () => {
  it('17999 → "Faltam R$ 0,01 para o frete grátis."', async () => {
    semear([{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }]);
    renderizar(catalogoComBrieA(17999));
    expect(await screen.findByText(/Faltam/)).toBeInTheDocument();
    expect(semNbsp(resumo().textContent)).toContain('Faltam R$ 0,01 para o frete grátis.');
    expect(semNbsp(resumo().textContent)).toContain('R$ 179,99');
    expect(screen.queryByText('Frete grátis garantido.')).not.toBeInTheDocument();
  });

  it('18000 → "Frete grátis garantido."', async () => {
    semear([{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }]);
    renderizar(catalogoComBrieA(18000));
    expect(await screen.findByText('Frete grátis garantido.')).toBeInTheDocument();
    expect(screen.queryByText(/Faltam/)).not.toBeInTheDocument();
    expect(semNbsp(resumo().textContent)).toContain('R$ 180,00');
  });
});

describe('ConteudoDaSacola: sacola vazia', () => {
  it('mostra o texto e o link para a cave', async () => {
    renderizar();
    expect(await screen.findByText('Sua tábua ainda está vazia.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar a cave' })).toHaveAttribute(
      'href',
      '/queijos',
    );
    expect(screen.queryByRole('link', { name: 'Finalizar compra' })).not.toBeInTheDocument();
  });

  it('sem a sacola lida (pronta: false) não mostra "vazia" nem nada que dependa dela', () => {
    semear([{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }]);
    const html = renderToString(
      <SacolaProvider>
        <ConteudoDaSacola queijos={resumoParaSacola()} />
      </SacolaProvider>,
    );
    expect(html).not.toContain('vazia');
    expect(html).not.toContain('Explorar a cave');
    expect(html).not.toContain('Subtotal');
    expect(html).not.toContain('Brie');
  });

  it('item que o catálogo não reconhece é ignorado, sem quebrar', async () => {
    semear([{ slug: 'brie-frances', formatoId: '500g', quantidade: 1 }]);
    renderizar(resumoParaSacola().filter((q) => q.slug !== 'brie-frances'));
    // Sem o queijo no catálogo recebido, só o estado vazio aparece.
    expect(await screen.findByText('Sua tábua ainda está vazia.')).toBeInTheDocument();
  });
});

describe('ConteudoDaSacola: linhas', () => {
  it('mostra nome como link, "formato · peso", preço unitário e controles com o nome do item', async () => {
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 }]);
    renderizar();
    const link = await screen.findByRole('link', { name: 'Canastra curado' });
    expect(link).toHaveAttribute('href', '/queijos/canastra-curado');
    const linha = link.closest('li');
    if (!linha) throw new Error('linha');
    expect(semNbsp(linha.textContent)).toContain('Meia peça · ~500 g');
    expect(semNbsp(linha.textContent)).toContain('R$ 78,00');
    expect(
      within(linha).getByRole('group', { name: 'Quantidade de Canastra curado, Meia peça' }),
    ).toBeInTheDocument();
    expect(
      within(linha).getByRole('button', { name: 'Remover Canastra curado, Meia peça da sacola' }),
    ).toHaveTextContent('Remover');
    expect(semNbsp(resumo().textContent)).toContain('R$ 156,00');
  });

  it('o stepper atualiza o subtotal e o contador do cabeçalho', async () => {
    const usuario = userEvent.setup();
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }]);
    renderizar();
    await screen.findByRole('link', { name: 'Canastra curado' });
    expect(subtotal()).toBe('R$ 78,00');

    await usuario.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(subtotal()).toBe('R$ 156,00');
    expect(screen.getByRole('link', { name: 'Sacola 2 itens' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Diminuir quantidade' }));
    expect(subtotal()).toBe('R$ 78,00');
  });

  it('o + para no limite de 10 unidades', async () => {
    const usuario = userEvent.setup();
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 10 }]);
    renderizar();
    await screen.findByRole('link', { name: 'Canastra curado' });
    await usuario.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(subtotal()).toBe('R$ 780,00');
  });

  it('o botão principal leva para /checkout', async () => {
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }]);
    renderizar();
    expect(await screen.findByRole('link', { name: 'Finalizar compra' })).toHaveAttribute(
      'href',
      '/checkout',
    );
  });
});

describe('ConteudoDaSacola: remover e foco', () => {
  const dois: Salvo[] = [
    { slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 },
    { slug: 'brie-frances', formatoId: '500g', quantidade: 1 },
  ];

  it('tira a linha e leva o foco ao item que ocupa o lugar dela', async () => {
    const usuario = userEvent.setup();
    semear(dois);
    renderizar();
    await usuario.click(
      await screen.findByRole('button', { name: 'Remover Canastra curado, Meia peça da sacola' }),
    );
    expect(screen.queryByRole('link', { name: 'Canastra curado' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Brie francês' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Sacola 1 item' })).toBeInTheDocument();
  });

  it('removendo o último da lista, o foco vai para o item anterior', async () => {
    const usuario = userEvent.setup();
    semear(dois);
    renderizar();
    await usuario.click(await screen.findByRole('button', { name: /^Remover Brie francês/ }));
    expect(screen.getByRole('link', { name: 'Canastra curado' })).toHaveFocus();
  });

  it('removendo a última linha, o foco vai para o título e aparece a sacola vazia', async () => {
    const usuario = userEvent.setup();
    semear([dois[0]!]);
    renderizar();
    await usuario.click(await screen.findByRole('button', { name: /^Remover Canastra curado/ }));
    expect(screen.getByRole('heading', { name: 'Sua sacola' })).toHaveFocus();
    expect(screen.getByText('Sua tábua ainda está vazia.')).toBeInTheDocument();
  });
});

describe('ConteudoDaSacola: foco só quando a remoção valeu', () => {
  it('se a lista não ficou do tamanho esperado, o pedido de foco é descartado', async () => {
    const dois: Salvo[] = [
      { slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 },
      { slug: 'brie-frances', formatoId: '500g', quantidade: 1 },
    ];
    semear(dois);
    renderizar();
    const remover = await screen.findByRole('button', {
      name: 'Remover Canastra curado, Meia peça da sacola',
    });
    // No mesmo lote, outra aba devolve a sacola com os dois itens: a remoção não vale.
    act(() => {
      fireEvent.click(remover);
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: window.localStorage,
          key: CHAVE_DA_SACOLA,
          newValue: JSON.stringify({
            v: 1,
            itens: [{ ...dois[0]!, quantidade: 2 }, dois[1]!],
            presente: false,
          }),
        }),
      );
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Brie francês' })).not.toHaveFocus();

    // Uma remoção posterior de outra aba (também com 1 linha) não pode roubar o foco.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: window.localStorage,
          key: CHAVE_DA_SACOLA,
          newValue: JSON.stringify({ v: 1, itens: [dois[1]!], presente: false }),
        }),
      );
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Brie francês' })).not.toHaveFocus();
  });
});

describe('ConteudoDaSacola: embalagem para presente (P31)', () => {
  it('só aparece quando o pedido é presente e pode ser tirada', async () => {
    const usuario = userEvent.setup();
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }], true);
    renderizar();
    expect(await screen.findByText('Embalagem para presente')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Tirar a embalagem para presente' }));
    expect(screen.queryByText('Embalagem para presente')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DA_SACOLA) ?? '{}')).toMatchObject({
      presente: false,
    });
  });

  it('não aparece quando o pedido não é presente', async () => {
    semear([{ slug: 'canastra-curado', formatoId: 'meia', quantidade: 1 }]);
    renderizar();
    await screen.findByRole('link', { name: 'Canastra curado' });
    expect(screen.queryByText('Embalagem para presente')).not.toBeInTheDocument();
  });
});
