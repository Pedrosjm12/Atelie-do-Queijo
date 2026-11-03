// Máquina de estados do carregamento do 3D (ADR-0009). Pura, sem React e sem DOM.

export type Situacao3d =
  /** Sem GLB para a variante atual (hoje: todos os queijos): só a ilustração SVG. */
  | 'so-svg'
  /** Tem GLB; espera o palco ficar visível e o navegador ficar ocioso. */
  | 'aguardando'
  /** Importando a biblioteca e baixando o GLB: SVG + "Preparando a peça…". */
  | 'preparando'
  /** Evento `load`: o modelo substitui o SVG. */
  | 'pronto'
  /** Tem GLB, mas o navegador não tem WebGL: SVG + mensagem da §7.5. */
  | 'sem-webgl'
  /** Falha de carga, contexto perdido ou tempo-limite: volta ao SVG, sem mensagem. */
  | 'erro';

export type EventoDo3d =
  | { tipo: 'iniciar'; temGlb: boolean; temWebGL: boolean; economizarDados: boolean }
  | { tipo: 'visivel' }
  | { tipo: 'carregou' }
  | { tipo: 'falhou' }
  | { tipo: 'trocou-variante'; temGlb: boolean; temWebGL: boolean; economizarDados: boolean };

/** Sem o evento `load` neste prazo, conta como erro. */
export const TEMPO_LIMITE_DO_GLB_MS = 20_000;

export function proximaSituacao(atual: Situacao3d, evento: EventoDo3d): Situacao3d {
  switch (evento.tipo) {
    case 'iniciar':
      if (!evento.temGlb) return 'so-svg';
      if (!evento.temWebGL) return 'sem-webgl';
      if (evento.economizarDados) return 'so-svg';
      return 'aguardando';

    case 'visivel':
      return atual === 'aguardando' ? 'preparando' : atual;

    case 'carregou':
      return atual === 'preparando' ? 'pronto' : atual;

    case 'falhou':
      return atual === 'aguardando' || atual === 'preparando' || atual === 'pronto'
        ? 'erro'
        : atual;

    case 'trocou-variante':
      if (!evento.temGlb) return 'so-svg';
      if (!evento.temWebGL) return 'sem-webgl';
      // Nova variante com GLB: quem já tinha modelo (ou falhou) baixa o outro, porque a pessoa
      // pediu; quem estava só no SVG espera o gatilho, salvo com economia de dados.
      if (atual === 'pronto' || atual === 'erro') return 'preparando';
      if (atual === 'so-svg') return evento.economizarDados ? 'so-svg' : 'aguardando';
      return atual;
  }
}
