import { Overline } from '@/components/Overline';
import estilos from './Catalogo.module.css';
import { fraseDoCatalogo } from './textos';

/** Sobretítulo, h1 e parágrafo do catálogo (spec §6). O número vem da quantidade de produtos. */
export function CabecalhoDoCatalogo({ total }: { total: number }) {
  return (
    <div>
      <Overline className={estilos.sobretitulo}>CATÁLOGO DE LANÇAMENTO</Overline>
      <h1 className="titulo-pagina">A cave</h1>
      <p className={estilos.paragrafo}>{fraseDoCatalogo(total)}</p>
    </div>
  );
}
