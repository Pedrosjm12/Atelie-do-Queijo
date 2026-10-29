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

- Página de produto `/queijos/[slug]` (10 rotas estáticas) com trilha, perfil sensorial, `CheeseViewer` em SVG com alternador de corte, `PainelDeCompra` (formatos, preço, Pix e barra fixa no celular) e abas com navegação por teclado (`ProductTabs` e `useAbas`).
- Painel de atendimento (§8) em `<dialog>` modal, aberto pelo botão flutuante, por "Fale conosco" e por "Pedir ajuda", com abas Assistente e Queijista e roteiro provisório em `lib/assistant.ts`.
- Controles ainda sem função usam `aria-disabled` e seguem focáveis até as etapas 4 a 6.
- Sacola (etapa 4): contexto React com `localStorage` versionado (`atelie:sacola:v1`, só `slug`, `formatoId`, quantidade e presente), leitura tolerante a lixo, sincronização entre abas, contador no cabeçalho e aviso **Adicionado à sacola. Boa escolha.** Máximo de 10 unidades por item.
- Botão **Adicionar** ligado à sacola nos cartões, no quiz, no produto e na barra fixa do celular, e **Embalar para presente**, que marca o pedido como presente.
- Calculadora de frete simulada no produto (Server Action `consultarFrete`, máscara de CEP, prazo `[N]` e valor `R$ [PREÇO]` em lacuna, faixa 00000-000 a 00999-999 fora de área).
- Página `/sacola` com lista, quantidade, remover, subtotal, barra de frete grátis (a partir de R$ 180,00) e estado vazio.
- Página `/checkout` com Entrega, Pagamento (Pix ou Cartão, sem dado de cartão) e Confirmação, Server Action `confirmarPedido` que recalcula tudo no servidor, mensagem do presente e data de entrega.
- Dependência `zod@4.6.7`, usada por `zod/mini` só no `/checkout` e nas Server Actions (ADR-0007).
- ADR-0007 (validação com Zod) e ADR-0008 (sacola, frete e checkout simulados).

### Alterado

- Os controles Adicionar, Calcular e Embalar para presente deixam de ser controles sem ação (`aria-disabled` fixo) e passam a funcionar. Avise-me, Falar com um queijista, Girar, Aproximar e Tela cheia seguem sem ação até as etapas 5 e 6.
- Aviso: a loja é **simulada**. Nenhum pagamento real, nenhum e-mail enviado, frete e pedido simulados. O e-mail `recusa@exemplo.com` força o pagamento recusado nos testes e será removido com o gateway real.

### Corrigido

- Largura do conteúdo: 1200 px úteis mais 32 px de respiro lateral (antes ficavam 1136 px por causa do `box-sizing`).
