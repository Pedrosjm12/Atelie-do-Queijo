import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheeseViewer } from '@/components/CheeseViewer';
import { listarQueijos, obterQueijo } from '@/lib/catalogo';
import { CabecalhoDoProduto } from './_produto/CabecalhoDoProduto';
import { PainelDeCompra } from './_produto/PainelDeCompra';
import { ProductTabs } from './_produto/ProductTabs';
import { SensoryProfile } from './_produto/SensoryProfile';
import { ShippingCalculator } from './_produto/ShippingCalculator';
import { Trilha } from './_produto/Trilha';
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
  return { title: queijo.nome, description: queijo.nota };
}

/** Página de produto (spec §7). */
export default async function PaginaDoProduto({ params }: PageProps<'/queijos/[slug]'>) {
  const queijo = obterQueijo((await params).slug);
  if (!queijo) notFound();

  return (
    <>
      <Trilha origem={queijo.origem} nome={queijo.nome} />
      <div className={estilos.corpo}>
        <div className={estilos.visualizador}>
          <CheeseViewer queijo={queijo} />
        </div>
        <div className={estilos.info}>
          <CabecalhoDoProduto queijo={queijo} />
          <PainelDeCompra
            key={queijo.slug}
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
