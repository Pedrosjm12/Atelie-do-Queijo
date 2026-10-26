'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Após uma navegação no cliente, leva o foco para #conteudo (não na primeira renderização). */
export function FocoNoConteudo() {
  const caminho = usePathname();
  const anterior = useRef(caminho);

  useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, [caminho]);

  return null;
}
