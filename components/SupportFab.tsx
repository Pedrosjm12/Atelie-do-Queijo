'use client';

import { useEffect, useState } from 'react';
import { Icone } from './icons';
import estilos from './SupportFab.module.css';

export const CHAVE_BOLHA_VISTA = 'atelie:bolha-atendimento-vista';
export const ATRASO_DA_BOLHA_MS = 20_000;

type SupportFabProps = {
  /**
   * Ponto de extensão: o painel de Atendimento (spec 8) entra na etapa 3 e vai ligar este
   * clique. Até lá o botão não abre nada.
   */
  onClick?: () => void;
};

/** Botão flutuante de atendimento (spec 4.8). */
export function SupportFab({ onClick }: SupportFabProps) {
  const [bolhaVisivel, setBolhaVisivel] = useState(false);

  // A bolha aparece 20 s após o primeiro acesso, uma vez por sessão. O sessionStorage pode
  // estar indisponível (modo privado, bloqueio): nesse caso a bolha só vale para esta montagem.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE_BOLHA_VISTA)) return;
    } catch {
      /* segue sem persistência */
    }
    const temporizador = setTimeout(() => {
      setBolhaVisivel(true);
      try {
        sessionStorage.setItem(CHAVE_BOLHA_VISTA, '1');
      } catch {
        /* segue sem persistência */
      }
    }, ATRASO_DA_BOLHA_MS);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <div className={estilos.fab}>
      {/* A região de status fica sempre montada, para o leitor de tela anunciar o texto ao entrar. */}
      <div role="status">
        {bolhaVisivel && <p className={estilos.bolha}>Posso ajudar a escolher?</p>}
      </div>
      <button
        type="button"
        className={estilos.botao}
        aria-label="Abrir atendimento"
        onClick={() => {
          setBolhaVisivel(false);
          onClick?.();
        }}
      >
        <Icone nome="conversa" tamanho={26} espessura={1.75} />
      </button>
    </div>
  );
}
