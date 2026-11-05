import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import { Overline } from '@/components/Overline';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { PRODUTORES } from '@/data/produtores';
import { obterQueijo } from '@/lib/catalogo';
import estilos from './_produtores/Produtores.module.css';

const TEXTO =
  'O Ateliê nasceu da vontade de levar até você queijos que só se encontravam na porta da fazenda ou nas melhores queijarias da Europa. Conhecemos cada produtor, provamos cada lote e só vendemos o que serviríamos em casa.';

// O título completo ("Nossos produtores — Ateliê do Queijo") vem do template do layout raiz (P13, P66).
export const metadata: Metadata = { title: 'Nossos produtores', description: TEXTO };

const nomeDoQueijo = (slug: string) => obterQueijo(slug)?.nome ?? slug;

/** Nossos produtores / Sobre (spec §12): sem sobretítulo (P53); sem página de produtor (P63). */
export default function PaginaDeProdutores() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <CabecalhoDePagina titulo="Quem faz o queijo importa." paragrafo={TEXTO} />
      <ul className={estilos.grade}>
        {PRODUTORES.map((produtor) => (
          <li key={produtor.id}>
            <article aria-labelledby={`produtor-${produtor.id}`}>
              <PhotoPlaceholder descricao={produtor.foto} altura={240} />
              <Overline pequeno tom="mofo" as="span" className={estilos.regiao}>
                {produtor.regiao}
              </Overline>
              <h2 id={`produtor-${produtor.id}`} className={`titulo-artigo ${estilos.nome}`}>
                {produtor.nome}
              </h2>
              <p className={estilos.desde}>desde {produtor.desde}</p>
              <ul className={estilos.queijos}>
                {produtor.queijos.map((slug) => (
                  <li key={slug}>
                    <Button href={`/queijos/${slug}`} variante="link" className={estilos.link}>
                      {nomeDoQueijo(slug)} <span aria-hidden="true">→</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
