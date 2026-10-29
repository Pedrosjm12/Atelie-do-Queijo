import type { Metadata } from 'next';
import { resumoParaSacola } from '@/lib/catalogo';
import { ConteudoDaSacola } from './_sacola/ConteudoDaSacola';
import { ID_DO_TITULO_DA_SACOLA } from './_sacola/ids';
import estilos from './_sacola/Sacola.module.css';

// O título completo ("Sacola — Ateliê do Queijo") vem do template do layout raiz (P13, P25).
export const metadata: Metadata = {
  title: 'Sacola',
  robots: { index: false, follow: false },
};

/**
 * Sacola (spec §10.1, P25). Estática: a sacola vive no navegador, então o servidor só entrega o
 * título e o resumo do catálogo (nome, formatos e preços) como props para o componente cliente.
 */
export default function PaginaDaSacola() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <h1 id={ID_DO_TITULO_DA_SACOLA} tabIndex={-1} className={`titulo-pagina ${estilos.titulo}`}>
        Sua sacola
      </h1>
      <ConteudoDaSacola queijos={resumoParaSacola()} />
    </div>
  );
}
