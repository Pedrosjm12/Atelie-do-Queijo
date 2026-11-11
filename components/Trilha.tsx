import Link from 'next/link';
import type { ItemDeTrilha } from '@/lib/dadosEstruturados';
import estilos from './Trilha.module.css';

export type ItemDaTrilha = ItemDeTrilha;

type TrilhaProps = {
  /** Itens com link, na ordem; o último (a página atual) vai em `atual`. */
  itens: readonly ItemDaTrilha[];
  atual: string;
};

/** Trilha de navegação (spec §7.1): Início / Queijos / Brasil / Canastra curado. */
export function Trilha({ itens, atual }: TrilhaProps) {
  return (
    <nav aria-label="Você está em" className={estilos.trilha}>
      <ol className={estilos.lista}>
        {itens.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={estilos.link}>
              {item.texto}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li>
          <span aria-current="page" className={estilos.atual}>
            {atual}
          </span>
        </li>
      </ol>
    </nav>
  );
}
