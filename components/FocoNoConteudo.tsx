'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Foca o elemento da âncora (`#id`), rolando até ele. Devolve `false` se o hash for vazio ou não existir. */
function focarAncora(hash: string): boolean {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // Âncora malformada: usa o texto como veio.
  }
  const alvo = id && document.getElementById(id);
  if (!alvo) return false;
  // Só quem não é focável de natureza (tabIndex < 0) ganha -1; campos e links nativos ficam no Tab.
  if (alvo.tabIndex < 0) alvo.tabIndex = -1;
  alvo.focus();
  return true;
}

/**
 * Após uma navegação no cliente (não na primeira renderização), leva o foco para o elemento da
 * `#âncora` da URL, se existir (rolando até ele), ou para #conteudo. Quando a rota não muda (já
 * em /presentes, clicando em "Presentes corporativos"), o pathname é o mesmo e o efeito abaixo
 * não roda: o clique num link da mesma rota com `#âncora` e o `hashchange` cobrem esse caso.
 */
export function FocoNoConteudo() {
  const caminho = usePathname();
  const anterior = useRef(caminho);

  useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    if (!focarAncora(location.hash)) {
      document.getElementById('conteudo')?.focus({ preventScroll: true });
    }
  }, [caminho]);

  // Sinal de "hidratou" para os testes ponta a ponta esperarem por uma condição real, em vez de
  // adivinhar com tempo: efeitos só rodam depois da hidratação.
  useEffect(() => {
    document.documentElement.dataset.hidratado = '';
  }, []);

  useEffect(() => {
    let adiado: ReturnType<typeof setTimeout>;

    // O `Link` do Next muda a URL com pushState (sem `hashchange`) e rola até a âncora por conta
    // própria; o foco vai logo depois, quando a URL e o scroll já foram atualizados.
    // Sem checar `defaultPrevented` de propósito: o `Link` cancela o padrão ao navegar no cliente.
    const aoClicar = (e: MouseEvent) => {
      const link = e.target instanceof Element && e.target.closest<HTMLAnchorElement>('a[href]');
      if (
        e.button ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        !link ||
        (link.target && link.target !== '_self') ||
        link.origin + link.pathname !== location.origin + location.pathname
      ) {
        return;
      }
      clearTimeout(adiado);
      adiado = setTimeout(focarAncora, 0, link.hash);
    };
    // Mudança de hash feita pelo navegador (link comum, voltar/avançar, endereço digitado).
    const aoMudarOHash = () => focarAncora(location.hash);

    document.addEventListener('click', aoClicar);
    window.addEventListener('hashchange', aoMudarOHash);
    return () => {
      clearTimeout(adiado);
      document.removeEventListener('click', aoClicar);
      window.removeEventListener('hashchange', aoMudarOHash);
    };
  }, []);

  return null;
}
