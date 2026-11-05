import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import { fraseDoCatalogo } from './textos';

/** Sobretítulo, h1 e parágrafo do catálogo (spec §6). O número vem da quantidade de produtos. */
export function CabecalhoDoCatalogo({ total }: { total: number }) {
  return (
    <CabecalhoDePagina
      sobretitulo="CATÁLOGO DE LANÇAMENTO"
      titulo="A cave"
      paragrafo={fraseDoCatalogo(total)}
    />
  );
}
