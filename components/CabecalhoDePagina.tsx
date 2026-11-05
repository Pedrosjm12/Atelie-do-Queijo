import type { ReactNode } from 'react';
import estilos from './CabecalhoDePagina.module.css';
import { Overline } from './Overline';

type CabecalhoDePaginaProps = {
  sobretitulo?: string;
  titulo: ReactNode;
  paragrafo?: string;
  idDoTitulo?: string;
};

/** Topo de página (spec §6 e §12): sobretítulo opcional, h1 e parágrafo opcional. */
export function CabecalhoDePagina({
  sobretitulo,
  titulo,
  paragrafo,
  idDoTitulo,
}: CabecalhoDePaginaProps) {
  return (
    <div>
      {sobretitulo !== undefined && (
        <Overline className={estilos.sobretitulo}>{sobretitulo}</Overline>
      )}
      <h1 id={idDoTitulo} className="titulo-pagina">
        {titulo}
      </h1>
      {paragrafo !== undefined && <p className={estilos.paragrafo}>{paragrafo}</p>}
    </div>
  );
}
