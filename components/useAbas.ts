'use client';

import { useId, useState, type KeyboardEvent } from 'react';

/**
 * Padrão WAI-ARIA de abas com ativação automática (produto e painel de atendimento).
 * Setas esquerda/direita (circular), Home e End movem o foco e a seleção; só a aba ativa
 * entra na sequência de Tab (`tabIndex` móvel).
 *
 * O chamador espalha `propsDaLista` no contêiner (e informa o `aria-label`), `propsDaAba(id)`
 * em cada `<button>` e `propsDoPainel(id)` em cada painel. Os painéis inativos ficam no HTML
 * com `hidden`.
 */
export function useAbas<Id extends string>(ids: readonly Id[], inicial: Id) {
  const base = useId();
  const [ativa, setAtiva] = useState<Id>(inicial);

  const idDaAba = (id: Id) => `${base}-aba-${id}`;
  const idDoPainel = (id: Id) => `${base}-painel-${id}`;

  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const atual = ids.indexOf(ativa);
    let proximo: number;
    switch (evento.key) {
      case 'ArrowRight':
        proximo = (atual + 1) % ids.length;
        break;
      case 'ArrowLeft':
        proximo = (atual - 1 + ids.length) % ids.length;
        break;
      case 'Home':
        proximo = 0;
        break;
      case 'End':
        proximo = ids.length - 1;
        break;
      default:
        return;
    }
    evento.preventDefault();
    const destino = ids[proximo];
    if (destino === undefined) return;
    setAtiva(destino);
    evento.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[proximo]?.focus();
  }

  return {
    ativa,
    selecionar: setAtiva,
    propsDaLista: { role: 'tablist', onKeyDown: aoTeclar },
    propsDaAba: (id: Id) => ({
      id: idDaAba(id),
      role: 'tab',
      type: 'button' as const,
      'aria-selected': ativa === id,
      'aria-controls': idDoPainel(id),
      tabIndex: ativa === id ? 0 : -1,
      onClick: () => setAtiva(id),
    }),
    propsDoPainel: (id: Id) => ({
      id: idDoPainel(id),
      role: 'tabpanel',
      'aria-labelledby': idDaAba(id),
      hidden: ativa !== id,
      tabIndex: 0,
    }),
  };
}
