import { Overline } from '@/components/Overline';
import type { Formato } from '@/data/cheeses';
import { formatarPreco } from '@/lib/format';
import estilos from './Compra.module.css';

type FormatPickerProps = {
  formatos: readonly Formato[];
  selecionadoId: string;
  onSelecionar: (id: string) => void;
};

/**
 * Escolha do formato (spec §7.2, item 6; §7.6 no celular). No desktop, duas linhas: nome e
 * "peso · preço". No celular, três colunas com o nome curto e só o peso.
 */
export function FormatPicker({ formatos, selecionadoId, onSelecionar }: FormatPickerProps) {
  return (
    <fieldset className={estilos.formatos}>
      <legend className={estilos.legenda}>
        <Overline as="span">FORMATO</Overline>
      </legend>
      <div className={estilos.opcoes}>
        {formatos.map((formato) => {
          const selecionado = formato.id === selecionadoId;
          return (
            <button
              key={formato.id}
              type="button"
              className={
                selecionado ? `${estilos.formato} ${estilos.formatoAtivo}` : estilos.formato
              }
              aria-pressed={selecionado}
              onClick={() => onSelecionar(formato.id)}
            >
              <span className={estilos.formatoNome}>
                <span className={estilos.soDesktop}>{formato.nome}</span>
                <span className={estilos.soCelular}>{formato.nomeCurto ?? formato.nome}</span>
              </span>
              <span className={estilos.formatoDetalhe}>
                {formato.peso}
                <span className={estilos.soDesktop}> · {formatarPreco(formato.preco)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
