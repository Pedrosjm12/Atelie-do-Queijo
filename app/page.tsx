import type { Metadata } from 'next';
import { DadosEstruturados } from '@/components/DadosEstruturados';
import { formatoDeVitrine, listarQueijos } from '@/lib/catalogo';
import { maiorFormatoEmGramas } from '@/lib/quiz';
import { organizacao, siteWeb } from '@/lib/dadosEstruturados';
import { DESCRICAO_DO_SITE, metadadosDaPagina } from '@/lib/seo';
import { urlDoSite } from '@/lib/site';
import { BrasilEMundo } from './_home/BrasilEMundo';
import { Escola } from './_home/Escola';
import { Garantias } from './_home/Garantias';
import { Hero } from './_home/Hero';
import { NaCave } from './_home/NaCave';
import { Newsletter } from './_home/Newsletter';
import { Presentes } from './_home/Presentes';
import { Quiz, type ResumoDoQueijo } from './_home/Quiz';

export const metadata: Metadata = metadadosDaPagina({
  caminho: '/',
  titulo: null,
  descricao: DESCRICAO_DO_SITE,
});

/** Home (spec §5): as nove seções na ordem. Só o Quiz e a Newsletter rodam no navegador. */
export default function Home() {
  const resumos: readonly ResumoDoQueijo[] = listarQueijos().map((q) => ({
    slug: q.slug,
    nome: q.nome,
    formatoIdDeVitrine: formatoDeVitrine(q).id,
    ilustracao: q.ilustracao,
    maiorFormatoEmGramas: maiorFormatoEmGramas(q.formatos),
  }));

  const site = urlDoSite();
  return (
    <>
      <DadosEstruturados dados={[organizacao(site), siteWeb(site)]} />
      <Hero />
      <Garantias />
      <NaCave />
      <BrasilEMundo />
      <Quiz queijos={resumos} />
      <Presentes />
      <Escola />
      <Newsletter />
    </>
  );
}
