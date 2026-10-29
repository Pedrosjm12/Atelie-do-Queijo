'use client';

import Link from 'next/link';
import estilos from './Header.module.css';
import { Icone } from './icons';
import { useSacola } from './SacolaProvider';

/**
 * Link da sacola no cabeçalho (spec §4.3 e §10.1): "Sacola" + contador da soma das quantidades.
 * Antes da hidratação, `totalDeItens` é 0, igual ao HTML do servidor.
 */
export function LinkDaSacola() {
  const { totalDeItens } = useSacola();
  return (
    <Link
      href="/sacola"
      className={estilos.sacola}
      aria-label={`Sacola, ${totalDeItens} ${totalDeItens === 1 ? 'item' : 'itens'}`}
    >
      <Icone nome="sacola" tamanho={18} />
      <span className={estilos.sacolaTexto}>Sacola</span>
      <span className={estilos.contador} aria-hidden="true">
        {totalDeItens}
      </span>
    </Link>
  );
}
