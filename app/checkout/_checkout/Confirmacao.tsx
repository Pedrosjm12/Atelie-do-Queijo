import { useId, type Ref } from 'react';
import { Button } from '@/components/Button';
import { Overline } from '@/components/Overline';
import type { TotaisDoPedido } from '@/lib/commerce';
import { ID_DO_TITULO_DA_ETAPA } from './ids';
import { TotaisDoResumo } from './ResumoDoPedido';
import estilos from './Checkout.module.css';

export type PedidoConfirmado = {
  /** Número do pedido como o servidor devolveu ("AQ-…"; D4, revoga o P36). */
  numero: string;
  /** O e-mail como o servidor devolveu. */
  email: string;
  /** Totais devolvidos pelo servidor; o cliente não recalcula. */
  totais: TotaisDoPedido;
};

/** Etapa 3 (spec §10.2). Textos literais; `email` e `totais` vêm da resposta do servidor. */
export function Confirmacao({
  refDoTitulo,
  pedido,
}: {
  refDoTitulo: Ref<HTMLHeadingElement>;
  pedido: PedidoConfirmado;
}) {
  const idDoPedido = useId();
  return (
    <section aria-labelledby={ID_DO_TITULO_DA_ETAPA} className={estilos.etapaCorpo}>
      <Overline id={idDoPedido}>{`Pedido nº ${pedido.numero}`}</Overline>
      <h2
        id={ID_DO_TITULO_DA_ETAPA}
        ref={refDoTitulo}
        tabIndex={-1}
        aria-describedby={idDoPedido}
        className={`${estilos.tituloDaEtapa} ${estilos.tituloDaConfirmacao}`}
      >
        Seu queijo já está sendo preparado.
      </h2>
      <p className={estilos.textoDaConfirmacao}>
        Enviamos os detalhes para <strong className={estilos.email}>{pedido.email}</strong>. Você
        vai receber o código de rastreio assim que a caixa sair da cave.
      </p>
      <div className={estilos.totaisDaConfirmacao}>
        <TotaisDoResumo totais={pedido.totais} />
      </div>
      <div className={estilos.acoes}>
        <Button href="/queijos" seta>
          Explorar a cave
        </Button>
      </div>
    </section>
  );
}
