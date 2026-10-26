import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import type { Centavos } from '@/lib/dinheiro';
import { formatarPrecoOuLacuna } from '@/lib/format';
import { CabecalhoDeSecao } from './CabecalhoDeSecao';
import estilos from './Presentes.module.css';

interface Kit {
  nome: string;
  descricao: string;
  /** `null` = preço desconhecido: mostra a lacuna "R$ [PREÇO]". Nunca usar 0. */
  preco: Centavos | null;
}

// Vão para `data/kits.ts` quando `/presentes` precisar deles (etapa 7).
const KITS: readonly Kit[] = [
  {
    nome: 'Primeira Degustação',
    descricao: '3 queijos suaves, mel de flores e guia de degustação.',
    preco: null,
  },
  { nome: 'Volta ao Mundo', descricao: '5 queijos de 5 países, com mapa de origem.', preco: null },
  {
    nome: 'Grande Cave',
    descricao: '7 queijos, tábua de madeira maciça e faca de queijo.',
    preco: null,
  },
];

/** Presentes (spec §5.7). */
export function Presentes() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-presentes">
      <CabecalhoDeSecao
        sobretitulo="PRESENTES"
        titulo={
          <>
            Presentes que se abrem <em>como um ritual.</em>
          </>
        }
        idDoTitulo="titulo-presentes"
        paragrafo="Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão."
        larguraDoParagrafo={560}
        link={{ href: '/presentes', texto: 'Ver todos os presentes →' }}
      />
      <ul className={estilos.grade}>
        {KITS.map((kit) => (
          <li key={kit.nome}>
            <article className={estilos.cartao}>
              <div className={estilos.foto}>
                <PhotoPlaceholder
                  descricao={`kit ${kit.nome}`}
                  textoVisivel="[FOTO DO KIT]"
                  altura={220}
                />
              </div>
              <div className={estilos.corpo}>
                <h3 className={`titulo-cartao ${estilos.nome}`}>{kit.nome}</h3>
                <p className={estilos.descricao}>{kit.descricao}</p>
                <p className={estilos.preco}>{formatarPrecoOuLacuna(kit.preco)}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
