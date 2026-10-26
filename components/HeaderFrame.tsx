'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import estilos from './Header.module.css';

/**
 * Casca do <header>. Escolha de projeto: a Home não tem borda inferior e as demais rotas
 * têm (spec 4.3). Como o Header vive no layout raiz, a rota é lida aqui, num client mínimo;
 * o conteúdo continua sendo renderizado no servidor (chega por `children`).
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const comBorda = usePathname() !== '/';
  return (
    <header className={`${estilos.cabecalho} ${comBorda ? estilos.comBorda : ''}`}>
      {children}
    </header>
  );
}
