'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent, type Ref } from 'react';
import { confirmarPedido } from '@/app/_acoes/pedido';
import { BotaoAbrirAtendimento } from '@/components/Atendimento';
import { Button } from '@/components/Button';
import { calcularTotais, type FormaDePagamento, type TotaisDoPedido } from '@/lib/commerce';
import { formatarPreco, formatarPrecoOuLacuna } from '@/lib/format';
import { MENSAGENS_DE_ERRO } from '@/lib/pedido';
import { MENSAGEM_FORA_DE_AREA } from '@/lib/freteNaTela';
import type { ItemDaSacola, LinhaPrecificada } from '@/lib/sacola';
import type { PedidoConfirmado } from './Confirmacao';
import { montarEntrada, type DadosDaEntrega, type ErrosDoCheckout } from './dados';
import { ID_DO_TITULO_DA_ETAPA } from './ids';
import { ResumoDoPedido } from './ResumoDoPedido';
import estilos from './Checkout.module.css';

// Textos literais da spec §10.2 (P33). `[n]` continua lacuna visível.
const ROTULO_DO_PIX = 'Pix (5% de desconto)';
const ROTULO_DO_CARTAO = 'Cartão em até [n]x sem juros';

const OPCOES: readonly { valor: FormaDePagamento; rotulo: string }[] = [
  { valor: 'pix', rotulo: ROTULO_DO_PIX },
  { valor: 'cartao', rotulo: ROTULO_DO_CARTAO },
];

/** Frase só para leitor de tela ao trocar a forma de pagamento (texto a confirmar pelo dono). */
function anuncioDaForma(forma: FormaDePagamento, totais: TotaisDoPedido): string {
  const novos = calcularTotais(totais.subtotal, totais.frete, forma);
  const total = `Total ${formatarPrecoOuLacuna(novos.total)}.`;
  return forma === 'pix'
    ? `Pix escolhido. Desconto de ${formatarPreco(novos.descontoPix)}. ${total}`
    : `Cartão escolhido. Sem desconto. ${total}`;
}

type Falha = 'geral' | 'sacola-invalida';

type EtapaDePagamentoProps = {
  refDoTitulo: Ref<HTMLHeadingElement>;
  dados: DadosDaEntrega;
  itens: readonly ItemDaSacola[];
  linhas: readonly LinhaPrecificada[];
  presente: boolean;
  pagamento: FormaDePagamento | null;
  aoEscolher: (forma: FormaDePagamento) => void;
  /** Totais mostrados no resumo (já levam em conta Pix ou cartão). */
  totais: TotaisDoPedido;
  aoVoltar: () => void;
  aoConfirmar: (pedido: PedidoConfirmado) => void;
  /** O servidor recusou dados da etapa 1 (ou o CEP): volta para lá com os erros por campo. */
  aoCorrigirEntrega: (erros: ErrosDoCheckout) => void;
};

/**
 * Etapa 2: escolha de pagamento (só os rádios, sem campo de cartão, P33), resumo e confirmação.
 * `confirmarPedido` roda dentro de `startTransition`; o botão fica `aria-disabled` e uma trava
 * (ref) impede o segundo envio mesmo antes da nova renderização. Qualquer falha mostra a mesma
 * mensagem aprovada em `role="alert"`, a sacola fica intacta e nada foi cobrado.
 */
export function EtapaDePagamento({
  refDoTitulo,
  dados,
  itens,
  linhas,
  presente,
  pagamento,
  aoEscolher,
  totais,
  aoVoltar,
  aoConfirmar,
  aoCorrigirEntrega,
}: EtapaDePagamentoProps) {
  const [pendente, iniciar] = useTransition();
  const emAndamento = useRef(false);
  const primeiraOpcao = useRef<HTMLInputElement>(null);
  const [erroDoPagamento, setErroDoPagamento] = useState<string | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  // Região viva sempre montada: o texto é injetado quando a forma de pagamento muda.
  const [anuncio, setAnuncio] = useState('');
  // Cada pedido de foco incrementa o contador; o efeito roda depois de o erro existir.
  const [pedidoDeFoco, setPedidoDeFoco] = useState(0);

  useEffect(() => {
    if (pedidoDeFoco > 0) primeiraOpcao.current?.focus();
  }, [pedidoDeFoco]);

  function escolher(forma: FormaDePagamento) {
    aoEscolher(forma);
    setErroDoPagamento(null);
    setAnuncio(anuncioDaForma(forma, totais));
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (emAndamento.current) return;
    if (pagamento === null) {
      setErroDoPagamento(MENSAGENS_DE_ERRO.pagamento);
      setPedidoDeFoco((n) => n + 1);
      return;
    }
    emAndamento.current = true;
    setFalha(null);
    iniciar(async () => {
      try {
        const resposta = await confirmarPedido({
          itens: itens.map(({ slug, formatoId, quantidade }) => ({ slug, formatoId, quantidade })),
          presente,
          entrega: montarEntrada(dados, presente),
          pagamento,
        });
        if (resposta.ok) {
          aoConfirmar({ email: resposta.email, totais: resposta.totais });
          return;
        }
        switch (resposta.motivo) {
          case 'fora-de-area':
            aoCorrigirEntrega({ cep: MENSAGEM_FORA_DE_AREA });
            break;
          case 'dados-invalidos': {
            const { pagamento: doPagamento, ...daEntrega } = resposta.erros;
            if (Object.keys(daEntrega).length > 0) {
              aoCorrigirEntrega(daEntrega);
            } else if (doPagamento) {
              setErroDoPagamento(doPagamento);
              setPedidoDeFoco((n) => n + 1);
            } else {
              setFalha('geral');
            }
            break;
          }
          case 'sacola-invalida':
            setFalha('sacola-invalida');
            break;
          case 'pagamento-recusado':
          case 'indisponivel':
          default:
            setFalha('geral');
        }
      } catch {
        // Rede fora do ar ou "Failed to find Server Action" depois de uma nova publicação.
        setFalha('geral');
      } finally {
        emAndamento.current = false;
      }
    });
  }

  return (
    <section aria-labelledby={ID_DO_TITULO_DA_ETAPA} className={estilos.etapaCorpo}>
      <h2
        id={ID_DO_TITULO_DA_ETAPA}
        ref={refDoTitulo}
        tabIndex={-1}
        className={estilos.tituloDaEtapa}
      >
        Pagamento
      </h2>

      <form method="post" noValidate onSubmit={aoEnviar} className={estilos.formulario}>
        <fieldset
          className={estilos.grupo}
          aria-describedby={erroDoPagamento ? 'checkout-pagamento-mensagem' : undefined}
        >
          <legend className={estilos.legenda}>Forma de pagamento</legend>
          <div className={estilos.opcoesDePagamento}>
            {OPCOES.map(({ valor, rotulo }, indice) => (
              <label
                key={valor}
                className={
                  pagamento === valor
                    ? `${estilos.opcaoDePagamento} ${estilos.opcaoAtiva}`
                    : estilos.opcaoDePagamento
                }
              >
                <input
                  ref={indice === 0 ? primeiraOpcao : undefined}
                  type="radio"
                  name="pagamento"
                  value={valor}
                  checked={pagamento === valor}
                  onChange={() => escolher(valor)}
                  className="sr-only"
                />
                {rotulo}
              </label>
            ))}
          </div>
          {erroDoPagamento && (
            <p id="checkout-pagamento-mensagem" className={estilos.erro}>
              {erroDoPagamento}
            </p>
          )}
        </fieldset>

        <ResumoDoPedido
          linhas={linhas}
          totais={totais}
          presente={
            presente ? { mensagem: dados.mensagem, dataDeEntrega: dados.dataDeEntrega } : null
          }
        />

        {/* Sempre montados (vazios sem falha): o texto injetado é anunciado (WCAG 4.1.3). */}
        <p className="sr-only" aria-live="polite">
          {anuncio}
        </p>
        <p className="sr-only" aria-live="polite">
          {pendente ? 'Confirmando o pedido…' : ''}
        </p>
        <div className={falha ? estilos.falha : 'sr-only'}>
          <div role="alert" className={falha ? estilos.erroDePagamento : undefined}>
            {falha && (
              <>
                Não conseguimos confirmar o pagamento. Nada foi cobrado. Tente outra forma ou{' '}
                <BotaoAbrirAtendimento className={estilos.linkDoAtendimento}>
                  fale com a gente
                </BotaoAbrirAtendimento>
                .
              </>
            )}
          </div>
          {falha === 'sacola-invalida' && (
            <Button href="/sacola" variante="secundario">
              Voltar para a sacola
            </Button>
          )}
        </div>

        <div className={estilos.acoes}>
          <Button type="submit" seta aria-disabled={pendente || undefined}>
            Confirmar pedido
          </Button>
          <Button
            variante="secundario"
            aria-disabled={pendente || undefined}
            onClick={() => {
              if (!emAndamento.current) aoVoltar();
            }}
          >
            Voltar para a entrega
          </Button>
        </div>
      </form>
    </section>
  );
}
