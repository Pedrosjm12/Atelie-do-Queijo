import { BotaoAbrirAtendimento } from '@/components/Atendimento';
import type { CSSProperties } from 'react';
import estilos from './Catalogo.module.css';

const ESTILO_DO_BOTAO = { '--botao-padding-x': '26px' } as CSSProperties;

/**
 * Caixa "Não sabe qual escolher?" (spec §6). "Pedir ajuda" abre o painel de atendimento.
 */
export function CaixaDeAjuda() {
  return (
    <section className={estilos.ajuda} aria-labelledby="titulo-ajuda">
      <div>
        <h2 id="titulo-ajuda" className={estilos.tituloAjuda}>
          Não sabe qual escolher?
        </h2>
        <p className={estilos.textoAjuda}>
          Responda três perguntas ou fale com um queijista, de segunda a sábado.
        </p>
      </div>
      <BotaoAbrirAtendimento variante="principal" tamanho="compacto" style={ESTILO_DO_BOTAO}>
        Pedir ajuda
      </BotaoAbrirAtendimento>
    </section>
  );
}
