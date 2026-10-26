import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './Button.module.css';
import { Icone } from './icons';

type VarianteComLink = 'principal' | 'secundario' | 'contorno' | 'link';

type Comum = {
  children: ReactNode;
  className?: string;
  /** Seta → (18 px, traço 1,75) à direita do texto. */
  seta?: boolean;
  /** "compacto": secundário e principal com 48 px; chip do catálogo (44 px, 0 20px, 14 px, 600). */
  tamanho?: 'padrao' | 'compacto';
};

type PropsLink = Comum &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
    href: string;
    variante?: VarianteComLink;
    selecionado?: never;
  };

type PropsBotao = Comum &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'aria-pressed'> & {
    href?: undefined;
    variante?: VarianteComLink;
    selecionado?: never;
  };

/** Chip de quiz/filtro: sempre um <button> com aria-pressed. */
type PropsOpcao = Comum &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'aria-pressed'> & {
    href?: undefined;
    variante: 'opcao';
    selecionado: boolean;
  };

export type ButtonProps = PropsLink | PropsBotao | PropsOpcao;

/**
 * Botões da spec 4.4. Com `href` renderiza `next/link`; sem, um <button type="button">.
 * O padding horizontal vem de `--botao-padding-x` (30 px padrão; a Home usa 32 px no quiz e
 * 28 px na newsletter), definido por quem usa via `style`.
 */
export function Button(props: ButtonProps) {
  const variante = props.variante ?? 'principal';
  const classes = [
    estilos.botao,
    estilos[variante],
    props.tamanho === 'compacto' ? estilos.compacto : '',
    props.className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const conteudo = (
    <>
      {props.children}
      {props.seta && <Icone nome="seta-direita" tamanho={18} espessura={1.75} />}
    </>
  );

  if (props.href !== undefined) {
    const { href, ...resto } = atributosNativos(props, []);
    return (
      <Link href={href} className={classes} {...resto}>
        {conteudo}
      </Link>
    );
  }

  const { type = 'button', ...resto } = atributosNativos(props, ['href']);
  const opcao = props.variante === 'opcao';

  return (
    <button
      type={type}
      className={opcao && props.selecionado ? `${classes} ${estilos.selecionada}` : classes}
      {...resto}
      aria-pressed={opcao ? props.selecionado : undefined}
    >
      {conteudo}
    </button>
  );
}

const PROPS_PROPRIAS = [
  'children',
  'className',
  'seta',
  'variante',
  'selecionado',
  'tamanho',
] as const;
type PropsProprias = (typeof PROPS_PROPRIAS)[number];

/** Remove as props que o Button consome (e as extras pedidas), deixando só atributos nativos. */
function atributosNativos<T extends ButtonProps>(props: T, extras: readonly string[]) {
  const resto: Record<string, unknown> = { ...props };
  for (const chave of [...PROPS_PROPRIAS, ...extras]) delete resto[chave];
  return resto as Omit<T, PropsProprias>;
}
