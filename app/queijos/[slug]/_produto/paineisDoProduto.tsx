import type { ReactNode } from 'react';
import type { DetalheDoQueijo } from '@/data/cheeses';
import type { IdDaAba } from './ProductTabs';
import estilos from './Detalhes.module.css';

/** Conteúdo das cinco abas (spec §7.3), com os textos de `data/cheeses.ts`. */
export function paineisDoProduto(detalhe: DetalheDoQueijo): Record<IdDaAba, ReactNode> {
  const { harmonizacao } = detalhe;

  return {
    historia: detalhe.historia.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>),
    harmonizacao: (
      <div className={estilos.harmonizacao}>
        <div className={estilos.caixa}>
          <p className={`${estilos.rotulo} ${estilos.rotuloVinho}`}>VINHO</p>
          <p className={estilos.textoDaCaixa}>{harmonizacao.vinho}</p>
        </div>
        <div className={estilos.caixa}>
          <p className={`${estilos.rotulo} ${estilos.rotuloCerveja}`}>CERVEJA</p>
          <p className={estilos.textoDaCaixa}>{harmonizacao.cerveja}</p>
        </div>
        <div className={estilos.caixa}>
          <p className={`${estilos.rotulo} ${estilos.rotuloAcompanhamentos}`}>ACOMPANHAMENTOS</p>
          <p className={estilos.textoDaCaixa}>{harmonizacao.acompanhamentos}</p>
        </div>
      </div>
    ),
    'como-servir': <p>{detalhe.comoServir}</p>,
    'como-guardar': <p>{detalhe.comoGuardar}</p>,
    'ficha-tecnica': <p>{detalhe.fichaTecnica}</p>,
  };
}
