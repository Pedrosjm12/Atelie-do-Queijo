'use client';

import type { FocusEvent } from 'react';
import ModeloDoQueijo, { type PropsDoModeloDoQueijo } from './ModeloDoQueijo';
import estilos from './CheeseViewer.module.css';

/**
 * Camada do 3D sobre o SVG: tudo o que só existe com GLB mora neste chunk tardio (peso fora do
 * JavaScript inicial do produto). Inerte e transparente até o `load` (`pronto`); o foco do
 * model-viewer fica no shadow DOM e o `:focus-visible` não chega ao host, então o anel dourado é
 * desenhado aqui (`data-foco`), só para foco de teclado.
 */
export default function CamadaDoModelo({
  pronto,
  ...modelo
}: PropsDoModeloDoQueijo & { pronto: boolean }) {
  const marcarFoco = (evento: FocusEvent<HTMLDivElement>) => {
    // O alvo chega "retargetado" para o host; o elemento realmente focado está no shadow DOM.
    const alvo = evento.target as Element;
    if ((alvo.shadowRoot?.activeElement ?? alvo).matches(':focus-visible')) {
      evento.currentTarget.dataset.foco = 'true';
    }
  };
  return (
    <div
      className={estilos.modelo}
      data-pronto={pronto}
      inert={!pronto}
      onFocus={marcarFoco}
      onBlur={(evento) => delete evento.currentTarget.dataset.foco}
    >
      <ModeloDoQueijo {...modelo} />
    </div>
  );
}
