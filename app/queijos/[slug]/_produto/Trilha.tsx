import { Trilha as TrilhaGenerica } from '@/components/Trilha';
import type { Origem } from '@/data/cheeses';
import estilos from './Produto.module.css';

const ROTULO_DA_ORIGEM: Record<Origem, string> = { brasil: 'Brasil', mundo: 'Mundo' };

type TrilhaProps = {
  origem: Origem;
  nome: string;
};

/** Trilha do produto (spec §7.1): Início / Queijos / Brasil / Canastra curado. Some no celular (§7.6). */
export function Trilha({ origem, nome }: TrilhaProps) {
  return (
    <div className={estilos.trilha}>
      <TrilhaGenerica
        itens={[
          { href: '/', texto: 'Início' },
          { href: '/queijos', texto: 'Queijos' },
          { href: `/queijos?origem=${origem}`, texto: ROTULO_DA_ORIGEM[origem] },
        ]}
        atual={nome}
      />
    </div>
  );
}
