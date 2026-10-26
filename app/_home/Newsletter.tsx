'use client';

import { useCallback, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import estilos from './Newsletter.module.css';

/** Validação mínima de formato; o servidor/provedor valida de verdade quando existir (P9). */
const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MENSAGEM_DE_ERRO = 'Informe um e-mail válido, por exemplo voce@email.com.';
const MENSAGEM_DE_SUCESSO = 'Pronto! Você vai receber os próximos lotes raros.';

/**
 * Newsletter (spec §5.9). Por decisão P9, nada é gravado nem enviado: ao confirmar um e-mail
 * válido, o formulário só é trocado pela mensagem de sucesso. Escolher o provedor (e a base
 * legal da LGPD) é pendência do dono antes da publicação.
 */
export function Newsletter() {
  const idDoCampo = useId();
  const idDoErro = `${idDoCampo}-erro`;
  const [erro, setErro] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  // O formulário some no sucesso: o foco vai para a mensagem assim que ela aparece.
  const focarMensagem = useCallback((no: HTMLParagraphElement | null) => no?.focus(), []);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const email = String(dados.get('email') ?? '').trim();
    if (!FORMATO_DE_EMAIL.test(email)) {
      setErro(true);
      entrada.current?.focus();
      return;
    }
    setErro(false);
    setEnviado(true);
  }

  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-newsletter">
      <div className={estilos.bloco}>
        <div className={estilos.texto}>
          <h2 id="titulo-newsletter" className={estilos.titulo}>
            Receba primeiro os lotes raros.
          </h2>
          <p className={estilos.paragrafo}>
            Algumas peças chegam em poucas unidades. Avisamos você antes de todo mundo.
          </p>
        </div>
        <div className={estilos.lado}>
          {enviado ? (
            <p ref={focarMensagem} tabIndex={-1} className={estilos.sucesso}>
              {MENSAGEM_DE_SUCESSO}
            </p>
          ) : (
            <form className={estilos.formulario} onSubmit={aoEnviar} noValidate>
              <div className={estilos.campo}>
                <label htmlFor={idDoCampo} className={estilos.rotulo}>
                  Seu e-mail
                </label>
                <input
                  ref={entrada}
                  id={idDoCampo}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  className={estilos.entrada}
                  aria-invalid={erro || undefined}
                  aria-describedby={erro ? idDoErro : undefined}
                  onChange={() => setErro(false)}
                />
              </div>
              <Button
                type="submit"
                className={estilos.botao}
                style={{ '--botao-padding-x': '28px' } as CSSProperties}
              >
                Quero receber
              </Button>
              {erro ? (
                <p id={idDoErro} role="alert" className={estilos.erro}>
                  {MENSAGEM_DE_ERRO}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
