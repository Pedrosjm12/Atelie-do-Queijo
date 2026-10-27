import estilos from './Compra.module.css';

type QuantityStepperProps = {
  valor: number;
  onChange: (valor: number) => void;
  /** Spec §7.2, item 8: mínimo 1. */
  minimo?: number;
};

/** Seletor de quantidade (spec §7.2, item 8): − número +. */
export function QuantityStepper({ valor, onChange, minimo = 1 }: QuantityStepperProps) {
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
        onClick={() => onChange(valor + 1)}
      >
        +
      </button>
    </div>
  );
}
