'use client';

import { useContext, useEffect, useState } from 'react';
import { ContextoDoAviso } from './avisoDaSacola.contexto';
import estilos from './AvisoDaSacola.module.css';

/** Tempo de exibição (P26). */
export const DURACAO_DO_AVISO_MS = 4000;

type AvisoDaSacolaProps = { aoExpirar: () => void };

/**
 * Aviso temporário da sacola (spec §7.5, P26). A região `role="status"` existe vazia desde a
 * hidratação, para o primeiro anúncio não se perder. O foco nunca sai do botão. A cada novo
 * aviso o texto é limpo e reinserido no quadro seguinte (o leitor de tela anuncia de novo) e o
 * tempo recomeça.
 */
export function AvisoDaSacola({ aoExpirar }: AvisoDaSacolaProps) {
  const aviso = useContext(ContextoDoAviso);
  const id = aviso?.id ?? null;
  const texto = aviso?.texto ?? '';
  const [exibido, setExibido] = useState<{ id: number; texto: string } | null>(null);

  useEffect(() => {
    if (id === null) return;
    // Limpa agora e reinsere no quadro seguinte: o leitor de tela anuncia de novo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExibido(null);
    const quadro = requestAnimationFrame(() => setExibido({ id, texto }));
    const prazo = setTimeout(aoExpirar, DURACAO_DO_AVISO_MS);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(prazo);
    };
  }, [id, texto, aoExpirar]);

  const visivel = aviso !== null && exibido !== null && exibido.id === aviso.id;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={visivel ? `${estilos.aviso} ${estilos.visivel}` : estilos.aviso}
      data-aviso-da-sacola
    >
      {visivel ? exibido.texto : ''}
    </div>
  );
}
