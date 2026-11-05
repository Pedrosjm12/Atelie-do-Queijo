# ADR-0013 — Número do WhatsApp só no servidor: `WHATSAPP_NUMBER` e `server-only`

- **Status:** Aceito (decisão do dono, 2026-11-05)
- **Data:** 2026-11-05
- **Contexto da etapa:** 8 (rodada de qualidade; segurança)

## Contexto

A variável se chamava `NEXT_PUBLIC_WHATSAPP_NUMBER`. Embora o número fosse resolvido no servidor (ADR-0010, decisão 4), o prefixo `NEXT_PUBLIC_` faz o Next embutir a variável em qualquer código de navegador que a leia, e sugere que ela é pública.

## Decisão

1. Renomear para **`WHATSAPP_NUMBER`** (sem prefixo). O valor só existe no processo do servidor.
2. Mover `numeroDoWhatsApp()` de `data/ficticio.ts` para **`lib/whatsapp.server.ts`**, que começa com `import 'server-only'`. Se um Client Component importar o módulo, o build falha. `NUMERO_WHATSAPP_FICTICIO` fica em `data/ficticio.ts`.
3. `app/layout.tsx` continua sendo o único chamador. O teste `data/numeroDoWhatsApp.cliente.test.ts` segue barrando arquivos `'use client'` que importem `numeroDoWhatsApp` ou `lib/whatsapp.server`.
4. **Sem dependência nova.** O Next 16 resolve `import 'server-only'` sozinho (o pacote npm é opcional; já é assim em `lib/pedido.server.ts`). No Vitest, o alias `server-only` aponta para `vitest.server-only.ts` (vazio).

## Consequências

- **Ação do dono:** criar `WHATSAPP_NUMBER` no `.env.local` e nas variáveis da Vercel (Production e Preview). A antiga `NEXT_PUBLIC_WHATSAPP_NUMBER` não é mais lida.
- O número, quando chega ao navegador, vem dentro dos links `wa.me` e do HTML; isso é inevitável (são links para o público). O número fictício não aparece em `.next/static` (conferido após o build).
- A spec (§8.3 e §14) ainda cita `NEXT_PUBLIC_WHATSAPP_NUMBER`; o texto da spec não foi alterado e deve ser atualizado pelo dono.
