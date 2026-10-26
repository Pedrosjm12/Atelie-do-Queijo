'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './HeaderNav.module.css';
import { itensDeNavegacao } from './navegacao';

type HeaderNavProps = {
  /** "barra": horizontal no cabeçalho (some em ≤ 768 px). "painel": lista vertical do menu móvel. */
  variante?: 'barra' | 'painel';
  /** Chamado ao clicar num link; o menu móvel usa para se fechar. */
  aoNavegar?: () => void;
};

/** Menu principal. É client só para saber a rota atual (link ativo em --ouro). */
export function HeaderNav({ variante = 'barra', aoNavegar }: HeaderNavProps) {
  const caminho = usePathname();

  return (
    <nav aria-label="Principal" className={variante === 'barra' ? estilos.barra : estilos.painel}>
      <ul className={estilos.lista}>
        {itensDeNavegacao.map(({ href, rotulo }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`${estilos.link} ${ativo ? estilos.ativo : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={aoNavegar}
              >
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
