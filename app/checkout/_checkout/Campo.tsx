'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLInputAutoCompleteAttribute,
  type ReactNode,
} from 'react';
import { digitosAte, posicaoAposDigitos } from '@/lib/mascara';
import { ROTULOS, type CampoDeEntrega } from './dados';
import { idDoCampo } from './ids';
import estilos from './Checkout.module.css';

export type MensagemDoCampo = { texto: ReactNode; tipo: 'erro' | 'info' | 'leitor' };

/** Atributos de acessibilidade que o controle (input, select, textarea) precisa receber. */
export type AtributosDoControle = {
  id: string;
  name: CampoDeEntrega;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
};

type CampoProps = {
  campo: CampoDeEntrega;
  /** Texto abaixo do controle: erro (`--casca-texto`) ou informação. */
  mensagem?: MensagemDoCampo | null;
  /** Mensagem numa região `aria-live="polite"` sempre montada (resultado do frete). */
  viva?: boolean;
  /** Outros ids que descrevem o controle (ex.: contador do cartão). */
  descritoPor?: string;
  className?: string;
  children: (atributos: AtributosDoControle) => ReactNode;
};

/** Rótulo visível + controle + mensagem, no padrão do P17 (`aria-invalid` + `aria-describedby`). */
export function Campo({ campo, mensagem, viva, descritoPor, className, children }: CampoProps) {
  const id = idDoCampo(campo);
  const idDaMensagem = `${id}-mensagem`;
  const erro = mensagem?.tipo === 'erro';
  const ids = [mensagem ? idDaMensagem : null, descritoPor ?? null].filter(Boolean).join(' ');
  return (
    <div className={`${estilos.campo} ${className ?? ''}`}>
      <label htmlFor={id} className={estilos.rotulo}>
        {ROTULOS[campo]}
      </label>
      {children({
        id,
        name: campo,
        'aria-invalid': erro || undefined,
        'aria-describedby': ids || undefined,
      })}
      {/* A região viva fica montada mesmo vazia: inserir o texto é anunciado (WCAG 4.1.3). */}
      {viva ? (
        <div id={idDaMensagem} aria-live="polite">
          {mensagem && <MensagemDeCampo mensagem={mensagem} />}
        </div>
      ) : (
        mensagem && (
          <div id={idDaMensagem}>
            <MensagemDeCampo mensagem={mensagem} />
          </div>
        )
      )}
    </div>
  );
}

function MensagemDeCampo({ mensagem }: { mensagem: MensagemDoCampo }) {
  // 'leitor': só para leitor de tela (ex.: "Calculando…"), sem ocupar espaço.
  const classe =
    mensagem.tipo === 'erro' ? estilos.erro : mensagem.tipo === 'info' ? estilos.info : 'sr-only';
  return <p className={classe}>{mensagem.texto}</p>;
}

type CampoDeTextoProps = Omit<CampoProps, 'children'> & {
  valor: string;
  onChange: (valor: string) => void;
  tipo?: 'text' | 'email' | 'date';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  maxLength?: number;
  placeholder?: string;
  min?: string;
  max?: string;
  /** Máscara aplicada a cada digitação; o cursor acompanha os dígitos (só em `type="text"`). */
  mascara?: (texto: string) => string;
};

/** `<input>` de uma linha; com `mascara`, mantém o cursor no lugar depois de reformatar. */
export function CampoDeTexto({
  valor,
  onChange,
  tipo = 'text',
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
  min,
  max,
  mascara,
  ...campo
}: CampoDeTextoProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  // Se a máscara devolve o mesmo texto, o estado do pai não muda e nada re-renderiza; o contador
  // força a passagem pelo efeito para o cursor não ir para o fim.
  const [, forcar] = useState(0);

  useLayoutEffect(() => {
    const no = entrada.current;
    if (cursor.current !== null && no && document.activeElement === no) {
      no.setSelectionRange(cursor.current, cursor.current);
    }
    cursor.current = null;
  });

  function aoDigitar(evento: ChangeEvent<HTMLInputElement>) {
    const bruto = evento.currentTarget.value;
    if (!mascara) {
      onChange(bruto);
      return;
    }
    const posicao = evento.currentTarget.selectionStart ?? bruto.length;
    const mascarado = mascara(bruto);
    cursor.current = posicaoAposDigitos(mascarado, digitosAte(bruto, posicao));
    onChange(mascarado);
    forcar((n) => n + 1);
  }

  return (
    <Campo {...campo}>
      {(atributos) => (
        <input
          {...atributos}
          ref={entrada}
          type={tipo}
          className={estilos.entrada}
          value={valor}
          onChange={aoDigitar}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )}
    </Campo>
  );
}
