import type { ReactNode } from 'react';
import estilos from './Seal.module.css';

type SealProps = {
  /** "origem": Selo Arte etc. "maturacao": leite cru, dias de cura. */
  tipo: 'origem' | 'maturacao';
  children: ReactNode;
};

export function Seal({ tipo, children }: SealProps) {
  return (
    <span className={`${estilos.selo} ${tipo === 'origem' ? estilos.origem : estilos.maturacao}`}>
      {children}
    </span>
  );
}
