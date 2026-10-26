import type { Metadata } from 'next';
import { contarPorOrigem, filtrarPorOrigem, lerOrigem } from '@/lib/catalogo';
import { CaixaDeAjuda } from './_catalogo/CaixaDeAjuda';
import { CabecalhoDoCatalogo } from './_catalogo/CabecalhoDoCatalogo';
import { FiltroOrigem } from './_catalogo/FiltroOrigem';
import { GradeDeQueijos } from './_catalogo/GradeDeQueijos';
import estilos from './_catalogo/Catalogo.module.css';
import { fraseDoCatalogo } from './_catalogo/textos';

// O título completo ("Queijos — Ateliê do Queijo") vem do template do layout raiz (P13).
export const metadata: Metadata = {
  title: 'Queijos',
  description: fraseDoCatalogo(contarPorOrigem().todos),
};

/**
 * Catálogo (spec §6). Dinâmica: lê `?origem=` e filtra no servidor (ADR-0005), então o HTML
 * já chega com os cartões certos. Origem inválida equivale a "Todos".
 */
export default async function PaginaDoCatalogo({ searchParams }: PageProps<'/queijos'>) {
  const origem = lerOrigem((await searchParams).origem);
  const contagens = contarPorOrigem();
  const queijos = filtrarPorOrigem(origem);

  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <CabecalhoDoCatalogo total={contagens.todos} />
      <FiltroOrigem origem={origem} contagens={contagens} />
      <GradeDeQueijos queijos={queijos} />
      <CaixaDeAjuda />
    </div>
  );
}
