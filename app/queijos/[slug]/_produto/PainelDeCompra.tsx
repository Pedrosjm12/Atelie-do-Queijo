'use client';

import { useState, type ReactNode } from 'react';
import { BotaoDaSacola } from '@/components/BotaoDaSacola';
import { BotaoEmBreve } from '@/components/BotaoEmBreve';
import { Icone } from '@/components/icons';
import type { Estoque, Formato } from '@/data/cheeses';
import { precoNoPix } from '@/lib/commerce';
import { formatarPreco } from '@/lib/format';
import { FormatPicker } from './FormatPicker';
import { LinkDoQueijista } from './LinkDoQueijista';
import { QuantityStepper } from './QuantityStepper';
import estilos from './Compra.module.css';

type PainelDeCompraProps = {
  formatos: readonly [Formato, ...Formato[]];
  estoque: Estoque;
  /** Calculadora de frete, renderizada no servidor. */
  frete: ReactNode;
};

/** Texto de estoque da spec §7.5; `null` quando há unidades de sobra. */
function avisoDeEstoque(estoque: Estoque): string | null {
  switch (estoque.situacao) {
    case 'ultimas':
      return `Restam ${estoque.restam ?? '[n]'} peças deste lote.`;
    case 'esgotado':
      return 'Esgotado neste lote. Avise-me quando voltar.';
    case 'disponivel':
      return null;
  }
}

/**
 * Painel de compra da página de produto (spec §7.2, itens 6 a 11; §7.5; §7.6). Ilha única: o
 * formato escolhido alimenta o preço, o Pix e a barra fixa do celular.
 *
 * Etapa 3: "Adicionar à sacola", "Avise-me" e "Embalar para presente" não têm ação (a sacola é
 * da etapa 4). No celular (P12) somem a quantidade e o preço inline e a barra fixa assume.
 */
export function PainelDeCompra({ formatos, estoque, frete }: PainelDeCompraProps) {
  const [formatoId, setFormatoId] = useState<string>(formatos[0].id);
  const [quantidade, setQuantidade] = useState(1);

  const formato = formatos.find((f) => f.id === formatoId) ?? formatos[0];
  const preco = formatarPreco(formato.preco);
  const pix = formatarPreco(precoNoPix(formato.preco));
  const esgotado = estoque.situacao === 'esgotado';
  const aviso = avisoDeEstoque(estoque);

  const botaoPrincipal = esgotado ? (
    <BotaoEmBreve aviso="Aviso de reposição disponível em breve">Avise-me</BotaoEmBreve>
  ) : (
    <BotaoDaSacola>Adicionar à sacola</BotaoDaSacola>
  );

  return (
    <div className={estilos.painel}>
      <div className={estilos.secaoFormato}>
        <FormatPicker formatos={formatos} selecionadoId={formato.id} onSelecionar={setFormatoId} />
      </div>

      <div className={estilos.preco} aria-live="polite">
        <span className={`preco-grande ${estilos.valorDoPreco}`} data-testid="preco-do-painel">
          {preco}
        </span>
        <span className={estilos.pix}>ou {pix} no Pix (5% off)</span>
      </div>

      {aviso && <p className={estilos.estoque}>{aviso}</p>}

      <div className={estilos.compra}>
        {!esgotado && <QuantityStepper valor={quantidade} onChange={setQuantidade} />}
        <div className={estilos.botaoPrincipal}>{botaoPrincipal}</div>
      </div>

      <div className={estilos.presente}>
        <BotaoEmBreve
          variante="secundario"
          tamanho="compacto"
          aviso="Embalagem para presente disponível em breve"
        >
          <Icone nome="presente" tamanho={16} espessura={1.5} />
          Embalar para presente
        </BotaoEmBreve>
      </div>

      <LinkDoQueijista className={estilos.secaoQueijista} />

      <div className={estilos.secaoFrete}>{frete}</div>

      <div className={estilos.barra} data-barra-compra>
        <div aria-live="polite">
          <p className={estilos.barraPreco}>{preco}</p>
          <p className={estilos.barraPix}>5% off no Pix</p>
        </div>
        <div className={estilos.barraBotao}>{botaoPrincipal}</div>
      </div>
    </div>
  );
}
