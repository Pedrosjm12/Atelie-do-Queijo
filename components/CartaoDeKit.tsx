import type { Kit } from '@/data/kits';
import { formatarPrecoOuLacuna } from '@/lib/format';
import estilos from './CartaoDeKit.module.css';
import { PhotoPlaceholder } from './PhotoPlaceholder';

type CartaoDeKitProps = {
  kit: Kit;
  /** h3 sob um h2 de seção (Home); h2 quando o cartão é filho direto do h1. */
  nivelDoTitulo: 'h2' | 'h3';
};

/** Cartão de kit (spec §5.7): foto 220, nome, descrição e preço (ou a lacuna "R$ [PREÇO]"). */
export function CartaoDeKit({ kit, nivelDoTitulo: Titulo }: CartaoDeKitProps) {
  return (
    <article className={estilos.cartao}>
      <div className={estilos.foto}>
        <PhotoPlaceholder descricao={`kit ${kit.nome}`} textoVisivel="[FOTO DO KIT]" altura={220} />
      </div>
      <div className={estilos.corpo}>
        <Titulo className={`titulo-cartao ${estilos.nome}`}>{kit.nome}</Titulo>
        <p className={estilos.descricao}>{kit.descricao}</p>
        <p className={estilos.preco}>{formatarPrecoOuLacuna(kit.preco)}</p>
      </div>
    </article>
  );
}
