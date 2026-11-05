import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { ProductCard } from '@/components/ProductCard';
import { Trilha } from '@/components/Trilha';
import { ARTIGOS, nomeDaCategoria, obterArtigo } from '@/data/artigos';
import { obterQueijo } from '@/lib/catalogo';
import estilos from '../_aprenda/Aprenda.module.css';

/** Estática (ADR-0011): os slugs de `ARTIGOS` são gerados no build e qualquer outro recebe 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTIGOS.map((artigo) => ({ slug: artigo.slug }));
}

// O título completo ("<título> — Ateliê do Queijo") vem do template do layout raiz (P66).
export async function generateMetadata({
  params,
}: PageProps<'/aprenda/[slug]'>): Promise<Metadata> {
  const artigo = obterArtigo((await params).slug);
  if (!artigo) return {};
  // Sem corpo (lacuna), a descrição do layout raiz continua valendo.
  const descricao = artigo.corpo?.[0];
  return descricao ? { title: artigo.titulo, description: descricao } : { title: artigo.titulo };
}

/** Página de artigo (spec §12): termina com os queijos citados (P59, P60). */
export default async function PaginaDoArtigo({ params }: PageProps<'/aprenda/[slug]'>) {
  const artigo = obterArtigo((await params).slug);
  if (!artigo) notFound();

  const citados = (artigo.queijosCitados ?? []).flatMap((slug) => obterQueijo(slug) ?? []);

  return (
    <>
      <Trilha
        itens={[
          { href: '/', texto: 'Início' },
          { href: '/aprenda', texto: 'Aprenda' },
        ]}
        atual={artigo.titulo}
      />
      <div className={`conteudo ${estilos.pagina}`}>
        <CabecalhoDePagina sobretitulo={nomeDaCategoria(artigo.categoria)} titulo={artigo.titulo} />
        <div className={estilos.foto}>
          <PhotoPlaceholder descricao={artigo.foto} altura={200} artigo />
        </div>
        <div className={estilos.corpo}>
          {artigo.corpo ? artigo.corpo.map((p, i) => <p key={i}>{p}</p>) : <p>[TEXTO DO ARTIGO]</p>}
        </div>
        <section className={estilos.citados} aria-labelledby="titulo-queijos-citados">
          <h2 id="titulo-queijos-citados" className={`titulo-bloco ${estilos.tituloDosCitados}`}>
            Queijos citados
          </h2>
          {citados.length === 0 ? (
            <p className={estilos.lacuna}>[A DEFINIR: queijos citados]</p>
          ) : (
            <ul className={estilos.grade}>
              {citados.map((queijo) => (
                <li key={queijo.slug}>
                  <ProductCard queijo={queijo} contexto="catalogo" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
