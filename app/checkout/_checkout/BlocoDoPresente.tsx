'use client';

import { Campo, CampoDeTexto, type MensagemDoCampo } from './Campo';
import {
  LIMITE_DE_CARACTERES,
  LIMITE_DE_LINHAS,
  medirMensagem,
  type CampoDeEntrega,
} from './dados';
import { idDoCampo } from './ids';
import estilos from './Checkout.module.css';

/** Perto do limite (80%) o contador passa a ser anunciado (P25). */
const LIMITE_DO_AVISO = Math.floor(LIMITE_DE_CARACTERES * 0.8);
const LIMITE_DO_ALERTA = Math.floor(LIMITE_DE_CARACTERES * 0.95);

const ID_DA_DICA = `${idDoCampo('mensagem')}-dica`;
// Textos só para leitor de tela (a confirmar pelo dono, docs/PLANO.md).
const DICA = `Até ${LIMITE_DE_CARACTERES} caracteres e ${LIMITE_DE_LINHAS} linhas.`;

/** Anúncio por marco: o texto só muda ao cruzar 160, 190 ou o limite, nunca a cada tecla. */
function anuncioDoMarco(caracteres: number, excedeu: boolean): string {
  if (excedeu) {
    return `Limite excedido: no máximo ${LIMITE_DE_CARACTERES} caracteres e ${LIMITE_DE_LINHAS} linhas.`;
  }
  if (caracteres >= LIMITE_DO_ALERTA) {
    return `${LIMITE_DO_ALERTA} caracteres ou mais, de ${LIMITE_DE_CARACTERES}.`;
  }
  if (caracteres >= LIMITE_DO_AVISO) {
    return `${LIMITE_DO_AVISO} caracteres ou mais, de ${LIMITE_DE_CARACTERES}.`;
  }
  return '';
}

type BlocoDoPresenteProps = {
  mensagem: string;
  dataDeEntrega: string;
  aoMudar: (campo: CampoDeEntrega, valor: string) => void;
  mensagemDe: (campo: CampoDeEntrega) => MensagemDoCampo | null;
  intervalo: { min: string; max: string };
};

/** Cartão, data de entrega e nota do embalar para presente (só aparece se a sacola for presente). */
export function BlocoDoPresente({
  mensagem,
  dataDeEntrega,
  aoMudar,
  mensagemDe,
  intervalo,
}: BlocoDoPresenteProps) {
  const medida = medirMensagem(mensagem);
  const passouDoLimite =
    medida.caracteres > LIMITE_DE_CARACTERES || medida.linhas > LIMITE_DE_LINHAS;
  const textoDoContador = `${medida.caracteres} de ${LIMITE_DE_CARACTERES} caracteres`;

  return (
    <fieldset className={estilos.grupo} data-presente="">
      <legend className={estilos.legenda}>Embalar para presente</legend>
      <div className={estilos.grade}>
        <Campo
          campo="mensagem"
          mensagem={mensagemDe('mensagem')}
          descritoPor={ID_DA_DICA}
          className={estilos.inteira}
        >
          {(atributos) => (
            <textarea
              {...atributos}
              className={`${estilos.entrada} ${estilos.areaDeTexto}`}
              rows={4}
              value={mensagem}
              // Sem `maxLength`: ele cortaria a quebra de linha de outro jeito que o servidor.
              // O limite de 200 caracteres e 6 linhas é conferido por `validarEntrega`.
              onChange={(evento) => aoMudar('mensagem', evento.currentTarget.value)}
            />
          )}
        </Campo>
        <div className={`${estilos.inteira} ${estilos.rodapeDoCartao}`}>
          <p id={ID_DA_DICA} className="sr-only">
            {DICA}
          </p>
          <p
            className={passouDoLimite ? estilos.contadorExcedido : estilos.contador}
            aria-hidden="true"
          >
            {textoDoContador}
          </p>
          {/* Sempre montada; só os marcos mudam o texto, para não falar a cada tecla (P25). */}
          <p className="sr-only" aria-live="polite">
            {anuncioDoMarco(medida.caracteres, passouDoLimite)}
          </p>
        </div>
        <CampoDeTexto
          campo="dataDeEntrega"
          tipo="date"
          valor={dataDeEntrega}
          onChange={(v) => aoMudar('dataDeEntrega', v)}
          mensagem={mensagemDe('dataDeEntrega')}
          min={intervalo.min}
          max={intervalo.max}
          className={estilos.metade}
        />
        <p className={`${estilos.inteira} ${estilos.notaFiscal}`}>
          Nota fiscal sem valor visível ao presenteado.
        </p>
      </div>
    </fieldset>
  );
}
