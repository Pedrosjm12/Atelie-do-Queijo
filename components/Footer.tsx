import Link from 'next/link';
import estilos from './Footer.module.css';
import { NomeDaMarca } from './Logo';
import { Overline } from './Overline';

/**
 * Destinos: rotas da spec 10.5. "Sobre" e "Nossos produtores" são a mesma página (/produtores).
 * Entregas, trocas e perguntas frequentes ainda não têm página nem rota na spec: aparecem como
 * texto sem link até o dono do projeto definir o conteúdo.
 */
const colunas = [
  {
    titulo: 'Loja',
    links: [
      { href: '/queijos', rotulo: 'Queijos' },
      { href: '/presentes', rotulo: 'Presentes' },
      { href: '/presentes', rotulo: 'Presentes corporativos' },
    ],
  },
  {
    titulo: 'Ateliê',
    links: [
      { href: '/produtores', rotulo: 'Sobre' },
      { href: '/produtores', rotulo: 'Nossos produtores' },
      { href: '/aprenda', rotulo: 'Escola do Ateliê' },
    ],
  },
] as const;

const itensDeAjudaSemDestino = [
  'Entregas refrigeradas',
  'Trocas e devoluções',
  'Perguntas frequentes',
];

export function Footer() {
  return (
    <footer className={estilos.rodape}>
      <nav aria-label="Rodapé" className={`conteudo ${estilos.topo}`}>
        <div>
          <NomeDaMarca tamanho="rodape" />
          <p className={estilos.assinatura}>Queijos de autor, escolhidos à mão.</p>
        </div>

        {colunas.map(({ titulo, links }) => (
          <div key={titulo} className={estilos.coluna}>
            <Overline pequeno as="h2" className={estilos.tituloDaColuna}>
              {titulo}
            </Overline>
            <ul className={estilos.lista}>
              {links.map(({ href, rotulo }) => (
                <li key={rotulo}>
                  <Link href={href} className={`${estilos.item} ${estilos.link}`}>
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className={estilos.coluna}>
          <Overline pequeno as="h2" className={estilos.tituloDaColuna}>
            Ajuda
          </Overline>
          <ul className={estilos.lista}>
            {itensDeAjudaSemDestino.map((rotulo) => (
              <li key={rotulo}>
                <span className={estilos.item}>{rotulo}</span>
              </li>
            ))}
            <li>
              {/* Abrirá o painel de atendimento quando ele existir (etapa 3). */}
              <button type="button" className={`${estilos.item} ${estilos.botaoLink}`}>
                Fale conosco
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className={`conteudo ${estilos.base}`}>
        <p>Ateliê do Queijo · CNPJ [00.000.000/0000-00] · [Endereço]</p>
        <p>Produtos de origem animal com inspeção sanitária · Pix · Cartões</p>
      </div>
    </footer>
  );
}
