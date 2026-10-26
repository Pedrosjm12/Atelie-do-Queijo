import type { SlugDoQueijo } from '@/data/cheeses';
import type { ComponentType } from 'react';
import { usePrefixoDeIds } from './prefixoDeIds';
import { atributosDeAcessibilidade, type PropsDaIlustracao } from './tipos';

/** Apêndice A.4: miniaturas da Home ("Na cave esta semana"). Um componente por queijo. */

const ESTILO = { width: '100%', height: 'auto', display: 'block' } as const;

/** A.4.1 Canastra curado */
export function MiniaturaCanastra({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={ESTILO}
      {...atributosDeAcessibilidade('Miniatura 3D do Canastra curado', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}h1`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.18" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}r1`} x1="0" x2="1">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.4" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}t1`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="95" rx="150" ry="95" fill={`url(#${p}h1)`} />
      <ellipse cx="150" cy="164" rx="116" ry="13" fill="#000" fillOpacity="0.55" />
      <path d="M40 82V124A110 34 0 0 0 260 124V82Z" fill={`url(#${p}r1)`} />
      <ellipse cx="150" cy="82" rx="110" ry="34" fill={`url(#${p}t1)`} />
      <ellipse cx="150" cy="82" rx="84" ry="25" fill="none" stroke="#8A5A22" strokeOpacity="0.35" />
    </svg>
  );
}

/** A.4.2 Brie francês */
export function MiniaturaBrie({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={ESTILO}
      {...atributosDeAcessibilidade('Miniatura 3D do brie francês', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}h2`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.18" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}r2`} x1="0" x2="1">
          <stop offset="0" stopColor="#B9AF9C" />
          <stop offset="0.4" stopColor="#EEE7D8" />
          <stop offset="1" stopColor="#A69C88" />
        </linearGradient>
        <linearGradient id={`${p}t2`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F8F3E8" />
          <stop offset="1" stopColor="#DDD4C2" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="95" rx="150" ry="95" fill={`url(#${p}h2)`} />
      <ellipse cx="150" cy="156" rx="122" ry="12" fill="#000" fillOpacity="0.55" />
      <path d="M30 96V122A120 34 0 0 0 270 122V96Z" fill={`url(#${p}r2)`} />
      <ellipse cx="150" cy="96" rx="120" ry="34" fill={`url(#${p}t2)`} />
      <ellipse
        cx="150"
        cy="96"
        rx="96"
        ry="26"
        fill="none"
        stroke="#B8AE9A"
        strokeOpacity="0.4"
        strokeDasharray="2 5"
      />
    </svg>
  );
}

/** A.4.3 Gorgonzola Dolce (com veios azuis) */
export function MiniaturaGorgonzola({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={ESTILO}
      {...atributosDeAcessibilidade('Miniatura 3D do Gorgonzola Dolce', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}h3`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.18" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}r3`} x1="0" x2="1">
          <stop offset="0" stopColor="#9C8F6E" />
          <stop offset="0.4" stopColor="#D6C9A4" />
          <stop offset="1" stopColor="#857958" />
        </linearGradient>
        <linearGradient id={`${p}t3`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F1E8CF" />
          <stop offset="1" stopColor="#D8CBA6" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="95" rx="150" ry="95" fill={`url(#${p}h3)`} />
      <ellipse cx="150" cy="164" rx="110" ry="13" fill="#000" fillOpacity="0.55" />
      <path d="M45 74V124A105 32 0 0 0 255 124V74Z" fill={`url(#${p}r3)`} />
      <ellipse cx="150" cy="74" rx="105" ry="32" fill={`url(#${p}t3)`} />
      <path
        d="M100 70c10-6 18 4 28-2M150 64c8 6 16-2 26 4M120 86c10-4 14 6 24 0M175 82c6 6 14 0 22 6"
        fill="none"
        stroke="#4C6070"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="110" cy="80" r="2.4" fill="#4C6070" />
      <circle cx="190" cy="70" r="2" fill="#4C6070" />
      <circle cx="160" cy="92" r="2.2" fill="#4C6070" />
    </svg>
  );
}

/** A.4.4 Cabra com cinzas */
export function MiniaturaCabra({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={ESTILO}
      {...atributosDeAcessibilidade('Miniatura 3D de queijo de cabra com cinzas', decorativa)}
    >
      <defs>
        <radialGradient id={`${p}h4`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.18" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}r4`} x1="0" x2="1">
          <stop offset="0" stopColor="#2C2B28" />
          <stop offset="0.4" stopColor="#5B5A54" />
          <stop offset="1" stopColor="#262522" />
        </linearGradient>
        <linearGradient id={`${p}t4`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6E6C65" />
          <stop offset="1" stopColor="#46453F" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="95" rx="150" ry="95" fill={`url(#${p}h4)`} />
      <ellipse cx="150" cy="160" rx="84" ry="12" fill="#000" fillOpacity="0.55" />
      <path d="M70 66V122A80 26 0 0 0 230 122V66Z" fill={`url(#${p}r4)`} />
      <ellipse cx="150" cy="66" rx="80" ry="26" fill={`url(#${p}t4)`} />
      <ellipse
        cx="150"
        cy="66"
        rx="56"
        ry="17"
        fill="none"
        stroke="#9A988F"
        strokeOpacity="0.3"
        strokeDasharray="1 4"
      />
    </svg>
  );
}

/** Miniaturas A.4 por slug. Queijos fora do mapa usam o gerador A.6. */
const POR_SLUG = {
  'canastra-curado': MiniaturaCanastra,
  'brie-frances': MiniaturaBrie,
  'gorgonzola-dolce': MiniaturaGorgonzola,
  'cabra-com-cinzas': MiniaturaCabra,
} as const satisfies Partial<Record<SlugDoQueijo, ComponentType<PropsDaIlustracao>>>;

export const MINIATURAS_DA_CAVE: Readonly<Record<string, ComponentType<PropsDaIlustracao>>> =
  POR_SLUG;
