import { ehSlugDoQueijo, listarQueijos } from '@/lib/catalogo';
import { maiorFormatoEmGramas } from '@/lib/quiz';
import { BrasilEMundo } from './_home/BrasilEMundo';
import { Escola } from './_home/Escola';
import { Garantias } from './_home/Garantias';
import { Hero } from './_home/Hero';
import { NaCave } from './_home/NaCave';
import { Newsletter } from './_home/Newsletter';
import { Presentes } from './_home/Presentes';
import { Quiz, type ResumoDoQueijo } from './_home/Quiz';

/** Home (spec §5): as nove seções na ordem. Só o Quiz e a Newsletter rodam no navegador. */
export default function Home() {
  const resumos: readonly ResumoDoQueijo[] = listarQueijos().flatMap((q) =>
    ehSlugDoQueijo(q.slug)
      ? [
          {
            slug: q.slug,
            nome: q.nome,
            ilustracao: q.ilustracao,
            maiorFormatoEmGramas: maiorFormatoEmGramas(q.formatos),
          },
        ]
      : [],
  );

  return (
    <>
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
