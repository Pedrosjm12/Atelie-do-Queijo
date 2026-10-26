import Link from 'next/link';
import { Overline } from '@/components/Overline';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import estilos from './Escola.module.css';

// Até existirem os artigos (etapa 7), todos levam à página /aprenda.
const ARTIGOS = [
  {
    foto: 'tábua montada',
    categoria: 'PRIMEIROS PASSOS',
    titulo: 'Como montar uma tábua de queijos',
  },
  {
    foto: 'queijo e taça de vinho',
    categoria: 'HARMONIZAÇÃO',
    titulo: 'Queijo e vinho: um guia sem regras chatas',
  },
  {
    foto: 'queijo embrulhado em papel',
    categoria: 'SERVIR E GUARDAR',
    titulo: 'Como guardar queijo na geladeira',
  },
] as const;

/** Escola do Ateliê (spec §5.8). Cada item é um link inteiro. */
export function Escola() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-escola">
      <Overline>ESCOLA DO ATELIÊ</Overline>
      <h2 id="titulo-escola" className={estilos.titulo}>
        O jeito certo de servir, guardar e harmonizar.
      </h2>
      <ul className={estilos.grade}>
        {ARTIGOS.map((a) => (
          <li key={a.titulo}>
            <Link href="/aprenda" className={estilos.item}>
              <PhotoPlaceholder descricao={a.foto} altura={200} artigo decorativa />
              <Overline pequeno tom="mofo" as="span" className={estilos.categoria}>
                {a.categoria}
              </Overline>
              <h3 className={`titulo-artigo ${estilos.nome}`}>{a.titulo}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
