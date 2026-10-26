import { ProductCard } from '@/components/ProductCard';
import type { Cheese } from '@/data/cheeses';
import estilos from './Catalogo.module.css';

/** Grade de cartões (spec §6) ou, sem resultados, a mensagem de estado vazio. */
export function GradeDeQueijos({ queijos }: { queijos: readonly Cheese[] }) {
  if (queijos.length === 0) {
    return (
      <p className={estilos.vazio}>
        Nenhum queijo com esses filtros por enquanto. Que tal ampliar a busca ou pedir uma sugestão
        ao queijista?
      </p>
    );
  }

  return (
    <>
      <h2 className="sr-only">Queijos</h2>
      <ul className={estilos.grade}>
        {queijos.map((queijo) => (
          <li key={queijo.slug}>
            <ProductCard queijo={queijo} contexto="catalogo" />
          </li>
        ))}
      </ul>
    </>
  );
}
