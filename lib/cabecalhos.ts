// Importado pelo next.config.ts (carregado pelo Node antes do build): sem CSS, sem server-only, sem React.
/**
 * Cabeçalhos HTTP de segurança e política de conteúdo (ADR-0015).
 * Módulo puro: o `next.config.ts` o importa; nada de cliente depende dele.
 * Qualquer recurso externo novo exige mudança explícita aqui, revisada pelo auditor de segurança.
 */

export type OpcoesDeCabecalhos = {
  /** Só em `next dev` (fase `phase-development-server` no `next.config.ts`): o React usa `eval` só aí. */
  desenvolvimento: boolean;
  /** `VERCEL_ENV === 'production'`: só então força HTTPS nos subrecursos. */
  producao: boolean;
};

/** Só em `next dev` o React usa `eval`; `next build`/`start` nunca recebem `'unsafe-eval'`, qualquer que seja o NODE_ENV. */
export function ehServidorDeDesenvolvimento(fase: string): boolean {
  return fase === 'phase-development-server';
}

export function politicaDeConteudo({ desenvolvimento, producao }: OpcoesDeCabecalhos): string {
  const diretivas = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (producao) diretivas.push('upgrade-insecure-requests');
  return diretivas.join('; ');
}

export function cabecalhosDeSeguranca(
  opcoes: OpcoesDeCabecalhos,
): readonly { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: politicaDeConteudo(opcoes) },
    // Sem includeSubDomains e sem preload até o domínio ser decidido (etapa 9).
    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'X-Frame-Options', value: 'DENY' },
  ];
}
