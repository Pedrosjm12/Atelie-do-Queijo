import type { ReactNode, SVGProps } from 'react';

// Ícones de traço da spec §4.10, com os paths exatos.
const caminhos = {
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  conta: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  sacola: (
    <>
      <path d="M5 8h14l-1 12H6Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  'seta-direita': <path d="M5 12h14M13 6l6 6-6 6" />,
  girar: (
    <>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  // Versão curta do "girar", usada nos botões: só os dois primeiros paths.
  'girar-curto': (
    <>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  frio: (
    <>
      <path d="M12 2v20M4 6l16 12M20 6L4 18" />
      <path d="M9 3l3 2 3-2M9 21l3-2 3 2" />
    </>
  ),
  'selo-certificado': (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14l-1.5 8 5-3 5 3-1.5-8" />
      <path d="M9.5 9l1.8 1.8L14.5 7.5" />
    </>
  ),
  pix: (
    <>
      <path d="M12 2l10 10-10 10L2 12Z" />
      <path d="M12 7l5 5-5 5-5-5Z" />
    </>
  ),
  conversa: <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z" />,
  'ver-por-dentro': (
    <>
      <path d="M3 15L19 9L21 13L5 19Z" />
      <path d="M3 15V9l16-6v6" />
    </>
  ),
  aproximar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4M11 8v6M8 11h6" />
    </>
  ),
  'tela-cheia': <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  presente: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1" />
      <path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6-0.5 6-2.5S14 5 12 9Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
  enviar: <path d="M4 12l16-8-6 16-2-6Z" />,
} satisfies Record<string, ReactNode>;

export type NomeDoIcone = keyof typeof caminhos;

type IconeProps = Omit<
  SVGProps<SVGSVGElement>,
  'children' | 'viewBox' | 'fill' | 'stroke' | 'strokeWidth' | 'width' | 'height'
> & {
  nome: NomeDoIcone;
  /** Largura e altura em px. */
  tamanho?: number;
  /** Espessura do traço: 1,5 padrão; 1,75 em botões cheios; 1,8 no WhatsApp. */
  espessura?: number;
  /** Sem rótulo o ícone é decorativo (aria-hidden); com rótulo vira role="img". */
  rotulo?: string;
};

export function Icone({ nome, tamanho = 20, espessura = 1.5, rotulo, ...resto }: IconeProps) {
  const acessibilidade = rotulo
    ? ({ role: 'img', 'aria-label': rotulo } as const)
    : ({ 'aria-hidden': true } as const);

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...acessibilidade}
      {...resto}
    >
      {caminhos[nome]}
    </svg>
  );
}
