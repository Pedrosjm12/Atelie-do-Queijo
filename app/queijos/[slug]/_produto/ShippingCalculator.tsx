'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { consultarFrete } from '@/app/_acoes/frete';
import { Icone } from '@/components/icons';
import {
  MENSAGEM_DE_CEP_INVALIDO,
  mascararCep,
  normalizarCep,
  type ResultadoDoFrete,
} from '@/lib/commerce';
import estilos from './Compra.module.css';

// Textos aprovados (spec §7.2 item 10; P25). O de CEP inválido vem de `lib/commerce.ts` (fonte única,
// sem Zod, que não pode entrar no pacote do navegador).
export const MENSAGEM_DE_FRETE_INDISPONIVEL =
  'Não conseguimos calcular agora. Tente de novo em instantes.';
const MENSAGEM_FORA_DE_AREA =
  'Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.';

type Estado =
  | { tipo: 'ocioso' }
  | { tipo: 'calculando' }
  | { tipo: 'resultado'; resultado: ResultadoDoFrete }
  | { tipo: 'cep-invalido' }
  | { tipo: 'falha' };

/** Texto + posição do cursor depois da máscara (`null` = não mexer no cursor). */
type Campo = { texto: string; cursor: number | null };

function textoDoPrazo(prazo: number | null): string {
  if (prazo === null) return 'Chega refrigerado em até [N] dias úteis.';
  return `Chega refrigerado em até ${prazo} ${prazo === 1 ? 'dia útil' : 'dias úteis'}.`;
}

/** Quantos dígitos há antes da posição `ate`. */
function digitosAte(texto: string, ate: number): number {
  return texto.slice(0, ate).replace(/\D/g, '').length;
}

/** Posição logo depois do `n`-ésimo dígito do texto mascarado (o hífen fica para trás do cursor). */
function posicaoAposDigitos(mascarado: string, n: number): number {
  if (n <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < mascarado.length; i++) {
    const c = mascarado.charCodeAt(i);
    if (c >= 48 && c <= 57 && ++vistos === n) return i + 1;
  }
  return mascarado.length;
}

/**
 * Calculadora de frete (spec §7.2, item 10). `<form method="post">`: se o envio acontecer antes de
 * a página hidratar, o CEP nunca vai para a URL (o GET padrão o poria na barra de endereço). Já
 * hidratado, `onSubmit` cancela o envio nativo e chama a Server Action `consultarFrete`.
 * "Deixe seu e-mail e avisamos" é só texto nesta etapa: não há campo de e-mail (P9/P15).
 */
export function ShippingCalculator() {
  const idDoCep = useId();
  const idDoResultado = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const emAndamento = useRef(false);
  const montado = useRef(true);
  const consultaAtual = useRef(0);
  const [campo, setCampo] = useState<Campo>({ texto: '', cursor: null });
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });

  // Só a resposta da última consulta vale (`consultaAtual` muda a cada envio e a cada mudança do
  // CEP); ao desmontar, a resposta pendente é descartada. O ciclo marca/desmarca também vale no
  // modo estrito, que monta, desmonta e monta de novo.
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // Recoloca o cursor depois da máscara (inserir o hífen não pode empurrá-lo para o fim).
  useLayoutEffect(() => {
    const no = entrada.current;
    if (campo.cursor !== null && no && document.activeElement === no) {
      no.setSelectionRange(campo.cursor, campo.cursor);
    }
  }, [campo]);

  function aoDigitar(evento: ChangeEvent<HTMLInputElement>) {
    const bruto = evento.currentTarget.value;
    const posicao = evento.currentTarget.selectionStart ?? bruto.length;
    const mascarado = mascararCep(bruto);
    // O CEP mudou: a consulta pendente (se houver) era de outro CEP e deixa de valer.
    if (mascarado !== campo.texto) consultaAtual.current++;
    setCampo({
      texto: mascarado,
      cursor: posicaoAposDigitos(mascarado, digitosAte(bruto, posicao)),
    });
    // O resultado (ou o cálculo) era de outro CEP: sai da tela assim que o CEP muda.
    if (mascarado !== campo.texto) setEstado({ tipo: 'ocioso' });
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (emAndamento.current) return;

    // Atalho no navegador; a Server Action confere de novo (a entrada é pública).
    if (normalizarCep(campo.texto) === null) {
      setEstado({ tipo: 'cep-invalido' });
      entrada.current?.focus();
      return;
    }

    emAndamento.current = true;
    const minha = ++consultaAtual.current;
    setEstado({ tipo: 'calculando' });
    let proximo: Estado;
    try {
      const resposta = await consultarFrete(campo.texto);
      if (resposta.ok) proximo = { tipo: 'resultado', resultado: resposta.resultado };
      else if (resposta.erro === 'cep-invalido') proximo = { tipo: 'cep-invalido' };
      else proximo = { tipo: 'falha' };
    } catch {
      // Rede fora do ar ou "Failed to find Server Action" depois de uma nova publicação (ADR-0008).
      proximo = { tipo: 'falha' };
    }
    emAndamento.current = false;
    if (!montado.current) return;
    if (consultaAtual.current !== minha) {
      setEstado({ tipo: 'ocioso' });
      return;
    }
    setEstado(proximo);
    if (proximo.tipo === 'cep-invalido') {
      // Só devolve o foco se a pessoa ainda está no formulário (ou em lugar nenhum).
      const ativo = document.activeElement;
      if (!ativo || ativo === document.body || entrada.current?.form?.contains(ativo)) {
        entrada.current?.focus();
      }
    }
  }

  const invalido = estado.tipo === 'cep-invalido';

  let mensagem: string | null = null;
  let classeDaMensagem = estilos.resultadoDoFrete;
  let comIcone = false;
  if (estado.tipo === 'resultado') {
    comIcone = true;
    mensagem =
      estado.resultado.situacao === 'atendido'
        ? textoDoPrazo(estado.resultado.prazoDiasUteis)
        : MENSAGEM_FORA_DE_AREA;
  } else if (invalido) {
    mensagem = MENSAGEM_DE_CEP_INVALIDO;
    classeDaMensagem = `${estilos.resultadoDoFrete} ${estilos.erroDoFrete}`;
  } else if (estado.tipo === 'falha') {
    mensagem = MENSAGEM_DE_FRETE_INDISPONIVEL;
    classeDaMensagem = `${estilos.resultadoDoFrete} ${estilos.erroDoFrete}`;
  }

  return (
    <form className={estilos.frete} method="post" noValidate onSubmit={aoEnviar}>
      <label htmlFor={idDoCep} className={estilos.rotuloDoFrete}>
        Calcule o frete e o prazo
      </label>
      <div className={estilos.linhaDoFrete}>
        <input
          ref={entrada}
          id={idDoCep}
          name="cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          placeholder="00000-000"
          className={estilos.campoDeCep}
          value={campo.texto}
          onChange={aoDigitar}
          aria-invalid={invalido || undefined}
          aria-describedby={invalido ? idDoResultado : undefined}
        />
        <button
          type="submit"
          className={estilos.calcular}
          aria-disabled={estado.tipo === 'calculando' || undefined}
        >
          Calcular
        </button>
      </div>
      {/* Região sempre montada (vazia no início): a inserção do texto é anunciada (WCAG 4.1.3). */}
      <div id={idDoResultado} aria-live="polite">
        {estado.tipo === 'calculando' && <p className="sr-only">Calculando…</p>}
        {mensagem !== null && (
          <p className={classeDaMensagem}>
            {comIcone && <Icone nome="frio" tamanho={16} espessura={1.5} />}
            {mensagem}
          </p>
        )}
      </div>
    </form>
  );
}
