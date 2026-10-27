import { useId } from 'react';
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
  const nomeDoGrupo = useId();
  return (
    <fieldset className={estilos.formatos}>
      <legend className={estilos.legenda}>
        <Overline as="span">FORMATO</Overline>
      </legend>
      <div className={estilos.opcoes}>
        {formatos.map((formato) => {
          const selecionado = formato.id === selecionadoId;
          return (
            <label
              key={formato.id}
              className={
                selecionado ? `${estilos.formato} ${estilos.formatoAtivo}` : estilos.formato
              }
            >
              <input
                type="radio"
                name={nomeDoGrupo}
                value={formato.id}
                checked={selecionado}
                onChange={() => onSelecionar(formato.id)}
                className="sr-only"
              />
              <span className={estilos.formatoNome}>
                <span className={estilos.soDesktop}>{formato.nome}</span>
                <span className={estilos.soCelular}>{formato.nomeCurto ?? formato.nome}</span>
              </span>
              <span className={estilos.formatoDetalhe}>
                {formato.peso}
                <span className={estilos.soDesktop}> · {formatarPreco(formato.preco)}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
