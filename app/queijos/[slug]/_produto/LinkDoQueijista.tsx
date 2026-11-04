'use client';

import { useAtendimento } from '@/components/atendimento.contexto';
import { Icone } from '@/components/icons';
import { LinkDoWhatsApp } from '@/components/LinkDoWhatsApp';
import estilos from './Compra.module.css';

/**
 * "Dúvidas sobre este queijo? Fale com um queijista" (spec §7.2, item 11; §10.5): link `wa.me`
 * com a mensagem do produto. `nomeDoQueijo` vem do catálogo. Sem número do WhatsApp (produção sem
 * variável válida), a linha inteira some.
 */
export function LinkDoQueijista({
  className,
  nomeDoQueijo,
}: {
  className?: string;
  nomeDoQueijo: string;
}) {
  const { numeroDoWhatsApp } = useAtendimento();
  if (numeroDoWhatsApp === null) return null;

  return (
    <p className={className ? `${estilos.queijista} ${className}` : estilos.queijista}>
      <span className={estilos.iconeWhatsapp}>
        <Icone nome="conversa" tamanho={16} espessura={1.5} />
      </span>
      <span>Dúvidas sobre este queijo?</span>
      <LinkDoWhatsApp
        motivo={{ tipo: 'produto', nomeDoQueijo }}
        className={estilos.linkDoQueijista}
      >
        Fale com um queijista
      </LinkDoWhatsApp>
    </p>
  );
}
