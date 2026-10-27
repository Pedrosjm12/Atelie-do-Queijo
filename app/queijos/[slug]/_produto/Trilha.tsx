import Link from 'next/link';
import type { Origem } from '@/data/cheeses';
import estilos from './Produto.module.css';

const ROTULO_DA_ORIGEM: Record<Origem, string> = { brasil: 'Brasil', mundo: 'Mundo' };

type TrilhaProps = {
  origem: Origem;
  nome: string;
};

/** Trilha de navegação (spec §7.1): Início / Queijos / Brasil / Canastra curado. */
export function Trilha({ origem, nome }: TrilhaProps) {
  const itens = [
    { href: '/', texto: 'Início' },
    { href: '/queijos', texto: 'Queijos' },
    { href: `/queijos?origem=${origem}`, texto: ROTULO_DA_ORIGEM[origem] },
  ];

  return (
    <nav aria-label="Você está em" className={estilos.trilha}>
      <ol className={estilos.trilhaLista}>
        {itens.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={estilos.trilhaLink}>
              {item.texto}
            </Link>
            <span aria-hidden="true" className={estilos.separador}>
              /
            </span>
          </li>
        ))}
        <li>
          <span aria-current="page" className={estilos.trilhaAtual}>
            {nome}
          </span>
        </li>
      </ol>
    </nav>
  );
}
