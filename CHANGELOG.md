# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não publicado]

### Adicionado

- Base do projeto com Next.js 16.4, React 19.3 e TypeScript.
- ESLint, Prettier, Vitest, Playwright, lefthook (pré-commit) e CI no GitHub Actions.
- Função `formatarPreco` em `lib/format.ts` (preços em centavos inteiros).
- Layout com as fontes do projeto e `lang="pt-BR"`.
- Plano da etapa (`docs/PLANO.md`) e ADRs 0001 a 0004 em `docs/adr/`.
- Tokens de design da spec (§3) em `app/globals.css`: cores, tipografia, raios, foco visível e reduções para o celular.
- Componentes globais: `Logo`, `AnnouncementBar`, `Header` (com menu mobile), `Footer`, `Button` (5 variantes, tamanho compacto), `Seal`, `Overline`, `PhotoPlaceholder`, `SupportFab` e ícones.
- Link "Pular para o conteúdo" e foco movido para o conteúdo a cada troca de rota.
- Testes unitários dos componentes e e2e do layout global (sem rolagem horizontal de 360 a 1920 px, menu mobile por teclado, borda do cabeçalho, botão flutuante).
- Protótipo aprovado das telas em `design/`, como referência para a comparação visual.
- Dados dos 10 queijos (`data/cheeses.ts`), regras do catálogo, preço no Pix e lacuna "R$ [PREÇO]", ilustrações SVG do Apêndice A e `ProductCard`.
- Home completa (§5): hero, garantias, Na cave esta semana, Do Brasil e do mundo, quiz "Encontre seu queijo", presentes, Escola do Ateliê e newsletter (sem envio nesta etapa).
- Catálogo `/queijos` (§6) com filtro Todos / Brasil / Mundo refletido na URL, anúncio do total para leitores de tela e caixa de ajuda.
- Modelo de título `%s — Ateliê do Queijo` para todas as páginas e `next typegen` antes do typecheck (ADR-0006).

### Corrigido

- Largura do conteúdo: 1200 px úteis mais 32 px de respiro lateral (antes ficavam 1136 px por causa do `box-sizing`).
