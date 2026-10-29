'use client';

import { useState, type ReactNode } from 'react';
import { BotaoAdicionar } from '@/components/BotaoAdicionar';
import { BotaoEmBreve } from '@/components/BotaoEmBreve';
import { Icone } from '@/components/icons';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useSacola } from '@/components/SacolaProvider';
import type { Estoque, Formato, SlugDoQueijo } from '@/data/cheeses';
import { precoNoPix } from '@/lib/commerce';
import { formatarPreco } from '@/lib/format';
import { FormatPicker } from './FormatPicker';
import { LinkDoQueijista } from './LinkDoQueijista';
import estilos from './Compra.module.css';

type PainelDeCompraProps = {
  slug: SlugDoQueijo;
  formatos: readonly [Formato, ...Formato[]];
  estoque: Estoque;
  /** Calculadora de frete, renderizada no servidor. */
  frete: ReactNode;
};

/** Texto de estoque da spec §7.5; `null` quando há unidades de sobra. */
function avisoDeEstoque(estoque: Estoque): string | null {
  switch (estoque.situacao) {
    case 'ultimas':
      if (estoque.restam === 1) return 'Resta 1 peça deste lote.';
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
 * "Adicionar à sacola" e "Embalar para presente" põem o formato e a quantidade escolhidos na
 * sacola (P31: o segundo também marca o pedido como presente). "Avise-me" segue sem ação (P15).
 * No celular (P12) somem a quantidade e o preço inline e a barra fixa assume.
 */
export function PainelDeCompra({ slug, formatos, estoque, frete }: PainelDeCompraProps) {
  const [formatoId, setFormatoId] = useState<string>(formatos[0].id);
  const [quantidade, setQuantidade] = useState(1);
  const { sacola, pronta } = useSacola();

  const formato = formatos.find((f) => f.id === formatoId) ?? formatos[0];
  const preco = formatarPreco(formato.preco);
  const pix = formatarPreco(precoNoPix(formato.preco));
  const esgotado = estoque.situacao === 'esgotado';
  const aviso = avisoDeEstoque(estoque);

  const textoDoPresente = (
    <>
      <Icone nome="presente" tamanho={16} espessura={1.5} />
      Embalar para presente
    </>
  );

  const botaoPrincipal = esgotado ? (
    <BotaoEmBreve aviso="Aviso de reposição disponível em breve">Avise-me</BotaoEmBreve>
  ) : (
    <BotaoAdicionar slug={slug} formatoId={formato.id} quantidade={quantidade}>
      Adicionar à sacola
    </BotaoAdicionar>
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

      <div className={estilos.presente} data-presente={pronta && sacola.presente}>
        {esgotado ? (
          <BotaoEmBreve
            variante="secundario"
            tamanho="compacto"
            aviso="Embalagem para presente indisponível enquanto o lote está esgotado"
          >
            {textoDoPresente}
          </BotaoEmBreve>
        ) : (
          <BotaoAdicionar
            slug={slug}
            formatoId={formato.id}
            quantidade={quantidade}
            presente
            variante="secundario"
            tamanho="compacto"
          >
            {textoDoPresente}
          </BotaoAdicionar>
        )}
        {pronta && sacola.presente && (
          <p className={estilos.notaDoPresente}>Pedido marcado como presente</p>
        )}
      </div>

      {/* Duas posições, só uma visível: a ordem de Tab acompanha a ordem visual em cada largura. */}
      <LinkDoQueijista className={`${estilos.secaoQueijista} ${estilos.queijistaCelular}`} />

      <div className={estilos.secaoFrete}>{frete}</div>

      <LinkDoQueijista className={`${estilos.secaoQueijista} ${estilos.queijistaDesktop}`} />

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
