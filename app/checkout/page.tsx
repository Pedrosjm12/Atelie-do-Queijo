import type { Metadata } from 'next';
import { resumoParaSacola } from '@/lib/catalogo';
import { FluxoDoCheckout } from './_checkout/FluxoDoCheckout';
import { ID_DO_TITULO_DO_CHECKOUT } from './_checkout/ids';
import estilos from './_checkout/Checkout.module.css';

// O título completo ("Finalizar compra — Ateliê do Queijo") vem do template do layout raiz (P25).
export const metadata: Metadata = {
  title: 'Finalizar compra',
  robots: { index: false, follow: false },
};

/**
 * Checkout (spec §10.2, ADR-0008). Estático: a sacola vive no navegador e as três etapas moram na
 * mesma rota, com o estado só em memória (P37). O servidor entrega o título e o resumo do catálogo.
 */
export default function PaginaDoCheckout() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <h1 id={ID_DO_TITULO_DO_CHECKOUT} className={`titulo-pagina ${estilos.titulo}`}>
        Finalizar compra
      </h1>
      <FluxoDoCheckout queijos={resumoParaSacola()} />
    </div>
  );
}
