import { Overline } from '@/components/Overline';
import { Seal } from '@/components/Seal';
import type { Cheese } from '@/data/cheeses';
import estilos from './Produto.module.css';

type CabecalhoDoProdutoProps = {
  queijo: Cheese;
};

/** Sobretítulo, nome, produtor, selos e descrição (spec §7.2, itens 1 a 5; §7.6 no celular). */
export function CabecalhoDoProduto({ queijo }: CabecalhoDoProdutoProps) {
  const { detalhe } = queijo;

  return (
    <>
      <Overline className={estilos.sobretitulo}>{queijo.tag}</Overline>
      <h1 className={`titulo-produto ${estilos.nome}`}>{queijo.nome}</h1>
      <p className={estilos.produtor}>{detalhe.produtor}</p>
      <ul className={estilos.selos} aria-label="Selos">
        {detalhe.selos.map((selo) => (
          <li key={selo.texto}>
            <Seal tipo={selo.tipo}>
              {selo.textoCurto ? (
                <>
                  <span className={estilos.soDesktop}>{selo.texto}</span>
                  <span className={estilos.soCelular}>{selo.textoCurto}</span>
                </>
              ) : (
                selo.texto
              )}
            </Seal>
          </li>
        ))}
      </ul>
      <p className={`${estilos.descricao} ${estilos.soDesktop}`}>{detalhe.descricao}</p>
      <p className={`${estilos.descricaoCurta} ${estilos.soCelular}`}>{detalhe.descricaoCurta}</p>
    </>
  );
}
