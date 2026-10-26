'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic } from 'react';
import { Button } from '@/components/Button';
import type { Origem } from '@/data/cheeses';
import estilos from './Catalogo.module.css';

type FiltroOrigemProps = {
  /** Origem aplicada pelo servidor (null = Todos). */
  origem: Origem | null;
  contagens: { todos: number; brasil: number; mundo: number };
};

const CAMINHO = '/queijos';

/**
 * Barra de filtros (spec §6): chips com `aria-pressed` que espelham `?origem=` na URL.
 * O chip escolhido é marcado na hora (`useOptimistic`); o servidor refaz a lista.
 * Usa `replace`, então cada filtro substitui o anterior no histórico (ADR-0005).
 */
export function FiltroOrigem({ origem, contagens }: FiltroOrigemProps) {
  const router = useRouter();
  const [marcada, marcar] = useOptimistic<Origem | null, Origem | null>(origem, (_, nova) => nova);

  const opcoes: readonly { valor: Origem | null; rotulo: string }[] = [
    { valor: null, rotulo: `Todos (${contagens.todos})` },
    { valor: 'brasil', rotulo: `Brasil (${contagens.brasil})` },
    { valor: 'mundo', rotulo: `Mundo (${contagens.mundo})` },
  ];

  // Anúncio para leitores de tela (WCAG 4.1.3): vem da origem do servidor, não do estado
  // otimista, então só muda quando a lista nova já está na página.
  const resultado =
    origem === null
      ? `${contagens.todos} queijos`
      : `${origem === 'brasil' ? 'Brasil' : 'Mundo'}: ${contagens[origem]} queijos`;

  function escolher(valor: Origem | null) {
    if (valor === marcada) return;
    startTransition(() => {
      marcar(valor);
      router.replace(valor === null ? CAMINHO : `${CAMINHO}?origem=${valor}`, { scroll: false });
    });
  }

  return (
    <div className={estilos.filtros}>
      <div role="group" aria-label="Filtrar por origem" className={estilos.chips}>
        {opcoes.map(({ valor, rotulo }) => (
          <Button
            key={valor ?? 'todos'}
            variante="opcao"
            tamanho="compacto"
            selecionado={marcada === valor}
            onClick={() => escolher(valor)}
          >
            {rotulo}
          </Button>
        ))}
      </div>
      <p className={estilos.beneficios}>Frete grátis acima de R$ 180 · 5% off no Pix</p>
      <p role="status" className="sr-only">
        {resultado}
      </p>
    </div>
  );
}
