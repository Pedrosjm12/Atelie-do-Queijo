'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { CheeseIllustration } from '@/components/CheeseIllustration';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SacolaVazia } from '@/components/SacolaVazia';
import { useAcoesDaSacola, useEstadoDaSacola } from '@/components/SacolaProvider';
import { formatarPreco } from '@/lib/format';
import { precificarSacola, type ResumoParaSacola } from '@/lib/sacola';
import { ID_DO_TITULO_DA_SACOLA } from './ids';
import { ResumoDaSacola } from './ResumoDaSacola';
import estilos from './Sacola.module.css';

/**
 * Lista, resumo e estados da sacola. Com `pronta === false` (servidor, 1ª renderização e leitura
 * do localStorage) não mostra nada que dependa da sacola, nem "vazia": só reserva a altura.
 * Itens que o catálogo não reconhece são ignorados por `precificarSacola`.
 */
export function ConteudoDaSacola({ queijos }: { queijos: readonly ResumoParaSacola[] }) {
  const { sacola, pronta } = useEstadoDaSacola();
  const { alterarQuantidade, remover, definirPresente } = useAcoesDaSacola();
  const { linhas, subtotal } = useMemo(() => precificarSacola(sacola, queijos), [sacola, queijos]);
  const porSlug = useMemo(() => new Map(queijos.map((q) => [q.slug, q])), [queijos]);

  const lista = useRef<HTMLUListElement>(null);
  /**
   * Foco depois de remover: `indice` da lista (ou -1 para o título) e o `tamanho` que a lista deve
   * ter quando a remoção valer. Se a lista não chegar a esse tamanho, o pedido é descartado.
   */
  const focoApos = useRef<{ indice: number; tamanho: number } | null>(null);

  useEffect(() => {
    const pedido = focoApos.current;
    if (pedido === null) return;
    focoApos.current = null;
    if (linhas.length !== pedido.tamanho) return; // a remoção não valeu: descarta o pedido
    const alvo = pedido.indice;
    const links = lista.current?.querySelectorAll<HTMLElement>('[data-foco-da-linha]');
    const elemento = alvo >= 0 ? links?.[alvo] : undefined;
    (elemento ?? document.getElementById(ID_DO_TITULO_DA_SACOLA))?.focus();
  }, [linhas]);

  if (!pronta) return <div className={estilos.reserva} aria-hidden="true" />;

  if (linhas.length === 0) {
    return <SacolaVazia />;
  }

  return (
    <div className={estilos.corpo}>
      <ul ref={lista} className={estilos.lista} aria-label="Itens da sacola">
        {linhas.map((linha, indice) => {
          const queijo = porSlug.get(linha.slug);
          const descricao = `${linha.nome}, ${linha.formatoNome}`;
          return (
            <li key={`${linha.slug}:${linha.formatoId}`} className={estilos.linha}>
              <div className={estilos.miniatura}>
                {queijo ? (
                  <CheeseIllustration
                    shape={queijo.ilustracao.shape}
                    side={queijo.ilustracao.side}
                    top={queijo.ilustracao.top}
                    label={linha.nome}
                    decorativa
                  />
                ) : null}
              </div>
              <div className={estilos.info}>
                <Link
                  href={`/queijos/${linha.slug}`}
                  className={estilos.nome}
                  data-foco-da-linha=""
                >
                  {linha.nome}
                </Link>
                <p className={estilos.formato}>
                  {linha.formatoNome} · {linha.peso}
                </p>
                <p className={estilos.preco}>{formatarPreco(linha.precoUnitario)}</p>
              </div>
              <div className={estilos.controles}>
                <QuantityStepper
                  valor={linha.quantidade}
                  rotulo={`Quantidade de ${descricao}`}
                  onChange={(quantidade) =>
                    alterarQuantidade(linha.slug, linha.formatoId, quantidade)
                  }
                />
                <button
                  type="button"
                  className={estilos.remover}
                  aria-label={`Remover ${descricao} da sacola`}
                  onClick={() => {
                    const restantes = linhas.length - 1;
                    focoApos.current = {
                      indice: restantes === 0 ? -1 : Math.min(indice, restantes - 1),
                      tamanho: restantes,
                    };
                    remover(linha.slug, linha.formatoId);
                  }}
                >
                  Remover
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <ResumoDaSacola
        subtotal={subtotal}
        presente={sacola.presente}
        aoTirarPresente={() => definirPresente(false)}
      />
    </div>
  );
}
