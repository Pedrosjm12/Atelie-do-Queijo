import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkDaSacola } from '@/components/LinkDaSacola';
import { SacolaProvider } from '@/components/SacolaProvider';
import { formatoDeVitrine, listarQueijos } from '@/lib/catalogo';
import { maiorFormatoEmGramas } from '@/lib/quiz';
import { Quiz, type ResumoDoQueijo } from './Quiz';

const RESUMOS: readonly ResumoDoQueijo[] = listarQueijos().map((q) => ({
  slug: q.slug,
  nome: q.nome,
  formatoIdDeVitrine: formatoDeVitrine(q).id,
  ilustracao: q.ilustracao,
  maiorFormatoEmGramas: maiorFormatoEmGramas(q.formatos),
}));

function montar() {
  window.localStorage.clear();
  return {
    usuario: userEvent.setup(),
    ...render(
      <SacolaProvider>
        <Quiz queijos={RESUMOS} />
        <LinkDaSacola />
      </SacolaProvider>,
    ),
  };
}

const proxima = () => screen.getByRole('button', { name: 'Próxima pergunta' });

describe('Quiz', () => {
  it('começa na pergunta 1 de 3, sem nada selecionado e com o botão desabilitado (P8)', () => {
    montar();
    expect(screen.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 1 DE 3')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Não sabe por onde começar?' }),
    ).toBeVisible();
    expect(screen.getByRole('group', { name: /Você prefere sabores…/ })).toBeInTheDocument();
    for (const rotulo of ['Suaves e amanteigados', 'Equilibrados', 'Intensos e marcantes']) {
      expect(screen.getByRole('button', { name: rotulo })).toHaveAttribute('aria-pressed', 'false');
    }
    expect(proxima()).toBeDisabled();
  });

  it('marca uma só opção por vez com aria-pressed e habilita o botão', async () => {
    const { usuario } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Equilibrados' }));
    await usuario.click(screen.getByRole('button', { name: 'Intensos e marcantes' }));
    expect(screen.getByRole('button', { name: 'Equilibrados' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Intensos e marcantes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(proxima()).toBeEnabled();
  });

  it('percorre as três perguntas só com o teclado, move o foco e mostra o resultado', async () => {
    const { usuario } = montar();

    // Pergunta 1: Tab até a primeira opção; Enter escolhe.
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Suaves e amanteigados' })).toHaveFocus();
    await usuario.keyboard('{Tab}{Tab}{Enter}'); // Intensos e marcantes
    expect(screen.getByRole('button', { name: 'Intensos e marcantes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await usuario.tab(); // Próxima pergunta
    expect(proxima()).toHaveFocus();
    await usuario.keyboard('{Enter}');

    // Pergunta 2: o foco vai para a pergunta e nada vem marcado.
    expect(screen.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 2 DE 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveFocus();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Vai servir como…');
    expect(screen.getByRole('button', { name: 'Presente' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(proxima()).toBeDisabled();
    await usuario.keyboard('{Tab}{Tab}{Tab}{Enter}'); // Para mim, com calma
    await usuario.tab();
    await usuario.keyboard('{Enter}');

    // Pergunta 3: o botão final muda de texto.
    expect(screen.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 3 DE 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Próxima pergunta' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver meu queijo' })).toBeDisabled();
    await usuario.keyboard('{Tab}{Enter}'); // Vinho tinto
    await usuario.keyboard('{Tab}{Tab}{Tab}{Tab}{Enter}'); // Ver meu queijo

    // Resultado: intensos + para mim + tinto => Canastra curado (desempate pela ordem).
    expect(screen.getByText('SEU QUEIJO É')).toBeInTheDocument();
    const titulo = screen.getByRole('heading', { level: 2, name: 'Canastra curado' });
    expect(titulo).toHaveFocus();
    expect(screen.getByText('[POR QUE COMBINA COM VOCÊ]')).toBeInTheDocument();
    const adicionar = screen.getByRole('button', { name: 'Adicionar à sacola' });
    expect(adicionar).not.toHaveAttribute('aria-disabled');
    await usuario.click(adicionar);
    // P24: o formato do menor preço (Fração do Canastra), 1 unidade.
    expect(screen.getByRole('link', { name: 'Sacola 1 item' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('atelie:sacola:v1') ?? '{}').itens).toEqual([
      { slug: 'canastra-curado', formatoId: 'fracao', quantidade: 1 },
    ]);
    expect(screen.getByRole('img', { name: /Canastra curado/ })).toBeInTheDocument();
  });

  it('indica o Brie francês para suaves, presente e branco/espumante', async () => {
    const { usuario } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Suaves e amanteigados' }));
    await usuario.click(proxima());
    await usuario.click(screen.getByRole('button', { name: 'Presente' }));
    await usuario.click(proxima());
    await usuario.click(screen.getByRole('button', { name: 'Vinho branco ou espumante' }));
    await usuario.click(screen.getByRole('button', { name: 'Ver meu queijo' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Brie francês' })).toBeVisible();
  });

  it('"Refazer o teste" volta à pergunta 1, sem respostas, com o foco na pergunta', async () => {
    const { usuario } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Equilibrados' }));
    await usuario.click(proxima());
    await usuario.click(screen.getByRole('button', { name: 'Presente' }));
    await usuario.click(proxima());
    await usuario.click(screen.getByRole('button', { name: 'Cerveja' }));
    await usuario.click(screen.getByRole('button', { name: 'Ver meu queijo' }));

    await usuario.click(screen.getByRole('button', { name: 'Refazer o teste' }));

    expect(screen.getByText('ENCONTRE SEU QUEIJO · PERGUNTA 1 DE 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Equilibrados' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(proxima()).toBeDisabled();
  });

  it('não rouba o foco na primeira renderização', () => {
    montar();
    expect(document.body).toHaveFocus();
  });
});
