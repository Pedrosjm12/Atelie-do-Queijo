import Link from 'next/link';
import type { Cheese } from '@/data/cheeses';
import { dadosDoCartao } from '@/lib/catalogo';
import { formatarPreco } from '@/lib/format';
import { BotaoDaSacola } from './BotaoDaSacola';
import { CheeseIllustration } from './CheeseIllustration';
import { MINIATURAS_DA_CAVE } from './ilustracoes/MiniaturasDaCave';
import { Overline } from './Overline';
import estilos from './ProductCard.module.css';

type ProductCardProps = {
  queijo: Cheese;
  /** 'home': gap 12, textos da vitrine e miniatura A.4. 'catalogo': gap 10, §9 pura e gerador A.6. */
  contexto: 'home' | 'catalogo';
};

/** Cartão de produto (spec 4.6). O botão Adicionar ganha ação na etapa 4. */
export function ProductCard({ queijo, contexto }: ProductCardProps) {
  const { tag, nota, linhaPequena, preco } = dadosDoCartao(queijo, contexto);
  const catalogo = contexto === 'catalogo';
  const Miniatura = catalogo ? undefined : MINIATURAS_DA_CAVE[queijo.slug];

  return (
    <article
      className={[estilos.cartao, catalogo ? estilos.catalogo : ''].filter(Boolean).join(' ')}
    >
      {Miniatura ? (
        <Miniatura />
      ) : (
        <CheeseIllustration {...queijo.ilustracao} label={queijo.nome} />
      )}
      <Overline pequeno catalogo={catalogo}>
        {tag}
      </Overline>
      <h3 className={estilos.nome}>
        <Link href={`/queijos/${queijo.slug}`}>{queijo.nome}</Link>
      </h3>
      <p className={estilos.nota}>{nota}</p>
      <div className={estilos.rodape}>
        <div>
          <span className={estilos.linhaPequena}>{linhaPequena}</span>
          <span className={estilos.preco}>{formatarPreco(preco)}</span>
        </div>
        <BotaoDaSacola
          variante="contorno"
          tamanho="compacto"
          aria-label={`Adicionar ${queijo.nome} à sacola`}
        >
          Adicionar
        </BotaoDaSacola>
      </div>
    </article>
  );
}
