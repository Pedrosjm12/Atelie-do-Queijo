# ADR-0006 — Typecheck com `next typegen`

- **Status:** Aceito
- **Data:** 2026-10-26

## Contexto

Páginas tipadas com `PageProps<'/rota'>` dependem de tipos gerados em `.next/types`, que só existiam depois de um `next dev` ou `next build`. Em um checkout limpo (como no CI, onde o typecheck roda antes do build), `tsc --noEmit` falhava.

## Decisão

`npm run typecheck` passa a ser `next typegen && tsc --noEmit`. O `next typegen` do Next 16.4.3 gera os tipos de rotas sem build e sem rede. As páginas usam `PageProps<'/rota'>` em vez de tipos manuais de `searchParams`/`params`.

## Consequências

- O typecheck funciona em checkout limpo e o CI (`npm run typecheck`) não muda.
- Nenhuma dependência nova. O typecheck leva alguns segundos a mais.
