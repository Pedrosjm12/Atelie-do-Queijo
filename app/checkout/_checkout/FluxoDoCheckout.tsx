'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SacolaVazia } from '@/components/SacolaVazia';
import { useAcoesDaSacola, useEstadoDaSacola } from '@/components/SacolaProvider';
import { calcularTotais, valorDoFrete, type FormaDePagamento } from '@/lib/commerce';
import { precificarSacola, type ResumoParaSacola } from '@/lib/sacola';
import { Confirmacao, type PedidoConfirmado } from './Confirmacao';
import {
  DADOS_INICIAIS,
  type CampoDeEntrega,
  type DadosDaEntrega,
  type ErrosDoCheckout,
} from './dados';
import { EtapaDeEntrega } from './EtapaDeEntrega';
import { EtapaDePagamento } from './EtapaDePagamento';
import { IndicadorDeEtapas, type Etapa } from './IndicadorDeEtapas';
import { useFrete } from './useFrete';
import estilos from './Checkout.module.css';

// Texto literal da spec §10.2.
const AVISO_DE_ENVIO =
  'Enviamos de segunda a quarta, para que seu queijo nunca passe o fim de semana em trânsito.';

/**
 * Fluxo do checkout (spec §10.2). As etapas moram na mesma rota e o estado vive AQUI, só em
 * memória (P37, ADR-0008): nada vai para localStorage, sessionStorage, cookie ou URL, e recarregar
 * a página limpa o formulário. Por isso voltar da etapa 2 para a 1 mantém os dados. Antes da
 * leitura do localStorage (`pronta === false`) nada que dependa da sacola aparece.
 *
 * Depois de `ok: true`: o formulário é ZERADO (fica só o e-mail e os totais devolvidos pelo
 * servidor), a sacola é limpa e a confirmação passa a valer ANTES do estado vazio (que a sacola
 * vazia, de outro modo, mostraria por cima dela).
 */
export function FluxoDoCheckout({ queijos }: { queijos: readonly ResumoParaSacola[] }) {
  const { sacola, pronta } = useEstadoDaSacola();
  const { limpar } = useAcoesDaSacola();
  const { linhas, subtotal } = useMemo(() => precificarSacola(sacola, queijos), [sacola, queijos]);
  const [etapa, setEtapa] = useState<Etapa>('entrega');
  const [dados, setDados] = useState<DadosDaEntrega>(DADOS_INICIAIS);
  const [pagamento, setPagamento] = useState<FormaDePagamento | null>(null);
  const [confirmado, setConfirmado] = useState<PedidoConfirmado | null>(null);
  const [errosDoServidor, setErrosDoServidor] = useState<ErrosDoCheckout>({});
  const frete = useFrete();
  const tituloDaEtapa = useRef<HTMLHeadingElement>(null);
  // Não rouba o foco na primeira renderização da página (mesmo padrão do quiz). Ao voltar para a
  // etapa 1 com erros do servidor, o foco é do resumo de erros, não do título.
  const focarTitulo = useRef(false);

  useEffect(() => {
    if (!focarTitulo.current) return;
    tituloDaEtapa.current?.focus();
  }, [etapa]);

  const estadoDoFrete = frete.estado;
  const freteDoPedido = useMemo(() => {
    const estado = estadoDoFrete;
    if (estado.tipo !== 'resultado' || estado.resultado.situacao !== 'atendido') return null;
    return valorDoFrete(estado.resultado, subtotal);
  }, [estadoDoFrete, subtotal]);
  const totais = useMemo(
    // Sem escolha ainda: mostra o valor sem desconto (como no cartão).
    () => calcularTotais(subtotal, freteDoPedido, pagamento ?? 'cartao'),
    [subtotal, freteDoPedido, pagamento],
  );

  function irPara(proxima: Etapa, focarOTitulo = true) {
    focarTitulo.current = focarOTitulo;
    setEtapa(proxima);
  }

  function mudarCampo(campo: CampoDeEntrega, valor: string) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function aoConfirmar(pedido: PedidoConfirmado) {
    setConfirmado(pedido);
    setDados(DADOS_INICIAIS);
    setPagamento(null);
    setErrosDoServidor({});
    frete.reiniciar();
    irPara('confirmacao');
    limpar();
  }

  function aoCorrigirEntrega(erros: ErrosDoCheckout) {
    setErrosDoServidor(erros);
    // CEP recusado pelo servidor: esquece o resultado antigo para ele ser consultado de novo.
    if (erros.cep) frete.reiniciar();
    irPara('entrega', false);
  }

  if (confirmado) {
    return (
      <div className={estilos.fluxo}>
        <IndicadorDeEtapas atual="confirmacao" />
        <Confirmacao refDoTitulo={tituloDaEtapa} pedido={confirmado} />
      </div>
    );
  }
  if (!pronta) return <div className={estilos.reserva} aria-hidden="true" />;
  if (linhas.length === 0) return <SacolaVazia />;

  return (
    <div className={estilos.fluxo}>
      <IndicadorDeEtapas atual={etapa} />
      <p className={estilos.aviso}>{AVISO_DE_ENVIO}</p>
      {etapa === 'entrega' ? (
        <EtapaDeEntrega
          refDoTitulo={tituloDaEtapa}
          dados={dados}
          aoMudar={mudarCampo}
          frete={frete}
          presente={sacola.presente}
          errosIniciais={errosDoServidor}
          aoAvancar={() => {
            setErrosDoServidor({});
            irPara('pagamento');
          }}
        />
      ) : (
        <EtapaDePagamento
          refDoTitulo={tituloDaEtapa}
          dados={dados}
          itens={sacola.itens}
          linhas={linhas}
          presente={sacola.presente}
          pagamento={pagamento}
          aoEscolher={setPagamento}
          totais={totais}
          aoVoltar={() => irPara('entrega')}
          aoConfirmar={aoConfirmar}
          aoCorrigirEntrega={aoCorrigirEntrega}
        />
      )}
    </div>
  );
}
