import estilos from './PhotoPlaceholder.module.css';

type PhotoPlaceholderProps = {
  /** Descrição que aparece em "[FOTO: descrição]". */
  descricao: string;
  /** 240 px (Brasil/Mundo), 220 px (kits), 200 px (artigos). */
  altura?: 240 | 220 | 200;
  /** Artigos: fundo --carvao, raio 12 e borda --pedra. */
  artigo?: boolean;
};

/** Substituir por `next/image` quando houver fotos. */
export function PhotoPlaceholder({
  descricao,
  altura = 240,
  artigo = false,
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`${estilos.caixa} ${artigo ? estilos.artigo : ''}`}
      style={{ height: altura }}
      role="img"
      aria-label={`Foto a ser inserida: ${descricao}`}
    >
      <span aria-hidden="true">[FOTO: {descricao}]</span>
    </div>
  );
}
