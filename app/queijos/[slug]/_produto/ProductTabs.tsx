'use client';

import type { ReactNode } from 'react';
import { useAbas } from '@/components/useAbas';
import estilos from './Detalhes.module.css';

const ABAS = [
  { id: 'historia', rotulo: 'A história' },
  { id: 'harmonizacao', rotulo: 'Harmonização' },
  { id: 'como-servir', rotulo: 'Como servir' },
  { id: 'como-guardar', rotulo: 'Como guardar' },
  { id: 'ficha-tecnica', rotulo: 'Ficha técnica' },
] as const;

export type IdDaAba = (typeof ABAS)[number]['id'];

const IDS: readonly IdDaAba[] = ABAS.map((aba) => aba.id);

type ProductTabsProps = {
  /** Um painel por aba, renderizados no servidor. Todos ficam no HTML; os inativos com `hidden`. */
  paineis: Record<IdDaAba, ReactNode>;
};

/** Abas da página de produto (spec §7.3), padrão WAI-ARIA. "A história" é a aba inicial. */
export function ProductTabs({ paineis }: ProductTabsProps) {
  const { propsDaLista, propsDaAba, propsDoPainel } = useAbas<IdDaAba>(IDS, 'historia');

  return (
    <div>
      <div {...propsDaLista} aria-label="Detalhes do queijo" className={estilos.listaDeAbas}>
        {ABAS.map(({ id, rotulo }) => (
          <button key={id} {...propsDaAba(id)} className={estilos.aba}>
            {rotulo}
          </button>
        ))}
      </div>
      {ABAS.map(({ id }) => (
        <div key={id} {...propsDoPainel(id)} className={estilos.painel}>
          {paineis[id]}
        </div>
      ))}
    </div>
  );
}
