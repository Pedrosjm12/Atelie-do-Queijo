import 'server-only';
import { NUMERO_WHATSAPP_FICTICIO } from '@/data/ficticio';

// Módulo SÓ DO SERVIDOR (ADR-0013): a variável `WHATSAPP_NUMBER` não tem o prefixo `NEXT_PUBLIC_`,
// então o Next nunca a embute no pacote do navegador. O `import 'server-only'` é tratado pelo
// próprio Next (o pacote npm é opcional); no Vitest vira vazio (ver vitest.config.mts).

const FORMATO_DO_NUMERO = /^55\d{10,11}$/;

/**
 * Número do WhatsApp da loja, só dígitos. Roda SÓ NO SERVIDOR (`app/layout.tsx` o chama e passa o
 * resultado por prop; ADR-0010, decisão 4): `VERCEL_ENV` não chega ao navegador. Usa
 * `WHATSAPP_NUMBER` quando definida e no formato `55` + DDD + número (`^55\d{10,11}$`). Fora de
 * produção, cai no fictício. Com `VERCEL_ENV === 'production'` e variável ausente ou inválida,
 * devolve `null`: a interface esconde os links do WhatsApp.
 * Publicar fora da Vercel exige garantir `VERCEL_ENV` (ver docs/ambiente.md).
 */
export function numeroDoWhatsApp(): string | null {
  const definido = process.env.WHATSAPP_NUMBER?.replace(/\D/g, '') ?? '';
  if (FORMATO_DO_NUMERO.test(definido)) return definido;
  return process.env.VERCEL_ENV === 'production' ? null : NUMERO_WHATSAPP_FICTICIO;
}
