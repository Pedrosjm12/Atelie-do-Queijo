# Ateliê do Queijo

Loja online de queijos finos com tema escuro e queijos em 3D. Assinatura: **Queijos de autor, escolhidos à mão.**

> **A loja é SIMULADA.** Nenhum pagamento real é feito, nenhum e-mail é enviado, e o frete e o pedido são simulados. Nada está publicado em produção. Valores de frete e prazo aparecem como lacunas (`R$ [PREÇO]`, `[N]`) até o dono informar os dados reais.

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
| `npm run test:e2e` | Roda os testes de ponta a ponta (Playwright); precisa do Chromium instalado (`npx playwright install chromium`) |

Antes de abrir um PR (ou de commitar), rode nesta ordem: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` e `npm run test:e2e`.

## Rotas

| Rota | O que mostra |
| --- | --- |
| `/` | Home completa: hero, garantias, Na cave esta semana, Do Brasil e do mundo, quiz, presentes, Escola do Ateliê e newsletter |
| `/queijos` | Catálogo com os 10 queijos e filtro por origem na URL (`?origem=brasil` ou `?origem=mundo`) |
| `/queijos/[slug]` | Página de produto. Gera 10 rotas estáticas, uma por queijo; outro slug responde 404 |
| `/sacola` | Sacola: lista, quantidade, remover, subtotal, barra de frete grátis (a partir de R$ 180,00), embalagem para presente. `noindex` |
| `/checkout` | Checkout **simulado** em três etapas na mesma rota: Entrega, Pagamento (Pix ou Cartão, sem dado de cartão) e Confirmação. `noindex` |

Os 10 slugs: `canastra-curado`, `canastra-meia-cura-premiado`, `creme-do-marajo`, `penadinho-de-bufala`, `cabra-com-cinzas`, `gorgonzola-dolce`, `tipo-gruyere`, `brie-frances`, `parmigiano-reggiano` e `manchego`.

Presentes, Aprenda, Produtores e a página 404 própria entram na etapa 7.

## Sacola, frete e checkout simulados

A etapa 4 faz a compra funcionar de ponta a ponta **em simulação**. Decisões em [ADR-0003](docs/adr/0003-estado-da-sacola.md), [ADR-0007](docs/adr/0007-validacao-com-zod-mini.md) e [ADR-0008](docs/adr/0008-sacola-frete-e-checkout-simulados.md).

- **Sacola no navegador.** O `localStorage` (chave `atelie:sacola:v1`) guarda só `slug`, `formatoId`, quantidade e a marca de presente. Preço, nome e total nunca são salvos. Máximo de 10 unidades por item.
- **Dados do checkout só em memória.** Nome, e-mail, telefone, endereço e mensagem do presente não vão para `localStorage`, `sessionStorage`, cookie nem log. Recarregar a página limpa o formulário.
- **Preço e total sempre recalculados no servidor.** O navegador nunca envia preço. As Server Actions `consultarFrete` (`app/_acoes/frete.ts`) e `confirmarPedido` (`app/_acoes/pedido.ts`) validam a entrada, consultam o catálogo e recalculam subtotal, frete, desconto do Pix e total. O corpo de uma Server Action é limitado a **32 KB** (`next.config.ts`).
- **Validação.** Zod por `zod/mini`, só na rota `/checkout` e nas Server Actions. A leitura da sacola salva usa um *type guard* escrito à mão, para não pesar no pacote de todas as páginas.
- **Frete.** Simulado: prazo `[N]` e valor `R$ [PREÇO]` ficam como lacunas; frete grátis a partir de R$ 180,00 sobre o subtotal; a faixa de CEP 00000-000 a 00999-999 responde "fora de área".
- **Pix.** Desconto de 5% só sobre o subtotal dos produtos.

### Gatilho de teste do pagamento recusado (remover com o gateway)

O e-mail **`recusa@exemplo.com`** faz o pedido simulado ser recusado, para testar a mensagem de erro do pagamento. Ele existe só na implementação simulada, em `lib/pedido.server.ts`, marcado com o comentário `// SIMULAÇÃO: remover com o gateway`. **Deve ser removido quando o gateway real entrar** (ver a etapa 9 do [`docs/PLANO.md`](docs/PLANO.md#etapa-9--ci-completo-ambientes-e-aceite-herança-da-etapa-4)).

## Componentes principais

| Componente | Função |
| --- | --- |
| `CheeseViewer` | Palco do produto. Nesta etapa mostra só ilustração SVG, com alternador de corte (peça inteira ou por dentro). O 3D real chega na etapa 5 |
| `PainelDeCompra` (em `app/queijos/[slug]/_produto/`) | Formato, preço, preço no Pix, quantidade e barra fixa do celular, com um estado só |
| `ProductTabs` e `useAbas` | Abas do produto. O hook `components/useAbas.ts` cuida do teclado (setas, Home, End) e também serve ao painel de atendimento |
| `SacolaProvider`, `LinkDaSacola`, `BotaoAdicionar`, `QuantityStepper`, `AvisoDaSacola` | Sacola no layout: estado e `localStorage`, contador do cabeçalho, botão Adicionar, seletor de quantidade e aviso **Adicionado à sacola. Boa escolha.** `SacolaVazia` é o estado vazio de `/sacola` e `/checkout` |
| `ShippingCalculator` (em `app/queijos/[slug]/_produto/`) | Calculadora de frete do produto, ligada à Server Action `consultarFrete` |
| `AtendimentoProvider` e `SupportPanel` | Painel de atendimento em `<dialog>` modal, aberto pelo botão flutuante, por "Fale conosco" (rodapé) e por "Pedir ajuda" (catálogo). A conversa é um roteiro fixo de `lib/assistant.ts` até a etapa 6 |
| `ProductCard`, `CheeseIllustration`, `components/ilustracoes/` | Cartão de queijo e ilustrações do Apêndice A da spec |

Controles que ainda não têm função (Avise-me, Girar, Aproximar, Tela cheia, Falar com um queijista, envio de mensagem no painel, Buscar e Minha conta) seguem o padrão `aria-disabled="true"`: continuam focáveis e visíveis, mas não fazem nada. Ganham ação nas etapas 5 e 6. A lista completa está em [`docs/PLANO.md`](docs/PLANO.md#controles-ao-fim-da-etapa-4).

## Estrutura de pastas

```
app/            rotas e layout (Next.js App Router)
components/     componentes de interface
data/           dados do catálogo (ex.: cheeses.ts)
lib/            funções utilitárias e regras (ex.: format.ts, sacola.ts, commerce.ts; pedido.server.ts só roda no servidor)
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

Hospedagem e gateway de pagamento ainda não foram decididos. O guia de conteúdo (`docs/conteudo.md`) e o das variáveis de ambiente (`docs/ambiente.md`) ainda não existem e ficam para a etapa 9; por ora, as variáveis estão no `.env.example`. As mudanças por etapa estão no [`CHANGELOG.md`](CHANGELOG.md).
