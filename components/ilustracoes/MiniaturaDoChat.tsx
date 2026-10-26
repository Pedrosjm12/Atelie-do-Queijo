import { usePrefixoDeIds } from './prefixoDeIds';
import { atributosDeAcessibilidade, type PropsDaIlustracao } from './tipos';

/** Apêndice A.7: miniatura do cartão no chat (84 px de largura). */
export function MiniaturaDoChat({ className, decorativa }: PropsDaIlustracao) {
  const p = usePrefixoDeIds();
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={{ width: '84px', height: 'auto', flex: 'none' }}
      {...atributosDeAcessibilidade('Miniatura 3D do Canastra curado', decorativa)}
    >
      <defs>
        <linearGradient id={`${p}ar`} x1="0" x2="1">
          <stop offset="0" stopColor="#6E3D17" />
          <stop offset="0.4" stopColor="#C98B3E" />
          <stop offset="1" stopColor="#5A3112" />
        </linearGradient>
        <linearGradient id={`${p}at`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6BE6E" />
          <stop offset="1" stopColor="#B98436" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="164" rx="116" ry="13" fill="#000" fillOpacity="0.55" />
      <path d="M40 82V124A110 34 0 0 0 260 124V82Z" fill={`url(#${p}ar)`} />
      <ellipse cx="150" cy="82" rx="110" ry="34" fill={`url(#${p}at)`} />
    </svg>
  );
}
