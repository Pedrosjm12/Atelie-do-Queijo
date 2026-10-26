import { useId, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';

type BotaoDaSacolaProps = {
  children: ReactNode;
  'aria-label'?: string;
  variante?: 'principal' | 'secundario' | 'contorno';
  tamanho?: 'padrao' | 'compacto';
  style?: CSSProperties;
};

/**
 * Botão "Adicionar" ainda sem ação (a sacola é da etapa 4). Fica focável e visualmente igual,
 * mas anuncia `aria-disabled` e a descrição "Sacola disponível em breve". A etapa 4 liga a ação
 * (e remove o aviso) só aqui.
 */
export function BotaoDaSacola({ children, ...resto }: BotaoDaSacolaProps) {
  const idDaAjuda = useId();
  return (
    <>
      <Button {...resto} aria-disabled="true" aria-describedby={idDaAjuda}>
        {children}
      </Button>
      <span id={idDaAjuda} className="sr-only">
        Sacola disponível em breve
      </span>
    </>
  );
}
