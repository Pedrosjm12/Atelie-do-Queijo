'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { HeaderNav } from './HeaderNav';
import { Icone } from './icons';
import estilos from './MobileMenu.module.css';

/** Botão "Menu" e painel de navegação para ≤ 768 px (spec 3.4 e 7.6). */
export function MobileMenu() {
  // Aberto vale só para a rota em que foi aberto: qualquer navegação o fecha, sem efeito.
  const caminho = usePathname();
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const aberto = abertoEm === caminho;
  const botao = useRef<HTMLButtonElement>(null);
  const idDoPainel = useId();

  useEffect(() => {
    if (!aberto) return;
    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;
      setAbertoEm(null);
      botao.current?.focus();
    }
    document.addEventListener('keydown', aoPressionar);
    return () => document.removeEventListener('keydown', aoPressionar);
  }, [aberto]);

  return (
    <>
      <button
        ref={botao}
        type="button"
        className={estilos.botao}
        aria-label="Menu"
        aria-expanded={aberto}
        aria-controls={idDoPainel}
        onClick={() => setAbertoEm(aberto ? null : caminho)}
      >
        <Icone nome={aberto ? 'fechar' : 'menu'} tamanho={22} />
      </button>
      <div id={idDoPainel} className={estilos.painel} hidden={!aberto}>
        <HeaderNav variante="painel" aoNavegar={() => setAbertoEm(null)} />
      </div>
    </>
  );
}
