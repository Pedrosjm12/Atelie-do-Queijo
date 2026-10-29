import { QUANTIDADE_MAXIMA_POR_ITEM } from '@/lib/sacola';
import estilos from './QuantityStepper.module.css';

type QuantityStepperProps = {
  valor: number;
  onChange: (valor: number) => void;
  /** Spec §7.2, item 8: mínimo 1. */
  minimo?: number;
  /** P35: 10 unidades por linha. O + fica `aria-disabled` (opacidade 0,5, P19) ao chegar nele. */
  maximo?: number;
};

/** Seletor de quantidade (spec §7.2, item 8): − número +. */
export function QuantityStepper({
  valor,
  onChange,
  minimo = 1,
  maximo = QUANTIDADE_MAXIMA_POR_ITEM,
}: QuantityStepperProps) {
  return (
    <div className={estilos.quantidade}>
      <button
        type="button"
        className={estilos.passo}
        aria-label="Diminuir quantidade"
        aria-disabled={valor <= minimo ? 'true' : undefined}
        onClick={() => {
          if (valor > minimo) onChange(valor - 1);
        }}
      >
        −
      </button>
      <output className={estilos.valor} aria-label="Quantidade">
        {valor}
      </output>
      <button
        type="button"
        className={estilos.passo}
        aria-label="Aumentar quantidade"
        aria-disabled={valor >= maximo ? 'true' : undefined}
        onClick={() => {
          if (valor < maximo) onChange(valor + 1);
        }}
      >
        +
      </button>
    </div>
  );
}
