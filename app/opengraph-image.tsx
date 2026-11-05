import { ImageResponse } from 'next/og';

// Duplica `IMAGEM_DE_COMPARTILHAMENTO` (lib/seo.ts): o Next lê estas exportações de forma estática
// e não aceita valores importados. Mantenha os dois iguais (há teste em lib/seo.test.ts).
export const alt = 'Ateliê do Queijo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Cores da §3.1: --cave, --ouro. Sem texto (P70 = A) e sem fonte nova.
const CAVE = '#14110F';
const OURO = '#C9A24B';

/**
 * Imagem de compartilhamento: fundo `--cave` e, ao centro, o bloco "símbolo sobre dourado" do
 * Apêndice A.2 (altura 120, raio 16, símbolo de 56 px, traço `--cave`) ampliado 3x, mantendo as
 * proporções: bloco 360, raio 48, símbolo 168.
 */
export default function ImagemDeCompartilhamento() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: CAVE,
      }}
    >
      <div
        style={{
          width: 360,
          height: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: OURO,
          borderRadius: 48,
        }}
      >
        <svg width="168" height="168" viewBox="0 0 34 34">
          <path
            d="M17 3L31 30H3Z"
            fill="none"
            stroke={CAVE}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M9.5 21H24.5" stroke={CAVE} strokeWidth="1.4" />
          <circle cx="17" cy="13.5" r="1.8" fill={CAVE} />
          <circle cx="13" cy="25.5" r="1.5" fill={CAVE} />
          <circle cx="21.5" cy="25.8" r="1.2" fill={CAVE} />
        </svg>
      </div>
    </div>,
    { ...size },
  );
}
