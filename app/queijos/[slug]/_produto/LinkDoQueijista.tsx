import { BotaoEmBreve } from '@/components/BotaoEmBreve';
import { Icone } from '@/components/icons';
import estilos from './Compra.module.css';

/**
 * "Dúvidas sobre este queijo? Fale com um queijista" (spec §7.2, item 11). Etapa 3: botão sem
 * ação; a etapa 6 troca por um link `wa.me` com a mensagem do produto.
 */
export function LinkDoQueijista({ className }: { className?: string }) {
  return (
    <p className={className ? `${estilos.queijista} ${className}` : estilos.queijista}>
      <span className={estilos.iconeWhatsapp}>
        <Icone nome="conversa" tamanho={16} espessura={1.5} />
      </span>
      <span>Dúvidas sobre este queijo?</span>
      <BotaoEmBreve variante="link" aviso="Atendimento por WhatsApp disponível em breve">
        Fale com um queijista
      </BotaoEmBreve>
    </p>
  );
}
