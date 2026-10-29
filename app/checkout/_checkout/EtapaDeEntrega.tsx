'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type Ref,
} from 'react';
import { Button } from '@/components/Button';
import { Icone } from '@/components/icons';
import { MENSAGEM_DE_CEP_INVALIDO, mascararCep, normalizarCep } from '@/lib/commerce';
import {
  MENSAGEM_DE_FRETE_INDISPONIVEL,
  MENSAGEM_FORA_DE_AREA,
  textoDoPrazo,
} from '@/lib/freteNaTela';
import { UFS, intervaloDeEntrega, validarEntrega } from '@/lib/pedido';
import { BlocoDoPresente } from './BlocoDoPresente';
import { Campo, CampoDeTexto, type MensagemDoCampo } from './Campo';
import {
  ORDEM_DOS_CAMPOS,
  ROTULOS,
  mascararTelefone,
  montarEntrada,
  type CampoDeEntrega,
  type DadosDaEntrega,
  type ErrosDoCheckout,
} from './dados';
import { ID_DO_TITULO_DA_ETAPA, idDoCampo } from './ids';
import type { FreteDoCheckout } from './useFrete';
import estilos from './Checkout.module.css';

type Erros = ErrosDoCheckout;

type EtapaDeEntregaProps = {
  refDoTitulo: Ref<HTMLHeadingElement>;
  dados: DadosDaEntrega;
  aoMudar: (campo: CampoDeEntrega, valor: string) => void;
  frete: FreteDoCheckout;
  /** Só `true` se o pedido for presente (`sacola.presente`): mostra o cartão e a data. */
  presente: boolean;
  aoAvancar: () => void;
  /** Erros devolvidos pelo servidor ao confirmar (dados inválidos, fora de área): abrem a etapa já com o resumo de erros focado. */
  errosIniciais?: Erros;
};

/** Texto do frete embaixo do CEP, ou `null` (mesmos estados do `ShippingCalculator`). */
function mensagemDoCep(erro: string | undefined, frete: FreteDoCheckout): MensagemDoCampo | null {
  if (erro) return { texto: erro, tipo: 'erro' };
  const { estado } = frete;
  switch (estado.tipo) {
    case 'calculando':
      return { texto: 'Calculando…', tipo: 'leitor' };
    case 'cep-invalido':
      return { texto: MENSAGEM_DE_CEP_INVALIDO, tipo: 'erro' };
    case 'falha':
      return { texto: MENSAGEM_DE_FRETE_INDISPONIVEL, tipo: 'erro' };
    case 'resultado':
      return estado.resultado.situacao === 'atendido'
        ? {
            texto: (
              <>
                <Icone nome="frio" tamanho={16} espessura={1.5} />
                {textoDoPrazo(estado.resultado.prazoDiasUteis)}
              </>
            ),
            tipo: 'info',
          }
        : { texto: MENSAGEM_FORA_DE_AREA, tipo: 'erro' };
    default:
      return null;
  }
}

/**
 * Etapa 1 do checkout: contato, endereço e (se for presente) cartão e data. `<form method="post">`
 * com `preventDefault`: nenhum dado pessoal vai para a URL, nem antes de hidratar. Valida tudo com
 * `validarEntrega` (o mesmo esquema do servidor) e só avança com tudo válido e o CEP atendido.
 */
export function EtapaDeEntrega({
  refDoTitulo,
  dados,
  aoMudar,
  frete,
  presente,
  aoAvancar,
  errosIniciais,
}: EtapaDeEntregaProps) {
  const idDoTituloDoResumo = useId();
  const tituloDoResumo = useRef<HTMLHeadingElement>(null);
  const emAndamento = useRef(false);
  const montado = useRef(true);
  const [erros, setErros] = useState<Erros>(() => errosIniciais ?? {});
  const [ocupado, setOcupado] = useState(false);
  // Cada pedido de foco no resumo incrementa o contador; o efeito roda depois de o resumo existir.
  const [pedidoDeFoco, setPedidoDeFoco] = useState(() =>
    errosIniciais && Object.keys(errosIniciais).length > 0 ? 1 : 0,
  );
  // Fixo durante a visita à etapa: o `min`/`max` do P34 (amanhã até 60 dias, fuso de São Paulo).
  const [intervalo] = useState(() => intervaloDeEntrega());

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (pedidoDeFoco > 0) tituloDoResumo.current?.focus();
  }, [pedidoDeFoco]);

  function mudar(campo: CampoDeEntrega, valor: string) {
    aoMudar(campo, valor);
    setErros((atuais) => {
      if (!(campo in atuais)) return atuais;
      const resto = { ...atuais };
      delete resto[campo];
      return resto;
    });
  }

  function mudarCep(valor: string) {
    if (valor === dados.cep) return;
    mudar('cep', valor);
    // O resultado do CEP anterior sai da tela e a consulta pendente deixa de valer.
    frete.reiniciar();
    if (normalizarCep(valor) !== null) void frete.consultar(valor);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (emAndamento.current) return;
    emAndamento.current = true;
    setOcupado(true);
    try {
      const validacao = validarEntrega(montarEntrada(dados, presente));
      const encontrados: Erros = validacao.ok ? {} : { ...validacao.erros };

      if (validacao.ok) {
        // Frete ainda não consultado, em andamento ou que falhou: consulta (ou espera) agora.
        let situacao = frete.estado;
        if (situacao.tipo !== 'resultado') situacao = await frete.consultar(dados.cep);
        if (!montado.current) return;
        if (situacao.tipo === 'resultado') {
          if (situacao.resultado.situacao === 'fora-de-area') {
            encontrados.cep = MENSAGEM_FORA_DE_AREA;
          }
        } else if (situacao.tipo === 'falha') {
          encontrados.cep = MENSAGEM_DE_FRETE_INDISPONIVEL;
        } else if (situacao.tipo === 'cep-invalido') {
          encontrados.cep = MENSAGEM_DE_CEP_INVALIDO;
        } else {
          return; // o CEP mudou durante a consulta: a pessoa confere e envia de novo
        }
      }

      if (Object.keys(encontrados).length > 0) {
        setErros(encontrados);
        setPedidoDeFoco((n) => n + 1);
        return;
      }
      setErros({});
      aoAvancar();
    } finally {
      emAndamento.current = false;
      if (montado.current) setOcupado(false);
    }
  }

  function irParaOCampo(evento: MouseEvent<HTMLAnchorElement>, campo: CampoDeEntrega) {
    evento.preventDefault();
    document.getElementById(idDoCampo(campo))?.focus();
  }

  const mensagemDe = (campo: CampoDeEntrega): MensagemDoCampo | null => {
    const texto = erros[campo];
    return texto ? { texto, tipo: 'erro' } : null;
  };

  const camposComErro = ORDEM_DOS_CAMPOS.filter((campo) => erros[campo]);

  return (
    <section aria-labelledby={ID_DO_TITULO_DA_ETAPA} className={estilos.etapaCorpo}>
      <h2
        id={ID_DO_TITULO_DA_ETAPA}
        ref={refDoTitulo}
        tabIndex={-1}
        className={estilos.tituloDaEtapa}
      >
        Entrega
      </h2>

      {camposComErro.length > 0 && (
        <section className={estilos.resumoDeErros} aria-labelledby={idDoTituloDoResumo}>
          <h3
            id={idDoTituloDoResumo}
            ref={tituloDoResumo}
            tabIndex={-1}
            className={estilos.tituloDoResumo}
          >
            Revise os campos abaixo
          </h3>
          <ul>
            {camposComErro.map((campo) => (
              <li key={campo}>
                <a
                  href={`#${idDoCampo(campo)}`}
                  className={estilos.linkDoErro}
                  onClick={(evento) => irParaOCampo(evento, campo)}
                >
                  {ROTULOS[campo]}: {erros[campo]}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form method="post" noValidate onSubmit={aoEnviar} className={estilos.formulario}>
        <fieldset className={estilos.grupo}>
          <legend className={estilos.legenda}>Seus dados</legend>
          <div className={estilos.grade}>
            <CampoDeTexto
              campo="nome"
              valor={dados.nome}
              onChange={(v) => mudar('nome', v)}
              mensagem={mensagemDe('nome')}
              autoComplete="name"
              className={estilos.inteira}
            />
            <CampoDeTexto
              campo="email"
              tipo="email"
              valor={dados.email}
              onChange={(v) => mudar('email', v)}
              mensagem={mensagemDe('email')}
              autoComplete="email"
              inputMode="email"
              className={estilos.metade}
            />
            <CampoDeTexto
              campo="telefone"
              valor={dados.telefone}
              onChange={(v) => mudar('telefone', v)}
              mensagem={mensagemDe('telefone')}
              mascara={mascararTelefone}
              autoComplete="tel-national"
              inputMode="tel"
              maxLength={15}
              placeholder="(11) 91234-5678"
              className={estilos.metade}
            />
          </div>
        </fieldset>

        <fieldset className={estilos.grupo}>
          <legend className={estilos.legenda}>Endereço de entrega</legend>
          <div className={estilos.grade}>
            <CampoDeTexto
              campo="cep"
              valor={dados.cep}
              onChange={mudarCep}
              mensagem={mensagemDoCep(erros.cep, frete)}
              viva
              mascara={mascararCep}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              className={`${estilos.inteira} ${estilos.cep}`}
            />
            <CampoDeTexto
              campo="logradouro"
              valor={dados.logradouro}
              onChange={(v) => mudar('logradouro', v)}
              mensagem={mensagemDe('logradouro')}
              autoComplete="address-line1"
              className={estilos.larga}
            />
            <CampoDeTexto
              campo="numero"
              valor={dados.numero}
              onChange={(v) => mudar('numero', v)}
              mensagem={mensagemDe('numero')}
              inputMode="numeric"
              className={estilos.estreita}
            />
            <CampoDeTexto
              campo="complemento"
              valor={dados.complemento}
              onChange={(v) => mudar('complemento', v)}
              mensagem={mensagemDe('complemento')}
              autoComplete="address-line2"
              className={estilos.metade}
            />
            <CampoDeTexto
              campo="bairro"
              valor={dados.bairro}
              onChange={(v) => mudar('bairro', v)}
              mensagem={mensagemDe('bairro')}
              autoComplete="address-level3"
              className={estilos.metade}
            />
            <CampoDeTexto
              campo="cidade"
              valor={dados.cidade}
              onChange={(v) => mudar('cidade', v)}
              mensagem={mensagemDe('cidade')}
              autoComplete="address-level2"
              className={estilos.larga}
            />
            <Campo campo="uf" mensagem={mensagemDe('uf')} className={estilos.estreita}>
              {(atributos) => (
                <select
                  {...atributos}
                  className={estilos.entrada}
                  value={dados.uf}
                  autoComplete="address-level1"
                  onChange={(evento: ChangeEvent<HTMLSelectElement>) =>
                    mudar('uf', evento.currentTarget.value)
                  }
                >
                  <option value="">Selecione</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </div>
        </fieldset>

        {presente && (
          <BlocoDoPresente
            mensagem={dados.mensagem}
            dataDeEntrega={dados.dataDeEntrega}
            aoMudar={mudar}
            mensagemDe={mensagemDe}
            intervalo={intervalo}
          />
        )}

        <div className={estilos.acoes}>
          <Button
            type="submit"
            seta
            className={estilos.continuar}
            aria-disabled={ocupado || undefined}
          >
            Continuar para o pagamento
          </Button>
        </div>
      </form>
    </section>
  );
}
