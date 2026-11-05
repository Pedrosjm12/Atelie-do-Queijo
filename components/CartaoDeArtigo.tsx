import Link from 'next/link';
import { nomeDaCategoria, type Artigo } from '@/data/artigos';
import estilos from './CartaoDeArtigo.module.css';
import { Overline } from './Overline';
import { PhotoPlaceholder } from './PhotoPlaceholder';

type CartaoDeArtigoProps = {
  artigo: Artigo;
  href: string;
  nivelDoTitulo: 'h2' | 'h3';
};

/** Item da Escola (spec §5.8): link inteiro com foto 200, sobretítulo `--mofo` e título 26/600. */
export function CartaoDeArtigo({ artigo, href, nivelDoTitulo: Titulo }: CartaoDeArtigoProps) {
  return (
    <Link href={href} className={estilos.item}>
      <PhotoPlaceholder descricao={artigo.foto} altura={200} artigo decorativa />
      <Overline pequeno tom="mofo" as="span" className={estilos.categoria}>
        {nomeDaCategoria(artigo.categoria)}
      </Overline>
      <Titulo className={`titulo-artigo ${estilos.nome}`}>{artigo.titulo}</Titulo>
    </Link>
  );
}
