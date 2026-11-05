import type { Metadata } from 'next';
import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import { CartaoDeKit } from '@/components/CartaoDeKit';
import { KITS } from '@/data/kits';
import { metadadosDaPagina } from '@/lib/seo';
import { BlocoCorporativo } from './_presentes/BlocoCorporativo';
import { EmTodoKit } from './_presentes/EmTodoKit';
import estilos from './_presentes/Presentes.module.css';

const PARAGRAFO =
  'Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão.';

// O título completo ("Presentes — Ateliê do Queijo") vem do template do layout raiz (P13, P66).
export const metadata: Metadata = {
  title: 'Presentes',
  description: PARAGRAFO,
  ...metadadosDaPagina({ caminho: '/presentes', titulo: 'Presentes', descricao: PARAGRAFO }),
};

/** Presentes (spec §12 e §5.7). Estática; sem filtros (P54) e sem botão nos kits (P55). */
export default function PaginaDePresentes() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <CabecalhoDePagina
        sobretitulo="PRESENTES"
        titulo="Para quem merece uma boa tábua."
        paragrafo={PARAGRAFO}
      />
      <ul className={estilos.grade}>
        {KITS.map((kit) => (
          <li key={kit.id}>
            <CartaoDeKit kit={kit} nivelDoTitulo="h2" />
          </li>
        ))}
      </ul>
      <EmTodoKit />
      <BlocoCorporativo />
    </div>
  );
}
