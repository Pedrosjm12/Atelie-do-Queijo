import type { Shape } from '@/data/cheeses';

/** Gerador de miniaturas do Apêndice A.6, copiado da spec. */
const SHAPES = {
  wide: { rx: 110, ry: 34, h: 44, ty: 76 },
  tall: { rx: 84, ry: 26, h: 66, ty: 62 },
  flat: { rx: 118, ry: 34, h: 30, ty: 86 },
  small: { rx: 74, ry: 24, h: 50, ty: 72 },
} as const satisfies Record<Shape, { rx: number; ry: number; h: number; ty: number }>;

export type CheeseShape = Shape;

export interface CheeseIllustrationProps {
  shape: CheeseShape;
  side: string;
  top: string;
  /** Nome do queijo; vira "<nome>, ilustração do queijo". */
  label: string;
  className?: string;
  /** Sem `role="img"` nem rótulo (o contexto já nomeia o queijo). */
  decorativa?: boolean;
}

/** Sem gradientes nem ids: nunca colide, pode repetir à vontade na página. */
export function CheeseIllustration({
  shape,
  side,
  top,
  label,
  className,
  decorativa,
}: CheeseIllustrationProps) {
  const g = SHAPES[shape];
  const sideD = `M${150 - g.rx} ${g.ty}V${g.ty + g.h}A${g.rx} ${g.ry} 0 0 0 ${150 + g.rx} ${g.ty + g.h}V${g.ty}Z`;
  const a11y = decorativa
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': `${label}, ilustração do queijo` } as const);
  return (
    <svg
      viewBox="0 0 300 190"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      {...a11y}
    >
      {/* halo */}
      <ellipse cx="150" cy="95" rx="150" ry="95" fill="#C9A24B" fillOpacity={0.07} />
      {/* sombra */}
      <ellipse
        cx="150"
        cy={g.ty + g.h + 10}
        rx={Math.round(g.rx * 1.05)}
        ry="12"
        fill="#000"
        fillOpacity={0.55}
      />
      {/* lateral (casca) */}
      <path d={sideD} fill={side} />
      {/* topo */}
      <ellipse cx="150" cy={g.ty} rx={g.rx} ry={g.ry} fill={top} />
      {/* anel interno */}
      <ellipse
        cx="150"
        cy={g.ty}
        rx={Math.round(g.rx * 0.74)}
        ry={Math.round(g.ry * 0.74)}
        fill="none"
        stroke="#000"
        strokeOpacity={0.14}
      />
    </svg>
  );
}
