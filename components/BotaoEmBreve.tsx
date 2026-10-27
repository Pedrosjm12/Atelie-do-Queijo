import { useId, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';

type BotaoEmBreveProps = {
  children: ReactNode;
  /** Texto lido por leitores de tela, ex.: "Sacola disponível em breve". */
  aviso: string;
  'aria-label'?: string;
  variante?: 'principal' | 'secundario' | 'contorno' | 'link';
  tamanho?: 'padrao' | 'compacto';
  style?: CSSProperties;
};

/**
 * Botão cuja ação chega em outra etapa. Fica focável e visualmente igual, mas anuncia
 * `aria-disabled` e a descrição `aviso`. Quem liga a ação troca este componente pelo `Button`.
 */
export function BotaoEmBreve({ children, aviso, ...resto }: BotaoEmBreveProps) {
  const idDoAviso = useId();
  return (
    <>
      <Button {...resto} aria-disabled="true" aria-describedby={idDoAviso}>
        {children}
      </Button>
      <span id={idDoAviso} className="sr-only">
        {aviso}
      </span>
    </>
  );
}
