import { Fragment } from 'react';
import estilos from './SemQuebra.module.css';

/** Trechos que não podem quebrar no meio da linha (D14): CEP ("01310-100") e "e-mail". */
const TRECHOS = /(\d{5}-\d{3}|\be-mail\b)/g;

/**
 * Mostra o texto como está, mas com os trechos de CEP e "e-mail" em `white-space: nowrap`.
 * O texto e o hífen continuam os aprovados (copiar, buscar e ler em voz alta não mudam).
 */
export function SemQuebra({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(TRECHOS).map((parte, i) =>
        // `split` com grupo de captura: índices ímpares são os trechos.
        i % 2 === 1 ? (
          <span key={i} className={estilos.semQuebra}>
            {parte}
          </span>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}
