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
- Ajustes das decisões D3 a D19 do dono (`65c6263`): opacidade `.65` nos botões desabilitados, **Pedido nº AQ-…** na confirmação, texto do quiz, formatos "Meia peça" e "Fração", rodapé sem links nos itens sem página, Buscar e Minha conta removidos do cabeçalho até existirem as funções.
- `data/ficticio.ts` (`39fd9e0`) com os dados de negócio **fictícios** (WhatsApp, CNPJ, endereço, tabela de frete, prazo, parcelas, produtor e ano do Canastra). **AVISO: nenhum valor é real e todos precisam ser trocados antes da publicação.** `DADOS_FICTICIOS_ATIVOS` faz o `next.config.ts` falhar o build quando `VERCEL_ENV=production`.
- Etapa 5, bloco A (`92fb989`): Tela cheia (Fullscreen API), duplo clique ou duplo toque para aproximar, Girar respeitando `prefers-reduced-motion`, manifesto `data/modelos3d.ts` (vazio), `lib/suporte3d.ts` e `lib/estadoDo3d.ts`.
- Validador de modelos `npm run modelos:validar` (`scripts/validar-modelos.mjs`), com passo no CI antes do build: nome `<slug>-(inteiro|cortado).glb`, limite de 3 MiB, texturas até 2048 px, extensões permitidas e decodificadores Draco/KTX2 locais obrigatórios.
- Script `npm run medir:pacote` (`scripts/medir-pacote.mjs`) com o orçamento de pacote da etapa 5.
- Etapa 5, bloco B (`a990e3a`): dependências `@google/model-viewer` 4.4.0 e `three` 0.183.2 (ADR-0009, aceito), carregadas sob demanda só quando o queijo tem GLB, com fallback em SVG, legenda **Preparando a peça…**, mensagem sem WebGL (§7.5), tempo-limite de 20 s e textos internos do `model-viewer` traduzidos.
- Botões **Girar à esquerda** e **Girar à direita** (passo de 30°) e Girar também no celular, só quando o queijo tem GLB (WCAG 2.2.2 e 2.5.7).
- `docs/conteudo.md` (guia do dono, com "Como entregar um modelo 3D") e `docs/ambiente.md` (variáveis de ambiente e trava de produção).
- ADR-0009 (visualizador 3D com `model-viewer`).

### Alterado

- Etapa 5: Tela cheia, Aproximar e Girar passam a funcionar. Girar sem GLB fica `aria-disabled` com "Giro disponível com o modelo 3D" (só leitor de tela).
- **Desvios aprovados da spec** (para o checklist da §14): dica do palco sem GLB mostra só "Toque duas vezes para aproximar" (§7.2); Girar aparece no celular quando há GLB (§7.6); borda dos campos mantida em `--pedra-clara` (D2); rótulo fixo "Ver por dentro" com `aria-pressed` (P21); tipografia do checkout fora da §3.2 (D5).
- **Ver na mesa** (realidade aumentada) permanece oculto até haver GLB real (D23).
- Hero da Home e giro no cartão ficam para o primeiro GLB (bloco C, P40).
- Luz de ~3200 K e ambiente HDR próprio (§11) ficam para o primeiro GLB real.

- Os controles Adicionar, Calcular e Embalar para presente deixam de ser controles sem ação (`aria-disabled` fixo) e passam a funcionar. Avise-me, Falar com um queijista, Girar, Aproximar e Tela cheia seguem sem ação até as etapas 5 e 6.
- Aviso: a loja é **simulada**. Nenhum pagamento real, nenhum e-mail enviado, frete e pedido simulados. O e-mail `recusa@exemplo.com` força o pagamento recusado nos testes e será removido com o gateway real.

### Corrigido

- Largura do conteúdo: 1200 px úteis mais 32 px de respiro lateral (antes ficavam 1136 px por causa do `box-sizing`).
