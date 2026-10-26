import type { SlugDoQueijo } from '@/data/cheeses';
import type { ComponentType } from 'react';
import { usePrefixoDeIds } from './prefixoDeIds';
import { atributosDeAcessibilidade, type PropsDaIlustracao } from './tipos';

/** Apêndice A.5: ilustrações da página de produto do Canastra curado. */

const ESTILO_PALCO = {
  width: '100%',
  height: 'auto',
  display: 'block',
  marginTop: '16px',
} as const;
const ESTILO_CELULAR = { width: '100%', height: 'auto', display: 'block' } as const;

/** A.5.1 Cortado, "POR DENTRO" (estado padrão). */
export function CanastraCortado({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 460 340"
      className={className}
      style={ESTILO_PALCO}
      {...atributosDeAcessibilidade(
        'Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras',
        decorativa,
      )}
    >
      <defs>
        <radialGradient id={`${p}ph`} cx="50%" cy="46%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.30" />
          <stop offset="0.6" stopColor="#C9A24B" stopOpacity="0.08" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}pr`} x1="0" x2="1">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.38" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}pt`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="230" cy="160" rx="230" ry="160" fill={`url(#${p}ph)`} />
      <ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C" />
      <ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fillOpacity="0.55" />
      <path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill={`url(#${p}pr)`} />
      <ellipse cx="190" cy="150" rx="150" ry="46" fill={`url(#${p}pt)`} />
      <ellipse
        cx="190"
        cy="150"
        rx="118"
        ry="35"
        fill="none"
        stroke="#8A5A22"
        strokeOpacity="0.35"
      />
      <ellipse
        cx="190"
        cy="150"
        rx="78"
        ry="23"
        fill="none"
        stroke="#8A5A22"
        strokeOpacity="0.25"
      />
      <ellipse cx="362" cy="288" rx="62" ry="9" fill="#000" fillOpacity="0.5" />
      <path d="M296 206L414 220L384 250Z" fill="#DDB262" />
      <path d="M296 206L384 250L384 286L296 242Z" fill="#F0CF84" />
      <path d="M384 250L414 220L414 256L384 286Z" fill="#7A4419" />
      <ellipse cx="322" cy="234" rx="5" ry="3.5" fill="#C99B4A" />
      <ellipse cx="350" cy="252" rx="4" ry="3" fill="#C99B4A" />
      <ellipse cx="333" cy="258" rx="3" ry="2.2" fill="#C99B4A" />
      <ellipse cx="364" cy="268" rx="3.4" ry="2.4" fill="#C99B4A" />
    </svg>
  );
}

/** A.5.2 Inteiro, "PEÇA INTEIRA". */
export function CanastraInteiro({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 460 340"
      className={className}
      style={ESTILO_PALCO}
      {...atributosDeAcessibilidade('Canastra curado, peça inteira', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}wh`} cx="50%" cy="46%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.30" />
          <stop offset="0.6" stopColor="#C9A24B" stopOpacity="0.08" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}wr`} x1="0" x2="1">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.38" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}wt`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="230" cy="160" rx="230" ry="160" fill={`url(#${p}wh)`} />
      <ellipse cx="230" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C" />
      <ellipse cx="230" cy="258" rx="160" ry="22" fill="#000" fillOpacity="0.55" />
      <path d="M80 150V214A150 46 0 0 0 380 214V150Z" fill={`url(#${p}wr)`} />
      <ellipse cx="230" cy="150" rx="150" ry="46" fill={`url(#${p}wt)`} />
      <ellipse
        cx="230"
        cy="150"
        rx="118"
        ry="35"
        fill="none"
        stroke="#8A5A22"
        strokeOpacity="0.35"
      />
      <ellipse
        cx="230"
        cy="150"
        rx="78"
        ry="23"
        fill="none"
        stroke="#8A5A22"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

/** A.5.3 Versão do celular (cortado). Desenho mais simples que o A.5.1, como na spec. */
export function CanastraCortadoCelular({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 460 340"
      className={className}
      style={ESTILO_CELULAR}
      {...atributosDeAcessibilidade('Canastra curado em 3D, com fatia cortada', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}mh`} cx="50%" cy="46%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.30" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}mr`} x1="0" x2="1">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.38" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}mt`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="230" cy="170" rx="230" ry="160" fill={`url(#${p}mh)`} />
      <ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C" />
      <ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fillOpacity="0.55" />
      <path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill={`url(#${p}mr)`} />
      <ellipse cx="190" cy="150" rx="150" ry="46" fill={`url(#${p}mt)`} />
      <ellipse
        cx="190"
        cy="150"
        rx="118"
        ry="35"
        fill="none"
        stroke="#8A5A22"
        strokeOpacity="0.35"
      />
      <ellipse cx="362" cy="288" rx="62" ry="9" fill="#000" fillOpacity="0.5" />
      <path d="M296 206L414 220L384 250Z" fill="#DDB262" />
      <path d="M296 206L384 250L384 286L296 242Z" fill="#F0CF84" />
      <path d="M384 250L414 220L414 256L384 286Z" fill="#7A4419" />
      <ellipse cx="322" cy="234" rx="5" ry="3.5" fill="#C99B4A" />
      <ellipse cx="350" cy="252" rx="4" ry="3" fill="#C99B4A" />
      <ellipse cx="364" cy="268" rx="3.4" ry="2.4" fill="#C99B4A" />
    </svg>
  );
}

export interface IlustracoesDeProduto {
  cortado: ComponentType<PropsDaIlustracao>;
  inteiro: ComponentType<PropsDaIlustracao>;
  cortadoCelular: ComponentType<PropsDaIlustracao>;
}

/** Ilustrações A.5 por slug. Queijos fora do mapa usam o gerador A.6 sem corte (P3). */
const POR_SLUG = {
  'canastra-curado': {
    cortado: CanastraCortado,
    inteiro: CanastraInteiro,
    cortadoCelular: CanastraCortadoCelular,
  },
} as const satisfies Partial<Record<SlugDoQueijo, IlustracoesDeProduto>>;

export const ILUSTRACOES_DE_PRODUTO: Readonly<Record<string, IlustracoesDeProduto>> = POR_SLUG;
