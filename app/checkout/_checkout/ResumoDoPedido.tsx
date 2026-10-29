import { useId } from 'react';
import type { TotaisDoPedido } from '@/lib/commerce';
import { formatarPreco, formatarPrecoOuLacuna } from '@/lib/format';
import type { LinhaPrecificada } from '@/lib/sacola';
import estilos from './Checkout.module.css';

/** Frete grátis aparece como "Grátis" (P25); `null` é a lacuna visível R$ [PREÇO]. */
function textoDoFrete(frete: TotaisDoPedido['frete']): string {
  return frete === 0 ? 'Grátis' : formatarPrecoOuLacuna(frete);
}

/** "2026-11-04" → "04/11/2026" (a data já vem validada como AAAA-MM-DD; não passa por `Date`). */
function dataLegivel(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

/**
 * Linhas Subtotal, Frete, Desconto no Pix (só se houver) e Total (rótulos do P25). Serve ao resumo
 * da etapa 2 (totais calculados aqui para mostrar) e à confirmação (totais devolvidos pelo servidor).
 */
export function TotaisDoResumo({ totais }: { totais: TotaisDoPedido }) {
  return (
    <dl className={estilos.totais}>
      <div className={estilos.linhaDeTotal}>
        <dt>Subtotal</dt>
        <dd>{formatarPreco(totais.subtotal)}</dd>
      </div>
      <div className={estilos.linhaDeTotal}>
        <dt>Frete</dt>
        <dd>{textoDoFrete(totais.frete)}</dd>
      </div>
      {totais.descontoPix > 0 && (
        <div className={estilos.linhaDeTotal}>
          <dt>Desconto no Pix</dt>
          <dd>{`\u2212${formatarPreco(totais.descontoPix)}`}</dd>
        </div>
      )}
      <div className={`${estilos.linhaDeTotal} ${estilos.linhaTotal}`}>
        <dt>Total</dt>
        <dd>{formatarPrecoOuLacuna(totais.total)}</dd>
      </div>
    </dl>
  );
}

type ResumoDoPedidoProps = {
  linhas: readonly LinhaPrecificada[];
  totais: TotaisDoPedido;
  /** Só no pedido de presente. A mensagem é TEXTO (nunca HTML) e preserva as quebras de linha. */
  presente: { mensagem: string; dataDeEntrega: string } | null;
};

/** Resumo da etapa 2: itens, totais (mudam com Pix ↔ cartão) e, se for presente, cartão e data. */
export function ResumoDoPedido({ linhas, totais, presente }: ResumoDoPedidoProps) {
  const idDoTitulo = useId();
  const mensagem = presente?.mensagem.trim() ?? '';
  return (
    <section className={estilos.resumoDoPedido} aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className={estilos.tituloDoResumoDoPedido}>
        Resumo do pedido
      </h3>
      <ul className={estilos.itensDoResumo}>
        {linhas.map((linha) => (
          <li key={`${linha.slug}/${linha.formatoId}`} className={estilos.itemDoResumo}>
            <span>{`${linha.quantidade} \u00D7 ${linha.nome}, ${linha.formatoNome}`}</span>
            <span>{formatarPreco(linha.total)}</span>
          </li>
        ))}
      </ul>
      <TotaisDoResumo totais={totais} />
      {presente && (
        <div className={estilos.dadosDoPresente}>
          <p className={estilos.rotuloDoPresente}>Embalar para presente</p>
          {mensagem !== '' && (
            <p className={estilos.mensagemDoPresente}>
              <span className={estilos.rotuloMiudo}>Mensagem do cartão</span>
              {/* Texto puro: `white-space: pre-line` mostra as quebras; nada vira HTML. */}
              <span className={estilos.textoDoCartao}>{mensagem}</span>
            </p>
          )}
          <p className={estilos.mensagemDoPresente}>
            <span className={estilos.rotuloMiudo}>Data de entrega</span>
            <span>{dataLegivel(presente.dataDeEntrega)}</span>
          </p>
        </div>
      )}
    </section>
  );
}
