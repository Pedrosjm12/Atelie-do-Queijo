# Ateliê do Queijo

Loja online de queijos finos com tema escuro e queijos em 3D. Assinatura: **Queijos de autor, escolhidos à mão.**

## Requisitos

- Node 24 (versão fixada em `.nvmrc`; com nvm, rode `nvm use`)
- npm

## Como rodar

```bash
npm ci                          # instala as dependências
npm run dev                     # servidor de desenvolvimento em http://localhost:3000
npx playwright install chromium # só na primeira vez, para os testes e2e
```

Variáveis de ambiente: copie `.env.example` para `.env.local` e preencha. A lista completa e o significado de cada variável estão no próprio `.env.example`.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção |
| `npm start` | Serve a build de produção |
| `npm run lint` | Roda o ESLint |
| `npm run typecheck` | Gera os tipos de rotas (`next typegen`) e confere com `tsc --noEmit` |
| `npm run format` | Formata o projeto com o Prettier |
| `npm run format:check` | Confere a formatação sem alterar arquivos |
| `npm test` | Roda os testes unitários (Vitest) uma vez |
| `npm run test:watch` | Roda o Vitest em modo contínuo |
| `npm run test:e2e` | Roda os testes de ponta a ponta (Playwright) |

## Rotas

| Rota | O que mostra |
| --- | --- |
| `/` | Home completa: hero, garantias, Na cave esta semana, Do Brasil e do mundo, quiz, presentes, Escola do Ateliê e newsletter |
| `/queijos` | Catálogo com os 10 queijos e filtro por origem na URL (`?origem=brasil` ou `?origem=mundo`) |
| `/queijos/[slug]` | Página de produto. Gera 10 rotas estáticas, uma por queijo; outro slug responde 404 |

Os 10 slugs: `canastra-curado`, `canastra-meia-cura-premiado`, `creme-do-marajo`, `penadinho-de-bufala`, `cabra-com-cinzas`, `gorgonzola-dolce`, `tipo-gruyere`, `brie-frances`, `parmigiano-reggiano` e `manchego`.

Presentes, Aprenda, Produtores e a página 404 própria entram na etapa 7.

## Componentes principais

| Componente | Função |
| --- | --- |
| `CheeseViewer` | Palco do produto. Nesta etapa mostra só ilustração SVG, com alternador de corte (peça inteira ou por dentro). O 3D real chega na etapa 5 |
| `PainelDeCompra` (em `app/queijos/[slug]/_produto/`) | Formato, preço, preço no Pix, quantidade e barra fixa do celular, com um estado só |
| `ProductTabs` e `useAbas` | Abas do produto. O hook `components/useAbas.ts` cuida do teclado (setas, Home, End) e também serve ao painel de atendimento |
| `AtendimentoProvider` e `SupportPanel` | Painel de atendimento em `<dialog>` modal, aberto pelo botão flutuante, por "Fale conosco" (rodapé) e por "Pedir ajuda" (catálogo). A conversa é um roteiro fixo de `lib/assistant.ts` até a etapa 6 |
| `ProductCard`, `CheeseIllustration`, `components/ilustracoes/` | Cartão de queijo e ilustrações do Apêndice A da spec |

Controles que ainda não têm função (Adicionar à sacola, Calcular frete, Girar, Falar com um queijista, envio de mensagem no painel etc.) seguem o padrão `aria-disabled="true"`: continuam focáveis e visíveis, mas não fazem nada. Ganham ação nas etapas 4 a 6. A lista completa está em [`docs/PLANO.md`](docs/PLANO.md#controles-sem-ação-ao-fim-da-etapa-3).

## Estrutura de pastas

```
app/            rotas e layout (Next.js App Router)
components/     componentes de interface
data/           dados do catálogo (ex.: cheeses.ts)
lib/            funções utilitárias e regras (ex.: format.ts)
public/models/  modelos 3D (GLB)
e2e/            testes de ponta a ponta
docs/           plano, ADRs e guias
```

## Qualidade

**Pré-commit (lefthook).** A cada commit, nos arquivos em stage:

- ESLint com correção automática (`--fix`);
- Prettier com escrita (`--write`);
- typecheck, em paralelo com os dois acima.

Os arquivos corrigidos voltam ao stage sozinhos.

**CI** (`.github/workflows/ci.yml`, em push e pull request para `main`):

1. job `verificar`: `npm ci`, lint, typecheck, `format:check`, testes e build;
2. job `e2e` (roda só se `verificar` passar): instala o Chromium e executa o Playwright.

## Convenções

- Preços são guardados em **centavos inteiros**. Para exibir, use `formatarPreco` de `lib/format.ts`.
- Fontes: use as variáveis CSS `--fonte-titulo` e `--fonte-texto`.
- Commits seguem Conventional Commits em português, por exemplo `feat(catalogo): adiciona filtros por tipo de leite`.

## Documentação

- [`ATELIE-DO-QUEIJO-SPEC.md`](ATELIE-DO-QUEIJO-SPEC.md): fonte da verdade do produto (cores, textos, medidas, comportamento).
- [`CLAUDE.md`](CLAUDE.md): instruções de trabalho do repositório.
- [`docs/PLANO.md`](docs/PLANO.md): plano da etapa atual.
- [`docs/adr/`](docs/adr/README.md): decisões técnicas.

Hospedagem e pagamento ainda não foram decididos.
