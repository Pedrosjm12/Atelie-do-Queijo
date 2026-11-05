import type { Metadata } from 'next';
import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import { CartaoDeArtigo } from '@/components/CartaoDeArtigo';
import { ARTIGOS, CATEGORIAS } from '@/data/artigos';
import estilos from './_aprenda/Aprenda.module.css';

const PARAGRAFO = 'O jeito certo de servir, guardar e harmonizar.';

// O título completo ("Aprenda — Ateliê do Queijo") vem do template do layout raiz (P13, P66).
export const metadata: Metadata = { title: 'Aprenda', description: PARAGRAFO };

/** Escola do Ateliê (spec §12 e §5.8): uma seção por categoria; a vazia mostra a lacuna (P61). */
export default function PaginaDeAprenda() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <CabecalhoDePagina titulo="Escola do Ateliê" paragrafo={PARAGRAFO} />
      {CATEGORIAS.map((categoria) => {
        const artigos = ARTIGOS.filter((a) => a.categoria === categoria.id);
        const idDoTitulo = `categoria-${categoria.id}`;
        return (
          <section key={categoria.id} className={estilos.categoria} aria-labelledby={idDoTitulo}>
            <h2 id={idDoTitulo} className={`titulo-bloco ${estilos.tituloDaCategoria}`}>
              {categoria.nome}
            </h2>
            {artigos.length === 0 ? (
              <p className={estilos.lacuna}>[A DEFINIR: artigos]</p>
            ) : (
              <ul className={estilos.grade}>
                {artigos.map((artigo) => (
                  <li key={artigo.slug}>
                    <CartaoDeArtigo
                      artigo={artigo}
                      href={`/aprenda/${artigo.slug}`}
                      nivelDoTitulo="h3"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
