'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Elemento da âncora (`#id`) da URL atual, ou `null` se não houver ou não existir. */
function elementoDaAncora(): HTMLElement | null {
  const hash = window.location.hash.slice(1);
  if (hash === '') return null;
  let id = hash;
  try {
    id = decodeURIComponent(hash);
  } catch {
    // Âncora malformada: usa o texto como veio.
  }
  return document.getElementById(id);
}

/**
 * Após uma navegação no cliente (não na primeira renderização), leva o foco para o elemento da
 * `#âncora` da URL, se existir (rolando até ele), ou para #conteudo.
 */
export function FocoNoConteudo() {
  const caminho = usePathname();
  const anterior = useRef(caminho);

  useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    const ancora = elementoDaAncora();
    if (ancora) {
      if (!ancora.hasAttribute('tabindex')) ancora.tabIndex = -1;
      ancora.focus();
      return;
    }
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, [caminho]);

  return null;
}
