'use client';

import Link from 'next/link';
import estilos from './Header.module.css';
import { Icone } from './icons';
import { useEstadoDaSacola } from './SacolaProvider';

/**
 * Link da sacola no cabeçalho (spec §4.3 e §10.1): "Sacola" + contador da soma das quantidades.
 * Antes da hidratação, `totalDeItens` é 0, igual ao HTML do servidor.
 *
 * Sem `aria-label`: o nome acessível vem do conteúdo visível ("Sacola" + número) mais "itens"
 * só para leitores de tela (os espaços entre os spans separam as palavras no nome; no flex não renderizam), o que satisfaz WCAG 2.5.3. No celular "Sacola" fica só oculto
 * visualmente (não `display: none`), para continuar no nome.
 */
export function LinkDaSacola() {
  const { totalDeItens } = useEstadoDaSacola();
  return (
    <Link href="/sacola" className={estilos.sacola}>
      <Icone nome="sacola" tamanho={18} />
      <span className={estilos.sacolaTexto}>Sacola</span>{' '}
      <span className={estilos.contador}>{totalDeItens}</span>{' '}
      <span className="sr-only">{totalDeItens === 1 ? 'item' : 'itens'}</span>
    </Link>
  );
}
