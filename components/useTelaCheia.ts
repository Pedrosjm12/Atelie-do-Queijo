import { useCallback, useSyncExternalStore, type RefObject } from 'react';

function assinar(aoMudar: () => void): () => void {
  document.addEventListener('fullscreenchange', aoMudar);
  return () => document.removeEventListener('fullscreenchange', aoMudar);
}

const semAssinatura = () => () => {};
const temSuporte = () =>
  document.fullscreenEnabled === true && typeof Element.prototype.requestFullscreen === 'function';

/**
 * Tela cheia de um elemento pela Fullscreen API. O estado vem do próprio navegador
 * (`fullscreenchange`), então Esc e outros caminhos de saída mantêm o botão em dia.
 * No servidor, `suportada` é verdadeiro (o caso comum) e `ativa` é falso.
 */
export function useTelaCheia(alvoRef: RefObject<HTMLElement | null>): {
  suportada: boolean;
  ativa: boolean;
  alternar: () => void;
} {
  const suportada = useSyncExternalStore(semAssinatura, temSuporte, () => true);
  const ativa = useSyncExternalStore(
    assinar,
    () => document.fullscreenElement !== null && document.fullscreenElement === alvoRef.current,
    () => false,
  );

  const alternar = useCallback(() => {
    const alvo = alvoRef.current;
    if (!alvo || !temSuporte()) return;
    // Recusas do navegador (gesto inválido, política) não têm o que mostrar: o estado não muda.
    if (document.fullscreenElement === alvo) void document.exitFullscreen().catch(() => {});
    else void alvo.requestFullscreen().catch(() => {});
  }, [alvoRef]);

  return { suportada, ativa, alternar };
}
