import type { ReactNode } from 'react';
import estilos from './Overline.module.css';

type OverlineProps = {
  children: ReactNode;
  /** 11 px nos cartões, em vez dos 12 px padrão. */
  pequeno?: boolean;
  /** Espaçamento entre letras: 0,18em padrão; 0,16em no catálogo (só com `pequeno`). */
  catalogo?: boolean;
  /** Cor: `--palha` (padrão) ou `--mofo` (sobretítulos de "origem" e da Escola). */
  tom?: 'palha' | 'mofo';
  as?: 'p' | 'span' | 'h2' | 'h3';
  className?: string;
};

/** Sobretítulo em maiúsculas (spec 3.2). */
export function Overline({
  children,
  pequeno = false,
  catalogo = false,
  tom = 'palha',
  as: Elemento = 'p',
  className,
}: OverlineProps) {
  const classes = [
    estilos.overline,
    pequeno ? estilos.pequeno : '',
    pequeno && catalogo ? estilos.catalogo : '',
    tom === 'mofo' ? estilos.mofo : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <Elemento className={classes}>{children}</Elemento>;
}
