import { CartaoDeArtigo } from '@/components/CartaoDeArtigo';
import { Overline } from '@/components/Overline';
import { ARTIGOS } from '@/data/artigos';
import estilos from './Escola.module.css';

/** Escola do Ateliê (spec §5.8). Cada item é um link inteiro. */
export function Escola() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-escola">
      <Overline>ESCOLA DO ATELIÊ</Overline>
      <h2 id="titulo-escola" className={estilos.titulo}>
        O jeito certo de servir, guardar e harmonizar.
      </h2>
      <ul className={estilos.grade}>
        {ARTIGOS.map((artigo) => (
          <li key={artigo.slug}>
            {/* Até existirem as páginas de artigo (bloco C), todos levam a /aprenda. */}
            <CartaoDeArtigo artigo={artigo} href="/aprenda" nivelDoTitulo="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
