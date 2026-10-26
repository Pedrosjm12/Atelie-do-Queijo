import { ProductCard } from '@/components/ProductCard';
import { destaquesDaSemana } from '@/lib/catalogo';
import { CabecalhoDeSecao } from './CabecalhoDeSecao';
import estilos from './NaCave.module.css';

/** "Na cave esta semana" (spec §5.4): os queijos marcados como destaque, com miniaturas A.4. */
export function NaCave() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-na-cave">
      <CabecalhoDeSecao
        sobretitulo="PEÇAS DA SEMANA"
        titulo="Na cave esta semana"
        idDoTitulo="titulo-na-cave"
        paragrafo="Queijos que chegaram ao ponto ideal. Gire, olhe por dentro e escolha o seu."
        larguraDoParagrafo={520}
        link={{ href: '/queijos', texto: 'Ver todos os queijos →' }}
      />
      <ul className={estilos.grade}>
        {destaquesDaSemana().map((queijo) => (
          <li key={queijo.slug} className={estilos.item}>
            <ProductCard queijo={queijo} contexto="home" />
          </li>
        ))}
      </ul>
    </section>
  );
}
