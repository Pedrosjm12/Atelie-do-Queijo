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
| `npm run modelos:validar` | Confere os GLB de `public/models/` contra `data/modelos3d.ts` (nome, tamanho até 3 MiB, texturas até 2048 px, decodificadores locais). Roda no CI antes do build. Com o manifesto vazio, passa |
| `npm run medir:pacote` | Mede o JavaScript inicial (gzip) de cada rota e o chunk tardio do 3D, e compara com o orçamento. Rode depois de `npm run build`. Com `-- --web-vitals`, mede também LCP e CLS do produto |

Antes de abrir um PR (ou de commitar), rode nesta ordem: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` e `npm run test:e2e`.

## Rotas

| Rota | O que mostra |
| --- | --- |
| `/` | Home completa: hero, garantias, Na cave esta semana, Do Brasil e do mundo, quiz, presentes, Escola do Ateliê e newsletter |
| `/queijos` | Catálogo com os 10 queijos e filtro por origem na URL (`?origem=brasil` ou `?origem=mundo`) |
| `/queijos/[slug]` | Página de produto. Gera 10 rotas estáticas, uma por queijo; outro slug responde 404 |
| `/sacola` | Sacola: lista, quantidade, remover, subtotal, barra de frete grátis (a partir de R$ 180,00), embalagem para presente. `noindex` |
| `/checkout` | Checkout **simulado** em três etapas na mesma rota: Entrega, Pagamento (Pix ou Cartão, sem dado de cartão) e Confirmação. `noindex` |
| `/presentes` | Três kits (sem filtros nem botão), "Em todo kit" e bloco para empresas com **Pedir orçamento** (WhatsApp). Âncora `#presentes-corporativos` |
| `/aprenda` | Escola do Ateliê: uma seção por categoria, com os artigos |
| `/aprenda/[slug]` | Artigo (3 rotas estáticas): trilha, categoria, foto, corpo e queijos citados; outro slug responde 404 |
| `/produtores` | Nossos produtores: texto de abertura e um cartão por produtor, com link para os queijos dele |
| 404 | `app/not-found.tsx`: **Esta página foi maturar em outro lugar.**, com **Volta para a cave** (`/`) e `noindex` |

Os 10 slugs: `canastra-curado`, `canastra-meia-cura-premiado`, `creme-do-marajo`, `penadinho-de-bufala`, `cabra-com-cinzas`, `gorgonzola-dolce`, `tipo-gruyere`, `brie-frances`, `parmigiano-reggiano` e `manchego`.

As quatro páginas novas são estáticas e só rodam no servidor ([ADR-0011](docs/adr/0011-paginas-de-conteudo-e-404.md)). Os textos que dependem do dono aparecem como lacuna (`R$ [PREÇO]`, `[TEXTO DO ARTIGO]`, `[n]`, `[A DEFINIR: …]`). Como editar kits, artigos e produtores: [`docs/conteudo.md`](docs/conteudo.md#páginas-de-conteúdo-kits-artigos-e-produtores).

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

## Visualizador 3D

A etapa 5 entregou o visualizador, decidido no [ADR-0009](docs/adr/0009-visualizador-3d-com-model-viewer.md). **Nenhum queijo tem GLB ainda**, então o visitante vê a ilustração SVG do Apêndice A, com Girar, Aproximar, Tela cheia, duplo clique para aproximar e o alternador de corte funcionando sobre ela.

- **Dependências:** `@google/model-viewer` 4.4.0 e `three` 0.183.2, em versão exata (sem `^`). O `three` precisa ficar na faixa 0.183.x exigida pelo `model-viewer`: atualize as duas juntas.
- **Carregamento tardio:** a biblioteca só é baixada quando o queijo tem GLB, o palco está visível e o navegador está ocioso. Sem GLB, nenhum byte dela é baixado. Decodificadores Draco e KTX2 ficam em `public/decodificadores/` (nada de CDN).
- **Manifesto:** `data/modelos3d.ts` lista os queijos com GLB. Os arquivos seguem `public/models/<slug>-(inteiro|cortado).glb`, com até 3 MiB.
- **Orçamento de pacote** (gzip, conferido por `npm run medir:pacote`): compartilhado +0,5 kB, produto +4 kB, Home e `/queijos` +0 kB sobre a linha de base da etapa 4; chunk tardio do 3D até 350 kB, nunca citado no HTML. Medidas e registro em [ADR-0009](docs/adr/0009-visualizador-3d-com-model-viewer.md).
- **Ver na mesa** (realidade aumentada) fica oculto até haver GLB real. Hero da Home e giro no cartão também esperam o primeiro GLB.

Como entregar um modelo: [`docs/conteudo.md`](docs/conteudo.md#como-entregar-um-modelo-3d).

## Componentes principais

| Componente | Função |
| --- | --- |
| `CheeseViewer` | Palco do produto: ilustração SVG com alternador de corte, Girar, Aproximar e Tela cheia; carrega `ModeloDoQueijo` (`model-viewer`) sob demanda quando há GLB e volta ao SVG se o 3D falhar ou não houver WebGL |
| `PainelDeCompra` (em `app/queijos/[slug]/_produto/`) | Formato, preço, preço no Pix, quantidade e barra fixa do celular, com um estado só |
| `ProductTabs` e `useAbas` | Abas do produto. O hook `components/useAbas.ts` cuida do teclado (setas, Home, End) e também serve ao painel de atendimento |
| `SacolaProvider`, `LinkDaSacola`, `BotaoAdicionar`, `QuantityStepper`, `AvisoDaSacola` | Sacola no layout: estado e `localStorage`, contador do cabeçalho, botão Adicionar, seletor de quantidade e aviso **Adicionado à sacola. Boa escolha.** `SacolaVazia` é o estado vazio de `/sacola` e `/checkout` |
| `ShippingCalculator` (em `app/queijos/[slug]/_produto/`) | Calculadora de frete do produto, ligada à Server Action `consultarFrete` |
| `AtendimentoProvider` e `SupportPanel` | Painel de atendimento em `<dialog>` modal, aberto pelo botão flutuante, por "Fale conosco" (rodapé) e por "Pedir ajuda" (catálogo). Guarda a conversa em memória e carrega o motor (`lib/roteiro.ts`) sob demanda |
| `LinkDoWhatsApp` | Link `wa.me` em nova aba, com a mensagem fixa da §8.3 por motivo (geral, produto, pedido). Não renderiza nada sem número |
| `ProductCard`, `CheeseIllustration`, `components/ilustracoes/` | Cartão de queijo e ilustrações do Apêndice A da spec |
| `CabecalhoDePagina`, `CartaoDeKit`, `CartaoDeArtigo`, `Trilha` | Compartilhados entre Home, catálogo, produto e as páginas da etapa 7: topo de página (sobretítulo opcional, h1, parágrafo), cartões de kit e de artigo e a trilha `Você está em` |
| `classesDoBotao` (em `components/Button.tsx`) | Devolve as classes de um `Button` para quem precisa de um `<a>` próprio (por exemplo o link externo do `LinkDoWhatsApp`), com a mesma aparência |
| `FocoNoConteudo` | A cada troca de rota, move o foco para `#conteudo`; se a URL tem `#âncora`, foca o elemento dela. Também trata clique e `hashchange` de âncora na mesma rota |

O único controle sem função é o **Avise-me** (P15), com o padrão `aria-disabled="true"`: continua focável e visível, mas não faz nada. Fale com um queijista, o campo de mensagem e os botões do WhatsApp funcionam desde a etapa 6. Girar, Aproximar e Tela cheia funcionam desde a etapa 5 (Girar sem GLB fica `aria-disabled`, pois o SVG não gira). Buscar e Minha conta foram removidos do cabeçalho até existirem as funções (D19). A lista completa está em [`docs/PLANO.md`](docs/PLANO.md#controles-ao-fim-da-etapa-4).

## Assistente e WhatsApp

A etapa 6 ligou o painel de atendimento, decidida no [ADR-0010](docs/adr/0010-assistente-deterministico-e-whatsapp.md). **Não há IA**: o assistente é um roteiro determinístico (`lib/roteiro.ts`), atrás da interface `Assistente` de `lib/assistant.ts`, para que uma IA futura troque só `carregarAssistente()`.

- **Textos:** os que a spec traz são literais; os demais ficam em `TEXTOS_DO_ROTEIRO` como `[A DEFINIR: …]` até o dono escrever (P52). Ver [`docs/conteudo.md`](docs/conteudo.md#assistente-horário-e-whatsapp).
- **Horário:** `lib/whatsapp.ts` (`HORARIO_DO_ATENDIMENTO`), sempre em `America/Sao_Paulo`. Feriados não contam.
- **Número do WhatsApp:** variável `WHATSAPP_NUMBER` (sem `NEXT_PUBLIC_`), lida só no servidor por `lib/whatsapp.server.ts` (`app/layout.tsx`) e passado ao `AtendimentoProvider`. Sem número em produção, nenhum link `wa.me` é renderizado. Ver [`docs/ambiente.md`](docs/ambiente.md).
- **Privacidade:** a conversa fica só em memória; o texto digitado nunca entra na URL do WhatsApp; nenhuma requisição de rede. O motor é um *chunk* tardio, fora do JavaScript inicial.

## Estrutura de pastas

```
app/            rotas e layout (Next.js App Router)
components/     componentes de interface
data/           dados do catálogo e das páginas (cheeses.ts, kits.ts, artigos.ts, produtores.ts, ficticio.ts)
lib/            funções utilitárias e regras (ex.: format.ts, sacola.ts, commerce.ts; pedido.server.ts só roda no servidor)
public/models/  modelos 3D (GLB), vazia por enquanto
scripts/        validar-modelos.mjs e medir-pacote.mjs
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

1. job `verificar`: `npm ci`, lint, typecheck, `format:check`, testes, `modelos:validar` e build;
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
- [`docs/conteudo.md`](docs/conteudo.md): guia do dono da loja (cadastro de queijos, modelos 3D, assistente, horário e WhatsApp).
- [`docs/ambiente.md`](docs/ambiente.md): variáveis de ambiente e a trava de dados fictícios.

> **Dados fictícios.** WhatsApp, CNPJ, endereço, frete, prazo, parcelas e produtor do Canastra são **fictícios** e ficam em `data/ficticio.ts`. O build de produção na Vercel (`VERCEL_ENV=production`) falha enquanto `DADOS_FICTICIOS_ATIVOS` for `true`. Troque os dados antes de publicar.

Hospedagem (Vercel) e gateway (Mercado Pago) estão decididos, mas os ADRs e a configuração ficam para a etapa 9. As mudanças por etapa estão no [`CHANGELOG.md`](CHANGELOG.md).
