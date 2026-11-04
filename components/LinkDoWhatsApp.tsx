'use client';

import { useId, type ReactNode } from 'react';
import { AVISO_DE_NOVA_ABA, linkDoWhatsApp, type MotivoDoContato } from '@/lib/whatsapp';
import { useAtendimento } from './atendimento.contexto';

type LinkDoWhatsAppProps = {
  motivo: MotivoDoContato;
  className?: string;
  /** Ícone e texto do link. */
  children: ReactNode;
};

/** `null` se o número ou o motivo forem inválidos: um link quebrado não pode derrubar a página. */
function montarLink(numero: string, motivo: MotivoDoContato): string | null {
  try {
    return linkDoWhatsApp(numero, motivo);
  } catch {
    return null;
  }
}

/**
 * Link `https://wa.me/…` com a mensagem pré-preenchida da §8.3 (P49: abre em nova aba, com um
 * aviso só para leitor de tela). O número vem do provider, resolvido no servidor (ADR-0010,
 * decisão 4). Sem número, não renderiza nada: o texto em volta é de quem usa o componente.
 */
export function LinkDoWhatsApp({ motivo, className, children }: LinkDoWhatsAppProps) {
  const { numeroDoWhatsApp } = useAtendimento();
  const idDoAviso = useId();
  const href = numeroDoWhatsApp === null ? null : montarLink(numeroDoWhatsApp, motivo);
  if (href === null) return null;

  return (
    <>
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={idDoAviso}
      >
        {children}
      </a>
      <span id={idDoAviso} hidden>
        {AVISO_DE_NOVA_ABA}
      </span>
    </>
  );
}
