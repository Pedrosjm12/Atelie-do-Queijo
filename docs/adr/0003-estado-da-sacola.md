# ADR-0003 — Estado da sacola: contexto React + localStorage

- **Status:** Aceito
- **Data:** 2026-10-26

## Contexto

A spec §2 pede o estado da sacola em "contexto React (ou Zustand) persistido em `localStorage`". A §10.1 define o modelo: itens `{ slug, formatoId, quantidade }`, contador no cabeçalho igual à soma das quantidades, subtotal e barra de frete grátis (R$ 180). O estado é pequeno, local ao navegador e lido por poucos componentes (botão da sacola no cabeçalho, botões "Adicionar", página `/sacola`, checkout).

## Decisão

- Usar um **contexto React** (`CartProvider` + hook `useSacola()`), com `useReducer` para as operações (adicionar, alterar quantidade, remover, limpar), em um único componente client montado no `app/layout.tsx`.
- **Persistência em `localStorage`** com uma chave versionada (ex.: `atelie:sacola:v1`). O conteúdo lido é validado na borda (Zod, quando adotado) e descartado se inválido ou se referir um `slug`/`formatoId` inexistente.
- Para evitar divergência de hidratação, o servidor e a primeira renderização do cliente mostram o contador vazio; a leitura do `localStorage` acontece depois da montagem.
- Sincronizar abas abertas pelo evento `storage`.
- Preços **não** ficam salvos na sacola: são sempre derivados de `data/cheeses.ts` (em centavos), para que um preço antigo no navegador nunca seja usado.
- Implementação na **etapa 4**, pelo `engenheiro-de-ecommerce`. Até lá, o contador do cabeçalho fica estático em 0.

## Alternativas consideradas

- **Zustand:** API enxuta e seletores que evitam re-renderizações, mas adiciona uma dependência para um estado pequeno com poucos consumidores. O ganho de desempenho não se justifica aqui. Rejeitado; pode ser reavaliado se a sacola crescer em consumidores ou complexidade.
- **Estado no servidor (cookie ou banco):** útil com conta de usuário e carrinho entre dispositivos, mas não há backend de pedidos nesta fase (`lib/commerce.ts` é simulado). Rejeitado por ora.
- **Carrinho do provedor de e-commerce (ex.: Shopify Storefront):** depende do gateway, ainda não decidido. Quando houver integração real, a camada `lib/commerce.ts` fará a ponte sem mudar os componentes.

## Consequências

- Nenhuma dependência nova.
- Qualquer mudança no contexto re-renderiza todos os consumidores; aceitável com poucos consumidores. Se virar problema, separar o contexto de leitura do de ações ou reavaliar o Zustand.
- **Atualização (etapa 4, bloco B):** a separação foi feita (`useEstadoDaSacola` e `useAcoesDaSacola`, `useSacola` mantido por compatibilidade), porque os botões "Adicionar" são muitos e só disparam ações; com ações de identidade estável eles não re-renderizam quando a sacola muda. Zustand continua descartado.
- A sacola é por navegador: não acompanha o usuário entre dispositivos até existir conta e integração real.
- Mudanças no formato salvo exigem incrementar a versão da chave e migrar ou descartar o conteúdo antigo.
