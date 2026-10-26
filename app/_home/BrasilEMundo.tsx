import { Button } from '@/components/Button';
import { Overline } from '@/components/Overline';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import estilos from './BrasilEMundo.module.css';

const CARTOES = [
  {
    foto: 'produtor na câmara de maturação, Serra da Canastra',
    sobretitulo: 'QUEIJOS DO BRASIL',
    titulo: 'A nova geração de queijeiros',
    texto:
      'Canastra, Serro, Mantiqueira, Campo das Vertentes, Cuesta Paulista. Produtores brasileiros que vêm conquistando medalhas pelo mundo.',
    link: { href: '/queijos?origem=brasil', texto: 'Conhecer os brasileiros →' },
  },
  {
    foto: 'cave de maturação europeia, prateleiras de madeira',
    sobretitulo: 'QUEIJOS DO MUNDO',
    titulo: 'Os clássicos de origem',
    texto:
      'França, Itália, Suíça, Espanha, Portugal. Queijos de denominação de origem, importados com toda a documentação.',
    link: { href: '/queijos?origem=mundo', texto: 'Conhecer os importados →' },
  },
] as const;

/** "Do Brasil e do mundo" (spec §5.5). */
export function BrasilEMundo() {
  return (
    <section className={`conteudo ${estilos.secao}`} aria-labelledby="titulo-brasil-e-mundo">
      <h2 id="titulo-brasil-e-mundo" className={estilos.titulo}>
        Duas tradições, <em>uma mesma exigência.</em>
      </h2>
      <div className={estilos.grade}>
        {CARTOES.map((c) => (
          <article key={c.titulo} className={estilos.cartao}>
            <div className={estilos.foto}>
              <PhotoPlaceholder descricao={c.foto} altura={240} />
            </div>
            <div className={estilos.corpo}>
              <Overline tom="mofo">{c.sobretitulo}</Overline>
              <h3 className={`titulo-cartao-grande ${estilos.nome}`}>{c.titulo}</h3>
              <p className={estilos.texto}>{c.texto}</p>
              <Button href={c.link.href} variante="link" className={estilos.link}>
                {c.link.texto}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
