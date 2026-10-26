import estilos from './PhotoPlaceholder.module.css';

type PhotoPlaceholderProps = {
  /** Descrição que aparece em "[FOTO: descrição]". */
  descricao: string;
  /** 240 px (Brasil/Mundo), 220 px (kits), 200 px (artigos). */
  altura?: 240 | 220 | 200;
  /** Texto visível literal, quando difere de "[FOTO: descrição]" (ex.: "[FOTO DO KIT]"). */
  textoVisivel?: string;
  /** Dentro de um link que já tem nome: sem `role` nem rótulo, só `aria-hidden`. */
  decorativa?: boolean;
  /** Artigos: fundo --carvao, raio 12 e borda --pedra. */
  artigo?: boolean;
};

/** Substituir por `next/image` quando houver fotos. */
export function PhotoPlaceholder({
  descricao,
  altura = 240,
  artigo = false,
  textoVisivel,
  decorativa = false,
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`${estilos.caixa} ${artigo ? estilos.artigo : ''}`}
      style={{ height: altura }}
      {...(decorativa
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': `Foto a ser inserida: ${descricao}` })}
    >
      <span aria-hidden="true">{textoVisivel ?? `[FOTO: ${descricao}]`}</span>
    </div>
  );
}
