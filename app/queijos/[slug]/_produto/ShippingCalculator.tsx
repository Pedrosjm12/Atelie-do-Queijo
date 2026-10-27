import { useId } from 'react';
import estilos from './Compra.module.css';

/**
 * Calculadora de frete (spec §7.2, item 10). Etapa 3: só a marcação. "Calcular" não tem ação,
 * sem máscara e sem resultado; a etapa 4 liga `calcularFrete(cep)`.
 */
export function ShippingCalculator() {
  const idDoAviso = useId();
  const idDoCep = useId();

  return (
    <div className={estilos.frete}>
      <label htmlFor={idDoCep} className={estilos.rotuloDoFrete}>
        Calcule o frete e o prazo
      </label>
      <div className={estilos.linhaDoFrete}>
        <input
          id={idDoCep}
          name="cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          className={estilos.campoDeCep}
        />
        <button
          type="button"
          className={estilos.calcular}
          aria-disabled="true"
          aria-describedby={idDoAviso}
        >
          Calcular
        </button>
        <span id={idDoAviso} hidden>
          Cálculo de frete disponível em breve
        </span>
      </div>
    </div>
  );
}
