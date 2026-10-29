'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { SlugDoQueijo } from '@/data/cheeses';
import { Button } from './Button';
import { useSacola } from './SacolaProvider';

type BotaoAdicionarProps = {
  slug: SlugDoQueijo;
  formatoId: string;
  quantidade?: number;
  /** Marca o pedido inteiro como presente (P31). */
  presente?: boolean;
  children: ReactNode;
  variante?: 'principal' | 'secundario' | 'contorno' | 'link';
  tamanho?: 'padrao' | 'compacto';
  'aria-label'?: string;
  style?: CSSProperties;
};

/** Botão que põe um formato de queijo na sacola e dispara o aviso (spec §7.5). */
export function BotaoAdicionar({
  slug,
  formatoId,
  quantidade,
  presente,
  ...resto
}: BotaoAdicionarProps) {
  const { adicionar } = useSacola();
  return <Button {...resto} onClick={() => adicionar({ slug, formatoId, quantidade, presente })} />;
}
