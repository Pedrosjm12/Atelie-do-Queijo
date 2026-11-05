import { CartaoDeKit } from '@/components/CartaoDeKit';
import { KITS } from '@/data/kits';
import { CabecalhoDeSecao } from './CabecalhoDeSecao';
import estilos from './Presentes.module.css';

/** Presentes (spec §5.7). */
export function Presentes() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-presentes">
      <CabecalhoDeSecao
        sobretitulo="PRESENTES"
        titulo={
          <>
            Presentes que se abrem <em>como um ritual.</em>
          </>
        }
        idDoTitulo="titulo-presentes"
        paragrafo="Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão."
        larguraDoParagrafo={560}
        link={{ href: '/presentes', texto: 'Ver todos os presentes →' }}
      />
      <ul className={estilos.grade}>
        {KITS.map((kit) => (
          <li key={kit.id}>
            <CartaoDeKit kit={kit} nivelDoTitulo="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
