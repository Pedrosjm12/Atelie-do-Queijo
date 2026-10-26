import type { ComponentProps } from 'react';
import { BotaoEmBreve } from './BotaoEmBreve';

type BotaoDaSacolaProps = Omit<ComponentProps<typeof BotaoEmBreve>, 'aviso'>;

/** "Adicionar" ainda sem ação (a sacola é da etapa 4, que liga a ação e remove o aviso aqui). */
export function BotaoDaSacola(props: BotaoDaSacolaProps) {
  return <BotaoEmBreve {...props} aviso="Sacola disponível em breve" />;
}
