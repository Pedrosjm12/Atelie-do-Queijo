import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Overline } from '@/components/Overline';
import estilos from './CabecalhoDeSecao.module.css';

type CabecalhoDeSecaoProps = {
  /** Sobretítulo em maiúsculas. */
  sobretitulo: string;
  /** Conteúdo do h2 (pode ter `<em>`). */
  titulo: ReactNode;
  /** `id` do h2, para `aria-labelledby` da seção. */
  idDoTitulo: string;
  paragrafo: string;
  /** Largura máxima do parágrafo em px (520 na §5.4, 560 na §5.7). */
  larguraDoParagrafo: 520 | 560;
  link: { href: string; texto: string };
};

/** Cabeçalho das seções "Na cave esta semana" (§5.4) e "Presentes" (§5.7). */
export function CabecalhoDeSecao({
  sobretitulo,
  titulo,
  idDoTitulo,
  paragrafo,
  larguraDoParagrafo,
  link,
}: CabecalhoDeSecaoProps) {
  return (
    <div className={estilos.cabecalho}>
      <div>
        <Overline className={estilos.sobretitulo}>{sobretitulo}</Overline>
        <h2 id={idDoTitulo}>{titulo}</h2>
        <p className={estilos.paragrafo} style={{ maxWidth: larguraDoParagrafo }}>
          {paragrafo}
        </p>
      </div>
      <Button href={link.href} variante="link">
        {link.texto}
      </Button>
    </div>
  );
}
