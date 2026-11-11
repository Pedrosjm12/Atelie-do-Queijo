import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheeseViewer } from '@/components/CheeseViewer';
import { DadosEstruturados } from '@/components/DadosEstruturados';
import { listarQueijos, obterQueijo } from '@/lib/catalogo';
import { produto, trilhaDeNavegacao } from '@/lib/dadosEstruturados';
import { descricaoCurta, metadadosDaPagina } from '@/lib/seo';
import { urlDoSite } from '@/lib/site';
import { CabecalhoDoProduto } from './_produto/CabecalhoDoProduto';
import { PainelDeCompra } from './_produto/PainelDeCompra';
import { ProductTabs } from './_produto/ProductTabs';
import { SensoryProfile } from './_produto/SensoryProfile';
import { ShippingCalculator } from './_produto/ShippingCalculator';
import { Trilha, itensDaTrilhaDoProduto } from './_produto/Trilha';
import { paineisDoProduto } from './_produto/paineisDoProduto';
import estilos from './_produto/Produto.module.css';

/** Estática (ADR-0005): os 10 slugs são gerados no build e qualquer outro recebe 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return listarQueijos().map((queijo) => ({ slug: queijo.slug }));
}

// O título completo ("Canastra curado — Ateliê do Queijo") vem do template do layout raiz.
export async function generateMetadata({
  params,
}: PageProps<'/queijos/[slug]'>): Promise<Metadata> {
  const queijo = obterQueijo((await params).slug);
  if (!queijo) return {};
  const descricao = descricaoCurta(queijo.nota);
  return {
    title: queijo.nome,
    description: descricao,
    ...metadadosDaPagina({
      caminho: `/queijos/${queijo.slug}`,
      titulo: queijo.nome,
      descricao,
    }),
  };
}

/** Página de produto (spec §7). */
export default async function PaginaDoProduto({ params }: PageProps<'/queijos/[slug]'>) {
  const queijo = obterQueijo((await params).slug);
  if (!queijo) notFound();

  const site = urlDoSite();
  return (
    <>
      <DadosEstruturados
        dados={[
          produto(queijo, site),
          trilhaDeNavegacao(
            itensDaTrilhaDoProduto(queijo.origem),
            { href: `/queijos/${queijo.slug}`, texto: queijo.nome },
            site,
          ),
        ]}
      />
      <Trilha origem={queijo.origem} nome={queijo.nome} />
      <div className={estilos.corpo}>
        <div className={estilos.visualizador}>
          <CheeseViewer queijo={queijo} />
        </div>
        <div className={estilos.info}>
          <CabecalhoDoProduto queijo={queijo} />
          <PainelDeCompra
            key={queijo.slug}
            slug={queijo.slug}
            nomeDoQueijo={queijo.nome}
            formatos={queijo.formatos}
            estoque={queijo.estoque}
            frete={<ShippingCalculator />}
          />
        </div>
      </div>
      <div className={estilos.detalhes}>
        <SensoryProfile perfil={queijo.detalhe.perfil} />
        <div className={estilos.abas}>
          <ProductTabs paineis={paineisDoProduto(queijo.detalhe)} />
        </div>
      </div>
    </>
  );
}
