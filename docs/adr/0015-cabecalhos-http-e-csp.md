# ADR-0015 — Cabeçalhos HTTP de segurança e política de conteúdo (CSP)

- **Status:** Aceito (aprovado pelo dono em 2026-11-05: P68 = A do `docs/PLANO.md`, CSP estática com `'unsafe-inline'`)
- **Data:** 2026-11-05 (proposto e aceito)
- **Contexto da etapa:** 8 (rodada de qualidade; segurança)

## Contexto

O site não envia nenhum cabeçalho de segurança: `next.config.ts` só define o limite das Server Actions, e o Next envia `X-Powered-By`. A etapa 4 deixou para a etapa 8 o ADR de CSP e a lista de cabeçalhos estáticos (PLANO, "Fica para depois (segurança e LGPD)"); o ADR-0009 anotou o que o `model-viewer` vai pedir quando houver GLB comprimido; o ADR-0010 anotou que os links `wa.me` são navegação e não mudam a política.

Estado que pesa na escolha:

- Quase todas as páginas são **estáticas** (pré-renderizadas no build); só `/queijos` lê `searchParams`. A documentação do Next 16 (guia "Content Security Policy", atualizado em 2026-03-20) diz que **nonce exige renderização dinâmica de todas as páginas**: perde pré-renderização, cache de CDN e soma tempo de servidor a cada visita.
- O App Router injeta scripts *inline* (carga do RSC) em todas as páginas; sem nonce, `script-src` precisa de `'unsafe-inline'`.
- Há atributos `style` em componentes (ex.: variáveis CSS por `style`), então `style-src` precisa de `'unsafe-inline'`.
- O site não carrega nada de outro domínio: fontes por `next/font` (servidas pelo próprio site), `model-viewer` empacotado localmente (ADR-0009), nenhuma análise de terceiros.
- A loja é simulada; não há dado de cartão. O checkout real (Mercado Pago, D32) virá com ADR próprio na etapa 9.

## Decisão

1. **Cabeçalhos estáticos em `next.config.ts` `headers()`**, para todas as rotas, montados por uma função pura (`lib/cabecalhos.ts`) testada no Vitest:
   - `Content-Security-Policy` (item 2);
   - `Strict-Transport-Security: max-age=31536000` (sem `includeSubDomains` e sem `preload` até o domínio ser decidido na etapa 9; o navegador ignora o cabeçalho em HTTP, então não afeta `localhost`);
   - `X-Content-Type-Options: nosniff`;
   - `Referrer-Policy: strict-origin-when-cross-origin`;
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`;
   - `X-Frame-Options: DENY` (complemento do `frame-ancestors 'none'` para navegadores antigos);
   - `poweredByHeader: false`.
2. **CSP estática, sem nonce, com `'unsafe-inline'` em `script-src` e `style-src`** (P68 = A, decidido pelo dono):
   `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, mais `upgrade-insecure-requests` **só com `VERCEL_ENV=production`**. Em `next dev`, `script-src` ganha `'unsafe-eval'` (o React usa `eval` só em desenvolvimento, segundo a documentação).
   O ganho real, mesmo com `'unsafe-inline'`: nenhum script ou recurso de outro domínio, nenhum `<object>`, nenhum `<base>` injetado, formulários só para o próprio site, nenhuma moldura de outro site (clickjacking) e `connect-src` fechado (dados não saem para outro domínio por `fetch`).
3. **Aplicada direto (não `Report-Only`).** Não há destino para relatórios de violação (seria coletar dados de navegação, com LGPD); a garantia vem dos e2e, que já falham com qualquer erro no console, e uma violação de CSP aparece no console.
4. **Diretivas do 3D só com o primeiro GLB comprimido** (bloco C da etapa 5): `worker-src 'self' blob:` e `'wasm-unsafe-eval'` em `script-src`, conforme o ADR-0009. Nada é aberto antes de ser preciso.
5. **Revisão obrigatória no ADR do gateway (etapa 9):** o checkout real pode pedir domínios do Mercado Pago em `script-src`, `frame-src` e `connect-src`, e `payment` em `Permissions-Policy`. Nessa hora, reavaliar nonce (opção B) ou SRI (opção C) **para as rotas de pagamento**.

## Alternativas consideradas

- **B) Nonce por requisição com `proxy.ts`** (`'nonce-…' 'strict-dynamic'`, sem `'unsafe-inline'`): a política mais forte contra script injetado, mas todas as páginas viram dinâmicas. Para um site de conteúdo estático, sem entrada de usuário refletida no HTML (o React escapa tudo e não há `dangerouslySetInnerHTML` fora do JSON-LD escapado), o custo em desempenho e hospedagem não se paga hoje. Rejeitada agora; volta no ADR do gateway.
- **C) SRI experimental (`experimental.sri`) + CSP sem `'unsafe-inline'`:** mantém o estático, mas é experimental e o SRI cobre os arquivos `.js`, não os scripts *inline* do App Router, que seriam bloqueados sem `'unsafe-inline'` ou hash. Exige prova prática antes de qualquer decisão. Rejeitada agora; registrada como *spike* para o ADR do gateway.
- **`Content-Security-Policy-Report-Only` primeiro:** útil com coleta de relatórios em produção, que não existe. Rejeitada (ver decisão 3).
- **`Cross-Origin-Opener-Policy` e `Cross-Origin-Embedder-Policy`:** não há caso de uso (sem `SharedArrayBuffer`, sem janelas de pagamento ainda) e o COEP pode quebrar recursos futuros. Ficam de fora.

## Consequências

- Nenhum kB de JavaScript novo; as páginas continuam estáticas.
- Qualquer recurso externo novo (fonte, script, imagem de CDN, análise) passa a exigir mudança explícita em `lib/cabecalhos.ts`, revisada pelo `auditor-de-seguranca`.
- O JSON-LD (`<script type="application/ld+json">`) é bloco de dados, não é executado, e não é afetado pela política; o texto continua escapado (`<` como `<`).
- Os e2e passam a conferir os cabeçalhos em uma página estática, uma dinâmica (`/queijos`), o checkout (Server Action) e a 404, e a ausência de `X-Powered-By`.
- `'unsafe-inline'` em `script-src` é uma fraqueza conhecida, **aceita pelo dono em 2026-11-05** (P68 = A) até o ADR do gateway: a política não bloqueia um script *inline* injetado. A defesa contra isso continua sendo não refletir entrada de usuário no HTML (React escapa tudo; `dangerouslySetInnerHTML` só em `components/DadosEstruturados.tsx`, com `<` escapado, conferido pelo `revisor-de-codigo`).
- A imagem de compartilhamento (`app/opengraph-image.tsx`, `next/og`, P70 = A) e o ícone (`app/icon.svg`) são servidos pelo próprio site: `img-src 'self'` basta, sem domínio novo. Os buscadores e as redes que leem a imagem não são afetados pela CSP (ela vale só para páginas abertas no navegador).
- Respostas relacionadas da mesma rodada: o limite de taxa nas Server Actions fica **adiado** (P75 = A) e entra junto com esta revisão, no ADR do gateway; a `NEXT_PUBLIC_SITE_URL` é obrigatória e `https` em produção (P69 = A), o que mantém o `upgrade-insecure-requests` coerente com a URL canônica.
