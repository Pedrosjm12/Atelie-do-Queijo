import Link from 'next/link';
import estilos from './Logo.module.css';

/**
 * Símbolo do Apêndice A.1. As cores ficam literais porque o SVG é copiado da spec.
 * A versão de 24 px tem traço e olhaduras próprios, por isso são dois SVGs alternados por CSS.
 */
function Simbolo() {
  return (
    <>
      <svg
        className={estilos.simboloDesktop}
        width="34"
        height="34"
        viewBox="0 0 34 34"
        aria-hidden="true"
      >
        <path
          d="M17 3L31 30H3Z"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9.5 21H24.5" stroke="#C9A24B" strokeWidth="1.5" />
        <circle cx="17" cy="13.5" r="1.8" fill="#C9A24B" />
        <circle cx="13" cy="25.5" r="1.5" fill="#C9A24B" />
        <circle cx="21.5" cy="25.8" r="1.2" fill="#C9A24B" />
      </svg>
      <svg
        className={estilos.simboloMobile}
        width="24"
        height="24"
        viewBox="0 0 34 34"
        aria-hidden="true"
      >
        <path
          d="M17 3L31 30H3Z"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9.5 21H24.5" stroke="#C9A24B" strokeWidth="1.8" />
        <circle cx="17" cy="13.5" r="2" fill="#C9A24B" />
        <circle cx="13" cy="25.5" r="1.7" fill="#C9A24B" />
        <circle cx="21.5" cy="25.8" r="1.4" fill="#C9A24B" />
      </svg>
    </>
  );
}

type NomeProps = {
  /** "cabecalho": 27/22 px (21/17 px no celular). "rodape": 26/21 px. */
  tamanho?: 'cabecalho' | 'rodape';
};

/** "Ateliê do Queijo" com o "do" em itálico dourado. */
export function NomeDaMarca({ tamanho = 'cabecalho' }: NomeProps) {
  return (
    <span className={tamanho === 'rodape' ? estilos.nomeRodape : estilos.nomeCabecalho}>
      Ateliê <em>do</em> Queijo
    </span>
  );
}

/** Símbolo + nome, como link para a Home (spec 4.1). */
export function Logo() {
  return (
    <Link href="/" className={estilos.logo}>
      <Simbolo />
      <NomeDaMarca />
    </Link>
  );
}
