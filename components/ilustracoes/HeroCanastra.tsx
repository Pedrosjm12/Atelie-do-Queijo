import { usePrefixoDeIds } from './prefixoDeIds';
import { atributosDeAcessibilidade, type PropsDaIlustracao } from './tipos';

/** Apêndice A.3: queijo do hero, com fatia cortada à frente, sobre ardósia. */
export function HeroCanastra({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 460 340"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      {...atributosDeAcessibilidade(
        'Queijo curado em 3D, com uma fatia cortada à frente, sobre ardósia',
        decorativa,
      )}
    >
      <defs>
        <radialGradient id={`${p}hh`} cx="50%" cy="46%" r="50%">
          <stop offset="0" stopColor="#C9A24B" stopOpacity="0.30" />
          <stop offset="0.6" stopColor="#C9A24B" stopOpacity="0.08" />
          <stop offset="1" stopColor="#C9A24B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}hr`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.38" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}ht`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="230" cy="160" rx="230" ry="160" fill={`url(#${p}hh)`} />
      <ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C" />
      <ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fillOpacity="0.55" />
      <path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill={`url(#${p}hr)`} />
      <ellipse cx="190" cy="150" rx="150" ry="46" fill={`url(#${p}ht)`} />
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
