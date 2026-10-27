# Plano de implementação — Ateliê do Queijo

> Fonte da verdade: `ATELIE-DO-QUEIJO-SPEC.md`. Decisões técnicas: `docs/adr/`.
> Última atualização: 2026-10-27. Etapas 1, 2 e 3 concluídas. Próxima: **4 (sacola, frete e checkout simulado)**.
>
> **Onde paramos (2026-10-27):** etapa 3 concluída, com os cinco blocos (dados, Home, Catálogo, Produto e painel de atendimento). **Próximo passo: etapa 4, sacola, frete simulado e checkout simulado, a detalhar pelo `arquiteto-de-software`** (contrato de `calcularFrete` e `criarPedido` em `lib/commerce.ts`, contexto da sacola conforme o [ADR-0003](adr/0003-estado-da-sacola.md); o `auditor-de-seguranca` volta a entrar). Os controles sem ação seguem `aria-disabled` até as etapas 4 a 6 (ver [Controles sem ação](#controles-sem-ação-ao-fim-da-etapa-3)).
>
> **Pendências abertas para o dono:**
>
> - **Rolagem automática da conversa** do painel de atendimento até a última mensagem: hoje não rola sozinha. Decidir.
> - **Fechar o painel ao mudar de rota:** hoje só o cartão de produto fecha o painel; voltar/avançar do navegador o mantém aberto. Decidir.
> - **Contraste de `--placeholder`** (`#8c8070`, 4,47:1 sobre `--carvao`): aceito como provisório; rever antes da publicação (a spec fixa o token).
> - **`AnnouncementBar` fora de landmark** (apontado pelo axe): não alterado; tratar no cabeçalho.
> - **Etapa 8:** enxugar o pacote global do catálogo (o provider do painel no layout leva `lib/catalogo` e `data/cheeses` ao pacote global), sem `React.lazy`.
> - **Spec §14:** anotar a decisão P21 (botão de corte do 3D com rótulo fixo "Ver por dentro") no checklist, como desvio de texto. A spec só muda com aprovação do dono.
> - **Etapa 5 (P11):** **Ver na mesa** só entra com GLB real.
> - Demais itens em [Pendências e decisões em aberto](#pendências-e-decisões-em-aberto) e nas decisões do dono P1 a P23.
>
> Fluxo usado em cada bloco: `frontend-nextjs` (ou o especialista da tarefa) implementa → `guardiao-do-design` (porta 3000, build), `especialista-em-acessibilidade` (`next dev -p 3001`, sem build) e `revisor-de-codigo` conferem em paralelo, sem editar → correções pelo implementador → lint, typecheck, format:check, test, build e test:e2e → commit e push. Reaproveitar `BotaoEmBreve`/`BotaoDaSacola` para controles sem ação e o token `--largura-conteiner` nos contêineres.

Convenções deste plano:

- Cada tarefa cabe em um PR revisável (idealmente < 400 linhas alteradas).
- `[agente]` indica o responsável pela implementação. Toda tarefa termina com o `revisor-de-codigo` (veredito ✅ ou ⚠️ resolvido) antes do commit, conforme o `CLAUDE.md`.
- "Pronto quando" é verificável: um comando que passa, um arquivo que existe ou um comportamento observável.

---

## Visão geral das etapas

| # | Etapa | Responsáveis principais | Situação |
| --- | --- | --- | --- |
| 1 | Base do projeto e ferramentas | `devops-e-deploy`, `arquiteto-de-software` | Concluída |
| 2 | Tokens de design e componentes globais | `frontend-nextjs`, `guardiao-do-design` | Concluída |
| 3 | Home → Catálogo → Produto (com `ProductCard`, `data/cheeses.ts` e ilustrações do Apêndice A) → interface do painel de Atendimento (§8). Sem sacola real, frete, 3D real nem roteiro do assistente | `frontend-nextjs`, `especialista-3d-webgl`, `engenheiro-de-ecommerce`, `guardiao-do-design` | Concluída ([detalhe](#etapa-3--home--catálogo--produto--painel-de-atendimento)) |
| 4 | Sacola (contexto + `localStorage`), frete simulado e checkout simulado em `lib/commerce.ts` | `engenheiro-de-ecommerce` | A detalhar |
| 5 | Visualizador 3D (`CheeseViewer` com `@google/model-viewer`) e fallback SVG do Apêndice A | `especialista-3d-webgl` | A detalhar |
| 6 | Assistente com roteiro determinístico, horários e links do WhatsApp no painel de atendimento | `especialista-em-ia-conversacional` | A detalhar |
| 7 | Páginas restantes: Presentes, Aprenda, Produtores, 404 (textos da §12) | `frontend-nextjs` | A detalhar |
| 8 | Rodada de qualidade: testes, acessibilidade, performance e SEO, segurança | `testes-e-qualidade`, `especialista-em-acessibilidade`, `performance-e-seo`, `auditor-de-seguranca` | A detalhar |
| 9 | CI completo, ambientes e checklist de aceite da §14 | `devops-e-deploy`, `documentador-tecnico` | A detalhar |

As etapas 4 a 9 serão detalhadas pelo `arquiteto-de-software` no início de cada uma.

---

## Etapa 1 — Base do projeto e ferramentas

**Objetivo:** ter um projeto Next.js (App Router) + TypeScript estrito que instala, roda, passa em lint, typecheck, testes unitários, e2e e build, localmente e no CI, com a estrutura de pastas da spec §2.

**Decisões:** [ADR-0001](adr/0001-stack.md), [ADR-0002](adr/0002-ferramentas-de-qualidade.md).

### Tarefas

1. **[devops-e-deploy] Scaffold Next.js App Router + TypeScript**
   - Sem Tailwind, sem pasta `src/`, alias `@/*` apontando para a raiz.
   - Estrutura da spec §2: `app/`, `components/`, `data/`, `lib/`, `public/models/` (com `.gitkeep`).
   - `tsconfig.json` com `"strict": true` (e `noUncheckedIndexedAccess` recomendado).
   - Versões: a estável mais recente de Next.js e React no momento da instalação, registradas no `package.json` (conferir a documentação oficial da versão instalada).
   - **Pronto quando:** `npm run dev` abre a página em `http://localhost:3000` e `npm run build` termina sem erros.

2. **[devops-e-deploy] Gerenciador, Node e scripts**
   - npm com `package-lock.json` versionado.
   - `.nvmrc` com `24` e `"engines": { "node": ">=24" }` no `package.json`.
   - Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format` (Prettier com escrita), `format:check`, `test` (Vitest, execução única), `test:e2e` (Playwright).
   - **Pronto quando:** cada script existe e roda sem erro em um clone limpo após `npm ci`.

3. **[devops-e-deploy] ESLint e Prettier**
   - ESLint em flat config (`eslint.config.mjs`) com `eslint-config-next` (core-web-vitals + typescript) e `eslint-plugin-jsx-a11y` (recomendado).
   - O script `lint` chama `eslint .` diretamente (não depender de `next lint`; conferir o estado do comando na versão instalada).
   - Prettier com `.prettierrc` e `.prettierignore`; integração com o ESLint sem regras de estilo conflitantes (`eslint-config-prettier` só se houver conflito real, registrado no ADR-0002).
   - **Pronto quando:** `npm run lint` e `npm run format:check` passam no projeto recém-criado.

4. **[devops-e-deploy] Vitest + jsdom + Testing Library, com o primeiro teste**
   - `vitest.config.mts` com ambiente `jsdom`, alias `@/*` e arquivo de setup com `@testing-library/jest-dom`.
   - Criar `lib/format.ts` com o contrato abaixo e `lib/format.test.ts`.
   - **Pronto quando:** `npm test` passa com o teste `formatarPreco(13600)` → `"R$ 136,00"`.

5. **[devops-e-deploy] Playwright (só Chromium) com e2e de fumaça**
   - `playwright.config.ts` com um único projeto Chromium e `webServer` subindo o build de produção (`npm run build && npm run start`) ou `npm run dev` localmente.
   - `e2e/fumaca.spec.ts` verificando: `<html lang="pt-BR">`; com viewport de **360 px** de largura, `document.documentElement.scrollWidth <= window.innerWidth` (spec §3.4 e §14).
   - **Pronto quando:** `npm run test:e2e` passa localmente.

6. **[devops-e-deploy] lefthook no pré-commit**
   - `lefthook.yml` com, em paralelo, sobre arquivos *staged*: Prettier (`format:check` nos arquivos alterados), ESLint e `typecheck`.
   - Instalação automática via script `prepare` (ou `postinstall` do próprio pacote lefthook; conferir a documentação da versão instalada).
   - **Pronto quando:** um commit com erro de lint é bloqueado e um commit limpo passa.

7. **[devops-e-deploy] `.gitignore` e `.env.example`**
   - `.gitignore` cobrindo `node_modules/`, `.next/`, `out/`, `coverage/`, `test-results/`, `playwright-report/`, `.env*` (exceto `.env.example`), `*.tsbuildinfo`, `next-env.d.ts` conforme o padrão do Next.
   - `.env.example` documentando as variáveis previstas, sem valores reais. Previsto por ora: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (comentada, usada na etapa 6).
   - **Pronto quando:** `git status` após `npm ci`, `npm run build` e `npm run test:e2e` não mostra arquivos gerados.

8. **[devops-e-deploy] CI mínimo no GitHub Actions**
   - `.github/workflows/ci.yml`: em `push` e `pull_request` para `main`; Node lido do `.nvmrc`; cache do npm; passos `npm ci` → `lint` → `typecheck` → `test` → `build` → instalar Chromium do Playwright → `test:e2e`.
   - Permissões mínimas (`contents: read`), `concurrency` cancelando execuções antigas da mesma branch.
   - CI completo (matriz, regressão visual, Lighthouse, ambientes) fica para a **etapa 9**.
   - **Pronto quando:** o workflow passa no primeiro push para `origin/main`.

9. **[devops-e-deploy] Layout provisório com fontes**
   - `app/layout.tsx` com `<html lang="pt-BR">`, metadados básicos (`title` "Ateliê do Queijo") e fontes via `next/font/google`:
     - `Cormorant_Garamond`: pesos 500 e 600, estilos normal e itálico, `display: "swap"`, variável CSS `--fonte-titulo`.
     - `Manrope`: pesos 400, 500, 600, 700, `display: "swap"`, variável CSS `--fonte-texto`.
   - `app/page.tsx` provisório (apenas o nome do site); `app/globals.css` mínimo, a ser substituído na etapa 2.
   - **Pronto quando:** o HTML servido tem `lang="pt-BR"` e as duas fontes aparecem na aba Network com os pesos acima.

10. **[arquiteto-de-software] ADRs da base e este plano** — ADR-0001, ADR-0002, ADR-0003 e `docs/adr/README.md`.
    - **Pronto quando:** os arquivos existem e o índice aponta para todos.

11. **[revisor-de-codigo → documentador-tecnico] Fechamento da etapa 1**
    - Revisão do diff completo; README inicial com requisitos (Node 24, npm) e scripts.
    - **Pronto quando:** veredito ✅ e commit `chore: cria base do projeto e ferramentas de qualidade` publicado em `origin/main`.

### Contrato da etapa 1: `lib/format.ts`

```ts
/** Formata um valor em centavos como preço em reais: 13600 → "R$ 136,00". */
export function formatarPreco(centavos: number): string;
```

- **Preços são inteiros em centavos** em todo o projeto (dados, sacola, frete, Pix). Isso evita erros de ponto flutuante em somas e no desconto de 5%. A conversão para reais acontece só na exibição.
- Implementação com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`. O `Intl` devolve um espaço não separável (U+00A0) entre `R$` e o número. Isso atende à spec ("espaço depois de `R$`") e impede que o preço quebre em duas linhas. O teste deve comparar com `"R$ 136,00"` **ou** normalizar o espaço, nunca depender de um espaço comum por acaso. **Decisão:** `formatarPreco` mantém o U+00A0 (normalizando o U+202F de algumas versões do ICU) e rejeita valores que não sejam inteiros (`RangeError`).

### Critérios de pronto da etapa 1

- `npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e` passa localmente e no CI.
- Estrutura de pastas igual à spec §2 (pastas vazias com `.gitkeep`).
- Nenhuma dependência fora das listadas no ADR-0001 e no ADR-0002.

### Riscos da etapa 1

- **Caminho com espaço e acento** (`ateliê do queijo`) pode quebrar scripts, hooks do lefthook ou o Playwright no Windows → sempre aspas nos caminhos; testar o hook e o e2e localmente no Windows; o CI (Linux) não reproduz esse caso.
- **Mudanças recentes no Next.js** (ex.: comando `next lint`, configuração do ESLint, Turbopack padrão) → conferir a documentação da versão instalada antes de configurar; registrar diferenças no ADR-0002.
- **Fontes do Google no build do CI** dependem de rede → aceitável no GitHub Actions; se falhar, avaliar `next/font/local` em ADR próprio.

---

## Etapa 2 — Tokens de design e componentes globais

**Objetivo:** implementar os tokens da §3 e os componentes globais da §4 (exceto `ProductCard`), montados no `app/layout.tsx`, com fidelidade de pixel a 1440 px e 390 px.

**Pré-requisito:** etapa 1 concluída.

### Fronteiras Server/Client da etapa 2

| Componente | Tipo | Motivo |
| --- | --- | --- |
| `icons.tsx`, `Logo`, `AnnouncementBar`, `Footer`, `Button`, `Seal`, `Overline`, `PhotoPlaceholder` | Server Component | Sem estado nem eventos |
| `Header` | Server Component | Composição; delega a interatividade a dois filhos client |
| `HeaderNav` (dentro de `components/Header/` ou como arquivo próprio) | Client (`"use client"`) | Usa `usePathname()` para destacar a seção atual em `--ouro` e `aria-current="page"` |
| `MobileMenu` | Client | Abre e fecha o menu ≤ 768 px, foco, tecla Esc |
| `SupportFab` | Client | Bolha após 20 s, uma vez por sessão (`sessionStorage`) |

- O botão da sacola fica **estático com contador 0** (`aria-label="Sacola, 0 itens"`) até a etapa 4, quando vira um componente client ligado ao contexto da sacola (ADR-0003).
- `SupportFab` e "Fale conosco" do rodapé são `<button>` reais. Até o fim da etapa 3 o clique não abre painel (o painel não existe ainda). Para não criar abstração antecipada, **não** haverá contexto de atendimento nesta etapa; ele será definido no plano da etapa 3.

### Tarefas

1. **[frontend-nextjs] `app/globals.css`: tokens e reset**
   - Copiar literalmente as variáveis da §3.1 para `:root`.
   - Tokens de espaço e raio da §3.3 como variáveis (ex.: `--raio-cartao: 12px`, `--raio-palco: 16px`, `--raio-miniatura: 10px`, `--raio-pilula: 999px`, `--raio-campo: 10px`, `--largura-conteudo: 1200px`, `--respiro-lateral: 32px`).
   - Reset mínimo; `body { background: var(--cave); color: var(--creme); }`; corpo em Manrope 16 px / 1.6.
   - Estilos de tipografia da §3.2 (h1 a h2 por papel, overline, overline pequeno, `em` em Cormorant itálico 500 `--ouro`) e reduções ≤ 768 px da §3.4 (h1 home ≈ 46 px, h2 ≈ 32 px, h1 produto 38 px).
   - Foco visível global: `outline: 2px solid var(--ouro); outline-offset: 2px;`.
   - Classe utilitária `.conteudo` (máx. 1200 px, `margin: 0 auto`, `padding-inline: 32px`).
   - **Pronto quando:** nenhuma cor fora da §3.1 em `globals.css` (verificável por busca de `#` e `rgb`), `guardiao-do-design` aprova os valores.

2. **[frontend-nextjs] `components/icons.tsx`**
   - Os 16 ícones da §4.10 com os paths exatos, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`; props `tamanho`, `espessura` (1.5 padrão; 1.75 em botões cheios; 1.8 no WhatsApp) e `rotulo` opcional (sem rótulo → `aria-hidden="true"`; com rótulo → `role="img"` + `aria-label`).
   - **Pronto quando:** teste unitário confirma `aria-hidden` por padrão e paths conferidos pelo `guardiao-do-design`.

3. **[frontend-nextjs] `Logo`**
   - Símbolo do Apêndice A.1 copiado literalmente; variações da §4.1 (34 px cabeçalho, 24 px mobile; tamanhos do nome 27/22, 21/17, rodapé 26/21; `gap` 12 / 8 px). Variações A.2 ficam para quando forem usadas.
   - O conjunto é um `<a href="/">` (`next/link`) com nome acessível "Ateliê do Queijo".
   - **Pronto quando:** comparação visual com a spec a 1440 e 390 px aprovada.

4. **[frontend-nextjs] `Button` (5 variantes), `Seal`, `Overline`, `PhotoPlaceholder`**
   - `Button`: variantes `principal`, `secundario`, `contorno`, `link`, `opcao` (§4.4). Renderiza `next/link` quando recebe `href` e `<button>` caso contrário. `opcao` exige `aria-pressed`. Altura mínima 44 px em todas.
   - `Seal`: tipos `origem` e `maturacao` (§4.5), tamanhos desktop e mobile.
   - `Overline`: normal (12 px) e pequeno (11 px, `0.18em`; prop para `0.16em` do catálogo).
   - `PhotoPlaceholder`: texto `[FOTO: descrição]`, alturas 240/220/200 e variante de artigo (fundo `--carvao`, raio 12, borda `--pedra`).
   - **Pronto quando:** testes de unidade cobrem a troca `<a>`/`<button>` e `aria-pressed`; `guardiao-do-design` aprova.

5. **[frontend-nextjs] `AnnouncementBar` e `Footer`**
   - Textos exatos da §4.2 e §4.9, incluindo as lacunas `[00.000.000/0000-00]` e `[Endereço]`.
   - Rodapé: grade `auto-fit minmax(200px, 1fr)`; colunas LOJA, ATELIÊ, AJUDA; "Fale conosco" como `<button>`. Links sem página ainda apontam para as rotas previstas (§10.5) ou ficam como `href="#"` documentado até a etapa 7.
   - **Pronto quando:** textos idênticos à spec (conferidos por teste de snapshot de texto ou pelo `guardiao-do-design`).

6. **[frontend-nextjs] `Header` com menu mobile**
   - Desktop conforme §4.3: logo, `<nav aria-label="Principal">` com Queijos · Presentes · Aprenda · Nossos produtores, botões Buscar e Minha conta (44 × 44, `aria-label`), botão da sacola com contador 0.
   - Variante com `border-bottom` (catálogo e produto) por prop; Home sem borda.
   - ≤ 768 px (§3.4 e §7.6): botão "Menu" (44 px, ícone `menu`) à esquerda, logo centralizado (24 px), sacola à direita. O menu abre com `aria-expanded`, `aria-controls`, fecha com Esc e devolve o foco ao botão.
   - **Pronto quando:** e2e confirma abrir/fechar o menu com teclado a 390 px e ausência de rolagem horizontal a 360 px.

7. **[frontend-nextjs] `SupportFab` (só o botão)**
   - Posição e medidas da §4.8 (60 px desktop, 54 px mobile), `aria-label="Abrir atendimento"`, ícone `conversa`.
   - Bolha "Posso ajudar a escolher?" só no desktop, 20 s após o primeiro acesso, uma vez por sessão; respeitar `prefers-reduced-motion` na animação de entrada.
   - Painel de atendimento (interface, §8): **etapa 3**, depois do Produto; roteiro do assistente e links do WhatsApp: **etapa 6**.
   - **Pronto quando:** teste com timers falsos confirma a bolha aos 20 s e que não reaparece na mesma sessão.

8. **[frontend-nextjs] Montagem no `app/layout.tsx`**
   - `AnnouncementBar`, `Header`, `<main>`, `Footer`, `SupportFab`, conforme a §2. Link "Pular para o conteúdo" como primeiro elemento focável.
   - **Pronto quando:** todas as rotas exibem os componentes globais e o e2e de fumaça continua passando.

9. **Verificação em paralelo** (após as tarefas 1 a 8)
   - **[guardiao-do-design]** fidelidade com §3 e §4 a 1440 px e 390 px.
   - **[especialista-em-acessibilidade]** WCAG 2.2 AA: foco visível, alvos de 44 px, nomes acessíveis, menu mobile com teclado, contraste (não usar `--placeholder` em texto importante).
   - **[testes-e-qualidade]** testes de unidade dos componentes com lógica (`Button`, `icons`, `SupportFab`, `MobileMenu`) e e2e do cabeçalho a 360/390/1440 px.
   - **Pronto quando:** nenhum apontamento bloqueante em aberto.

10. **[revisor-de-codigo → documentador-tecnico] Fechamento da etapa 2**
    - **Pronto quando:** veredito ✅; commit `feat(design): adiciona tokens e componentes globais` publicado.

### Critérios de pronto da etapa 2

- Itens 1 e 2 do checklist da §14 atendidos (tokens e fontes).
- Sem rolagem horizontal de 360 a 1920 px nas páginas existentes.
- Lint, typecheck, testes, build e e2e passando.

### Riscos da etapa 2

- **Desvio visual por aproximação** (medidas "parecidas") → `guardiao-do-design` confere valor a valor contra a spec; sem valores inventados.
- **JavaScript desnecessário no cliente** → só `HeaderNav`, `MobileMenu` e `SupportFab` levam `"use client"`; conferir o tamanho do bundle no `npm run build`.
- **Botões sem ação até o fim da etapa 3** (`SupportFab`, "Fale conosco") → aceitável temporariamente; registrado aqui e resolvido quando o painel for construído.

---

## Etapa 3 — Home → Catálogo → Produto → painel de Atendimento

**Objetivo:** construir as quatro telas prototipadas (spec §5 a §8) com dados reais de `data/cheeses.ts` e ilustrações SVG do Apêndice A, fiéis ao protótipo a 1440 px e a 390 px. Sacola, frete, 3D real e roteiro do assistente ficam para as etapas 4, 5 e 6.

**Pré-requisito:** etapa 2 concluída (commit `b0a9fa8`).

**Decisões:** [ADR-0005](adr/0005-renderizacao-e-interatividade-da-etapa-3.md) (filtro do catálogo no servidor, produto estático com `dynamicParams = false`, atendimento por contexto + `<dialog>` modal nativo, ids de SVG com `useId()`, sem Zod nesta etapa).

### Escopo: o que entra e o que fica para depois

| Item da spec | Etapa 3 | Depois |
| --- | --- | --- |
| Botão **Adicionar** (cartões, quiz, produto, barra fixa) | `<button type="button">` real, visível e focável, **sem ação** | Etapa 4: liga ao `useSacola()` (ADR-0003) e mostra o toast **Adicionado à sacola. Boa escolha.** (§7.5) |
| Contador da sacola no cabeçalho | Continua estático em 0 | Etapa 4 |
| `ShippingCalculator` (§7.2, item 10) | **Só a marcação**: `<label for="cep">`, `<input id="cep" inputmode="numeric" placeholder="00000-000">` e o botão **Calcular** sem ação. Sem máscara e sem linha de resultado | Etapa 4: máscara, `calcularFrete(cep)` em `lib/commerce.ts`, resultado e mensagem de CEP fora de área |
| **Embalar para presente** | Botão secundário sem ação | Etapa 4 (opção de presente no checkout, §10.2) |
| `CheeseViewer` | **Só SVG**: estado `{ cortado, girando, zoom }` (§10.3); o alternador de corte troca A.5.1 ↔ A.5.2 (A.5.3 no celular) e o indicador **POR DENTRO / PEÇA INTEIRA**; a dica some na primeira interação. **Girar** e **Aproximar** mudam só o `aria-pressed`; **Tela cheia** não tem ação | Etapa 5: `model-viewer`, rotação de 10 s, `prefers-reduced-motion`, zoom, tela cheia, **Ver na mesa** (realidade aumentada), "Preparando a peça…" e mensagem sem WebGL (§7.5), giro no hover do `ProductCard` (§4.6) |
| Hero da Home | A.3 estático, com a pílula e a etiqueta | Etapa 5: `model-viewer` quando houver GLB |
| Painel de atendimento | Interface completa da §8: cabeçalho, abas, mensagens, faixa de passagem para humano e campo. A conversa mostra o **roteiro estático do protótipo** (§8.2, itens 1 a 7) (pendência P4). Respostas rápidas, campo, Enviar e os botões verdes **sem ação** | Etapa 6: árvore de opções em `lib/assistant.ts`, links `wa.me` em `lib/whatsapp.ts`, horário em `America/Sao_Paulo` e mensagem de cave fechada |
| **Fale com um queijista** (produto, §7.2, item 11) | Visual completo (ícone com traço `--whatsapp` e sublinhado dourado), como `<button>` sem ação | Etapa 6: vira `<a href="https://wa.me/…">` com a mensagem de produto |
| Abaixo da dobra do produto (§7.4) | **Fora** (pendência P10) | A definir com o dono |
| JSON-LD `Product`, sitemap | Fora | Etapa 8 (`performance-e-seo`) |

Nada é publicado em produção antes da etapa 9. Os controles sem ação existem só no ambiente local e no CI e estão listados em [Controles sem ação ao fim da etapa 3](#controles-sem-ação-ao-fim-da-etapa-3).

### Contratos

#### `data/cheeses.ts`

Estende o tipo da §9 sem mudar os nomes originais. Os campos novos estão marcados com `+`.

```ts
export type Origem = 'brasil' | 'mundo';
export type Shape = 'wide' | 'tall' | 'flat' | 'small';

/** Definido em `lib/dinheiro.ts` e reexportado aqui (assim `lib/` não depende de `data/`). */
export type { Centavos } from '@/lib/dinheiro';

export interface Formato {
  /** Estável: vai para a sacola na etapa 4. Valores: 'inteira' | 'meia' | 'fracao' | 'peca' | '500g' | '250g'. */
  id: string;
  /** "Peça inteira", "Meia peça", "Fração", "Peça". "[A DEFINIR]" quando a §9 só dá o peso (P2). */
  nome: string;
  /** + Rótulo do celular (§7.6): "Inteira", "Meia", "Fração". Sem ele, usa `nome`. */
  nomeCurto?: string;
  /** Texto literal da §9: "~1 kg", "~500 g", "200 g". */
  peso: string;
  /** Em centavos: 13600 = R$ 136,00. */
  preco: Centavos;
}

export type Nivel = 1 | 2 | 3 | 4 | 5;

export interface Selo {
  tipo: 'origem' | 'maturacao';
  texto: string;          // "60 dias de cura"
  textoCurto?: string;    // + celular (§7.6): "60 dias"
}

/** + Conteúdo da página de produto. Só o Canastra curado tem texto real; os demais usam '[A DEFINIR]' (§9). */
export interface DetalheDoQueijo {
  produtor: string;                    // "Queijaria [NOME DO PRODUTOR]"
  selos: readonly Selo[];
  descricao: string;                   // §7.2, item 5
  descricaoCurta: string;              // §7.6
  perfil: Readonly<Record<'intensidade' | 'cremosidade' | 'salinidade' | 'aroma', Nivel | null>>;
  historia: readonly string[];         // parágrafos da aba "A história"
  harmonizacao: { vinho: string; cerveja: string; acompanhamentos: string };
  comoServir: string;
  comoGuardar: string;
  fichaTecnica: string;                // texto único com " · ", literal da §7.3
}

/** + §7.5. Sem dado de estoque na spec: todos começam como 'disponivel'. `restam: null` mostra "[n]". */
export type Estoque =
  | { situacao: 'disponivel' }
  | { situacao: 'ultimas'; restam: number | null }
  | { situacao: 'esgotado' };

export interface Cheese {
  slug: string;
  nome: string;
  origem: Origem;
  tag: string;                                  // sobretítulo, MAIÚSCULAS
  nota: string;                                 // linha sensorial curta; também a meta description
  formatos: readonly [Formato, ...Formato[]];   // ao menos um; o primeiro é o padrão
  ilustracao: { shape: Shape; side: string; top: string };   // gerador A.6
  /** Posição na vitrine "Na cave esta semana" (1 a 4). A §9 usa boolean; a §5.4 tem ordem própria. */
  destaqueSemana?: 1 | 2 | 3 | 4;
  /** + Textos próprios do cartão da Home e do chat, quando diferem da §9 (pendência P1). */
  vitrine?: { tag?: string; nota?: string; linhaPequena?: string };
  detalhe: DetalheDoQueijo;                     // +
  estoque: Estoque;                             // +
}

export const QUEIJOS = [/* os 10 da §9, nesta ordem */] as const satisfies readonly Cheese[];
export type SlugDoQueijo = (typeof QUEIJOS)[number]['slug'];
```

Regras dos dados:

- **Ordem:** a da tabela da §9. Ela define a ordem do catálogo e o desempate do quiz (§10.4).
- **Slugs:** exatamente os da §9 (`canastra-curado`, …, `manchego`). Note que o slug do item 9 é `parmigiano-reggiano`, sem "dop".
- **Preços em centavos**, copiados da §9: 13600, 7800, 4900 · 21499, 11750 · 6490 · 11900 · 7400 · 7600 · 9145, 5573 · 22495, 12248 · 23000, 12500 · 23998, 12999.
- **Formatos e pesos:** literais da §9. Por exemplo, "Fração 200 g" tem `nome: 'Fração'` e `peso: '200 g'`, sem til. Os `id` de formato são únicos dentro de cada queijo.
- **Origem Brasil/Mundo:** campo `origem`. A trilha da §7.1 mostra "Brasil" ou "Mundo" com link para `/queijos?origem=brasil|mundo`.
- **Cores da ilustração** (`side`, `top`): literais da §9. São as únicas cores fora da §3.1 permitidas, porque pertencem aos SVGs (§14, item 1).
- **Canastra curado:** `detalhe` com os textos literais da §7.2, §7.3 e §7.6, incluindo as lacunas `[NOME DO PRODUTOR]`, `[ANO]`, `[Sugestão de tinto encorpado]`, `[Sugestão de cerveja]`, `[N]`, `[SELO E NÚMERO]` e `[DATA]`. Perfil: 4, 2, 3 e 4.
- **Demais 9 queijos:** todo texto de `detalhe` é `'[A DEFINIR]'`; `selos` tem um único selo `{ tipo: 'origem', texto: '[A DEFINIR]' }`; `perfil` tem todos os valores `null` (P14).
- **Vitrine da Home (P1):** `destaqueSemana` 1 = Canastra curado, 2 = Brie francês, 3 = Gorgonzola Dolce, 4 = Cabra com cinzas. O campo `vitrine` guarda os textos da tabela da §5.4 que diferem da §9.

#### Preço desconhecido (`[PREÇO]`)

- Os 10 queijos têm todos os preços na §9, então `Formato.preco` é `Centavos`, nunca nulo.
- Os kits da Home (§5.7) têm preço desconhecido. O tipo é `preco: Centavos | null`, e `null` significa lacuna. **Nunca** usar `0` nem `NaN` para isso.
- `lib/format.ts` ganha `formatarPrecoOuLacuna(centavos: Centavos | null): string`: com `null`, devolve `"R$ [PREÇO]"`, com o mesmo U+00A0 de `formatarPreco`.
- Na etapa 4, nada com preço `null` pode ir para a sacola. O tipo já obriga esse tratamento.
- Os kits ficam como constante dentro da seção Presentes da Home (`app/_home/`). Vão para `data/kits.ts` quando a página `/presentes` precisar deles (etapa 7).

#### `lib/catalogo.ts` (regras sobre os dados, sem JSX)

```ts
export function listarQueijos(): readonly Cheese[];
export function obterQueijo(slug: string): Cheese | undefined;
/** `searchParams.origem` → 'brasil' | 'mundo' | null (null = Todos; inválido ou repetido também vira null). */
export function lerOrigem(valor: string | string[] | undefined): Origem | null;
export function filtrarPorOrigem(origem: Origem | null): readonly Cheese[];
export function contarPorOrigem(): { todos: number; brasil: number; mundo: number };   // 10 / 7 / 3
export function destaquesDaSemana(): readonly Cheese[];                               // ordenados por destaqueSemana
/** Regra da §9: mais de um formato → "a partir de" + menor preço; um só → peso + preço. */
export function precoDeVitrine(q: Cheese): { linhaPequena: string; preco: Centavos };
/** Textos do cartão por contexto. 'home' e 'chat' aplicam `vitrine`; 'catalogo' usa a §9 pura. */
export function dadosDoCartao(q: Cheese, contexto: 'home' | 'catalogo' | 'chat'):
  { tag: string; nota: string; linhaPequena: string; preco: Centavos };
```

#### `lib/commerce.ts` (criado agora só com o cálculo do Pix; a etapa 4 acrescenta `calcularFrete` e `criarPedido`)

```ts
export const DESCONTO_PIX_PERCENTUAL = 5;
/** Preço × 0,95 em centavos, arredondado ao centavo (meio para cima), só com aritmética inteira: floor((c × 95 + 50) / 100). */
export function precoNoPix(centavos: Centavos): Centavos;
```

Casos obrigatórios no teste: 13600 → 12920, 7800 → 7410, 4900 → 4655 (os três da §7.2) e 11750 → 11163 (o caso de meio centavo).

#### `lib/quiz.ts` (puro, testado)

```ts
export type Sabor = 'suaves' | 'equilibrados' | 'intensos';
export type Uso = 'tabua' | 'presente' | 'para-mim';
export type Acompanhamento = 'tinto' | 'branco-espumante' | 'cerveja' | 'cafe-mel';
export interface RespostasDoQuiz { sabor: Sabor; uso: Uso; acompanhamento: Acompanhamento }
export const PERGUNTAS: readonly { chave: keyof RespostasDoQuiz; titulo: string; opcoes: readonly { valor: string; rotulo: string }[] }[];
export function recomendarQueijo(r: RespostasDoQuiz): SlugDoQueijo;
```

- Textos das perguntas e opções: literais da §5.6.
- Pontuação: +1 por critério atendido (§10.4). Empate desfeito pela ordem do catálogo.
- Interpretações (P7): "presente" dá +1 aos queijos cujo maior formato tem ~500 g ou mais; "Canastra" em "tábua" vale para os dois Canastras; "para mim" não pontua.

#### `lib/assistant.ts` (só tipos e o roteiro provisório; a lógica é da etapa 6)

```ts
export type MensagemDoChat =
  | { id: string; tipo: 'assistente'; texto: string }
  | { id: string; tipo: 'cliente'; texto: string }
  | { id: string; tipo: 'produto'; slug: SlugDoQueijo }
  | { id: string; tipo: 'respostas-rapidas'; opcoes: readonly { id: string; rotulo: string; sugerida?: boolean }[] };

/** §8.2, itens 1 a 7, literais. Provisório até a etapa 6 (P4). */
export const ROTEIRO_DO_PROTOTIPO: readonly MensagemDoChat[];
```

O `SupportPanel` só renderiza uma lista `MensagemDoChat[]`. Na etapa 6, o roteiro determinístico passa a produzir essa lista sem mudar o componente.

#### Atendimento (`components/Atendimento.tsx`, client)

```ts
export function AtendimentoProvider(props: { children: ReactNode }): JSX.Element; // renderiza children + <SupportPanel/>
export type OpcoesDeFechamento = { devolverFoco?: boolean }; // false quando a ação já leva o foco a outro lugar
export function useAtendimento(): {
  aberto: boolean;
  abrir: (origem?: HTMLElement) => void; // origem = gatilho que recebe o foco ao fechar (reserva: document.activeElement, por causa do Safari)
  fechar: (opcoes?: OpcoesDeFechamento) => void;
};
/** <button type="button" aria-haspopup="dialog"> que chama abrir(); aceita as variantes visuais do Button. */
export function BotaoAbrirAtendimento(props: /* props do Button sem href */): JSX.Element;
```

- O `SupportFab` passa a usar `useAtendimento().abrir`. Sai a prop `onClick` e entra `aria-haspopup="dialog"`.
- No `Footer` (que continua Server Component), "Fale conosco" vira `<BotaoAbrirAtendimento>` com as mesmas classes de hoje.
- **Pedir ajuda** no catálogo: `<BotaoAbrirAtendimento>` principal, altura 48, `padding: 0 26px` (§6).

#### Ilustrações (Apêndice A)

| Arquivo | Conteúdo | Usado em |
| --- | --- | --- |
| `components/CheeseIllustration.tsx` | Gerador **A.6**, literal (props `shape`, `side`, `top`, `label`) | Catálogo (todos os 10), resultado do quiz e palco do produto para os 9 queijos sem A.5 (P3) |
| `components/ilustracoes/HeroCanastra.tsx` | **A.3** | Hero da Home |
| `components/ilustracoes/MiniaturasDaCave.tsx` | **A.4.1 a A.4.4** + mapa `Partial<Record<SlugDoQueijo, Componente>>` | Home 5.4 e resultado do quiz, quando existir para o queijo |
| `components/ilustracoes/CanastraProduto.tsx` | **A.5.1, A.5.2, A.5.3** + mapa por slug `{ cortado, inteiro, cortadoCelular }` | `CheeseViewer` |
| `components/ilustracoes/MiniaturaDoChat.tsx` | **A.7** | Cartão de produto no chat (Canastra); outros queijos usam A.6 a 84 px |

- **Pasta nova `components/ilustracoes/`:** são 9 SVGs literais (~400 linhas) que funcionam como ativos, não como UI. Separá-los deixa a `components/` legível e permite ao `guardiao-do-design` comparar cada arquivo com o Apêndice A.
- **Literalidade:** copiar do Apêndice A e só converter os atributos para JSX (`stroke-width` → `strokeWidth` etc.). O `style` inline pode ir para CSS Module com os mesmos valores.
- **Ids únicos (ADR-0005):** cada componente com `<defs>` chama `useId()` e prefixa todos os `id` e `url(#…)`. Os componentes são síncronos, para funcionar como Server ou Client Component. O A.6 não tem ids e por isso nunca colide.
- **Sem duplicar SVG no catálogo:** o catálogo chama `<CheeseIllustration {...q.ilustracao} label={q.nome} />` para cada queijo. Não existe SVG literal por queijo além dos do Apêndice A.
- **Acessibilidade:** os `role="img"` e `aria-label` do Apêndice A são mantidos.

### Fronteiras Server/Client da etapa 3

| Página / componente | Tipo | Motivo |
| --- | --- | --- |
| `app/page.tsx` e seções em `app/_home/` (Hero, Garantias, Na cave, Brasil e mundo, Presentes, Escola) | Server | Conteúdo estático |
| `app/_home/Newsletter.tsx` | Client | Troca o formulário pela mensagem de sucesso (P9) |
| `Quiz` | Client | Passos, seleção (`aria-pressed`), resultado, refazer. Recebe do servidor só os resumos dos queijos; a pontuação vem de `lib/quiz.ts` |
| `ProductCard`, `CheeseIllustration`, `ilustracoes/*` | Server (usáveis em client) | Sem estado |
| `app/queijos/page.tsx` | Server, **dinâmica** | Lê `searchParams` e filtra no servidor (ADR-0005) |
| `FiltroOrigem` | Client | Chips com `aria-pressed` + `router.replace(…, { scroll: false })`; marcação imediata do chip |
| `app/queijos/[slug]/page.tsx` | Server, **estática** | `generateStaticParams` + `dynamicParams = false` + `notFound()` + `generateMetadata` |
| Trilha, cabeçalho de informações, `SensoryProfile`, `ShippingCalculator` (só marcação), conteúdo das abas | Server | Estáticos |
| `CheeseViewer` | Client | Estado `{ cortado, girando, zoom }` e dica que some |
| `PainelDeCompra` (= `FormatPicker` + preço/Pix + `QuantityStepper` + Adicionar + barra fixa do celular) | Client, **uma ilha só** | Formato e quantidade alimentam o preço, o Pix e a barra fixa; um estado único evita sincronizar ilhas |
| `ProductTabs` | Client | `tablist` WAI-ARIA com setas. Os painéis chegam do servidor como `ReactNode`; todos ficam no HTML, os inativos com `hidden` |
| `components/useAbas.ts` | Hook client | Teclado das abas (setas, Home, End, `tabIndex` móvel), compartilhado por `ProductTabs` e `SupportPanel` (dois usos reais) |
| `AtendimentoProvider`, `BotaoAbrirAtendimento`, `SupportPanel` | Client | Diálogo, abas e estado aberto/fechado |
| `Footer` | Server (continua) | Só o "Fale conosco" vira ilha client |

Metadados: o `app/layout.tsx` passa a usar `title: { default: 'Ateliê do Queijo', template: '%s — Ateliê do Queijo' }`. Home: padrão. Catálogo: `title: 'Queijos'` e description com o parágrafo da §6 (P13). Produto: `title: q.nome` (por exemplo "Canastra curado — Ateliê do Queijo", §13) e `description: q.nota`. `params` é `Promise` (conferido na documentação do Next 16); tipar com `PageProps<'/queijos/[slug]'>`.

### Tarefas

Cada tarefa termina com testes passando (`lint`, `typecheck`, `test`, `build`, `test:e2e`). Estimativa de linhas entre parênteses.

**Bloco A — Fundação (commit 1)**

1. **[engenheiro-de-ecommerce] Preço no Pix e preço lacunar** (~80)
   - `lib/commerce.ts` com `DESCONTO_PIX_PERCENTUAL` e `precoNoPix`; `formatarPrecoOuLacuna` em `lib/format.ts`; testes.
   - **Pronto quando:** os 4 casos de `precoNoPix` e `formatarPrecoOuLacuna(null) === "R$ [PREÇO]"` (com U+00A0) passam no `npm test`.

2. **[frontend-nextjs] `data/cheeses.ts` e `lib/catalogo.ts`** (~350)
   - Tipos e os 10 queijos conforme o contrato; detalhe literal do Canastra; `[A DEFINIR]` nos demais.
   - Testes: 10 queijos com slugs únicos e na ordem da §9; todos os preços são inteiros; `contarPorOrigem()` = 10/7/3; `precoDeVitrine` do Canastra = "a partir de" + 4900 e do Gorgonzola = "~300 g" + 7600; `lerOrigem('xyz')`, `lerOrigem(['brasil','mundo'])` e `lerOrigem(undefined)` → `null`; destaques na ordem Canastra, Brie, Gorgonzola, Cabra.
   - **Pronto quando:** testes passam e o `guardiao-do-design` confere os textos e os números contra a §9, a §5.4 e a §7.

3. **[especialista-3d-webgl] Gerador A.6 e miniaturas A.4/A.7** (~300)
   - `CheeseIllustration.tsx`, `ilustracoes/MiniaturasDaCave.tsx`, `ilustracoes/MiniaturaDoChat.tsx`, com prefixo de `useId()`.
   - Teste unitário: renderizar duas vezes a mesma miniatura A.4.1 não repete nenhum `id`, e todo `url(#…)` aponta para um id do mesmo SVG.
   - **Pronto quando:** o teste passa; o `build` funciona com os componentes usados num Server Component; o `guardiao-do-design` compara os paths com o Apêndice A.

4. **[especialista-3d-webgl] Ilustrações A.3 e A.5** (~300)
   - `ilustracoes/HeroCanastra.tsx` e `ilustracoes/CanastraProduto.tsx` (A.5.1, A.5.2, A.5.3), com o mesmo esquema de ids.
   - **Pronto quando:** os mesmos testes de ids passam e o guardião aprova a literalidade.

5. **[frontend-nextjs] `ProductCard`** (~150)
   - §4.6: variantes `home` (`gap: 12px`) e `catalogo` (`gap: 10px`, sobretítulo `0.16em`). Recebe o queijo e o contexto; escolhe a ilustração pelo contexto (A.4 na Home quando existir, A.6 nos demais), sempre com `role="img"` e `aria-label` (§13). Nome é link para `/queijos/[slug]` nos dois contextos (§10.5). Botão **Adicionar** em contorno dourado, sem ação.
   - **Pronto quando:** teste confirma o link do nome, a linha pequena, o preço formatado e um único `<button>` "Adicionar".

6. **[revisor-de-codigo] Revisão do bloco A** → commit `feat(catalogo): adiciona dados dos queijos, ilustrações e cartão de produto`.

**Bloco B — Home (commit 2)**

7. **[frontend-nextjs] Home, parte 1: hero, garantias, Na cave, Brasil e mundo** (~350)
   - §5.2 a §5.5 com medidas e textos literais. "Na cave" usa `destaquesDaSemana()` com A.4 e `dadosDoCartao(q, 'home')`. Os links da §5.5 levam a `/queijos?origem=brasil|mundo`.
   - **Pronto quando:** as seções aparecem na ordem da §5 com os `padding` 48/96, 112 e 128.

8. **[frontend-nextjs] Home, parte 2: Presentes, Escola e Newsletter** (~300)
   - §5.7 a §5.9. Kits com `formatarPrecoOuLacuna(null)`. Newsletter: `<label>` + `<input type="email" required>`; ao enviar um e-mail válido, troca o formulário pela mensagem de sucesso, **sem enviar nada para a rede** (P9). Itens da Escola: links inteiros para `/aprenda` até existirem artigos (etapa 7).
   - **Pronto quando:** teste de componente confirma a troca pela mensagem **Pronto! Você vai receber os próximos lotes raros.** e que nenhum `fetch` é chamado.

9. **[frontend-nextjs] Quiz** (~350)
   - `lib/quiz.ts` + testes (pelo menos: intensos/para mim/tinto → `canastra-curado` pelo desempate; suaves/presente/branco → `brie-frances`). `Quiz.tsx` com sobretítulo **PERGUNTA N DE 3**, chips `Button variante="opcao"`, **Próxima pergunta** / **Ver meu queijo** desabilitado até haver escolha (P8), resultado (**SEU QUEIJO É**, h2, ilustração A.4 ou A.6, parágrafo P6, **Adicionar à sacola** sem ação, **Refazer o teste** como botão de estilo link).
   - Foco: a cada passo, levar o foco ao sobretítulo ou à pergunta, para o leitor de tela anunciar o novo passo (validar com o especialista de acessibilidade).
   - **Pronto quando:** e2e percorre as três perguntas só com o teclado e chega ao resultado; refazer volta à pergunta 1.

10. **Verificação da Home, em paralelo:** `guardiao-do-design` (1440 e 390 px contra o protótipo, com "Equilibrados" selecionado para comparar o estado da §5.6), `especialista-em-acessibilidade`, `testes-e-qualidade` (e2e: ordem das seções, ausência de ids duplicados no documento, sem rolagem horizontal de 360 a 1920 px) → `revisor-de-codigo` → commit `feat(home): adiciona a página inicial com quiz e newsletter`.

**Bloco C — Catálogo (commit 3)**

11. **[frontend-nextjs] `/queijos`** (~300)
    - §6 literal. Server Component com `searchParams` → `lerOrigem` → `filtrarPorOrigem`. O número do parágrafo vem de `contarPorOrigem().todos`. `FiltroOrigem` client com **Todos (10) · Brasil (7) · Mundo (3)** em `role="group" aria-label="Filtrar por origem"`. Mensagem de nenhum resultado da §6. Caixa de ajuda com **Pedir ajuda** (ligado ao painel na tarefa 19; até lá, sem ação). Metadados (P13).
    - O `FocoNoConteudo` reage só a `pathname`, então o filtro (que muda só a busca) não rouba o foco. Manter assim.
    - **Pronto quando:** e2e confirma: clicar em Brasil → URL `?origem=brasil`, 7 cartões, chip com `aria-pressed="true"`; abrir `/queijos?origem=mundo` direto → 3 cartões já no HTML; `?origem=xyz` → 10 cartões e "Todos" selecionado.

12. **[testes-e-qualidade] Ativar o `test.fixme`** de `e2e/layout-global.spec.ts` ("navegar pelo menu mobile leva o foco para #conteudo") e incluir `/queijos` no teste de rolagem horizontal.
    - **Pronto quando:** o teste passa sem `fixme`.

13. **Verificação do catálogo** (guardião, acessibilidade, testes) → `revisor-de-codigo` → commit `feat(catalogo): adiciona o catálogo com filtro por origem`.

**Bloco D — Produto (commit 4)**

14. **[frontend-nextjs] Rota, trilha, coluna de informações e perfil sensorial** (~350)
    - `generateStaticParams`, `dynamicParams = false`, `generateMetadata`, `notFound()`. Trilha `<nav aria-label="Você está em">` com `aria-current="page"` no último item e separadores `aria-hidden`. Sobretítulo, h1, produtor, selos, descrição (§7.2, itens 1 a 5). `SensoryProfile` (§7.3) com `role="img" aria-label="Intensidade: 4 de 5"`; com valor `null`, mostra **[A DEFINIR]** no lugar das barras.
    - **Pronto quando:** `npm run build` lista as 10 rotas estáticas; `/queijos/nao-existe` responde 404 (e2e); o `<title>` é "Canastra curado — Ateliê do Queijo".

15. **[especialista-3d-webgl] `CheeseViewer` (só SVG)** (~300)
    - Palco, dica, indicador, `role="toolbar" aria-label="Controles do 3D"`, alternador de corte com `aria-pressed` e rótulos **Ver peça inteira** / **Ver por dentro**, Girar e Aproximar com `aria-pressed`, Tela cheia (`aria-label="Tela cheia"`), miniaturas (**3D** ativa + três `[FOTO: …]`).
    - Ilustração por queijo: A.5 quando existir no mapa (Canastra). Nos demais, A.6 sem alternador de corte e com indicador **PEÇA INTEIRA** (P3).
    - Celular: A.5.3 quando cortado (troca por CSS, sem JavaScript de *media query*); botões **Ver peça inteira** · **Aproximar**. **Ver na mesa** não aparece até a etapa 5 (P11).
    - Interface pública estável para a etapa 5: `<CheeseViewer queijo={q} />`. O `model-viewer` entra por dentro, sem mudar quem usa.
    - **Pronto quando:** teste de componente: o clique no alternador troca o `aria-label` do SVG visível, o indicador e o `aria-pressed`; a dica some após a primeira interação.

16. **[frontend-nextjs] `PainelDeCompra`: formatos, preço, Pix, quantidade e barra fixa** (~400)
    - `FormatPicker` (`<fieldset>` + `<legend>` **FORMATO**, rádios (P22), linha 2 "peso · preço"), preço 40 px e **ou R$ X no Pix (5% off)** com `precoNoPix`, `QuantityStepper` (mínimo 1, `aria-label`s da §7.2), **Adicionar à sacola** sem ação, **Embalar para presente**, `ShippingCalculator` (só marcação), **Dúvidas sobre este queijo? Fale com um queijista** (sem ação).
    - Estados de estoque da §7.5 (últimas unidades, esgotado com o botão virando **Avise-me**, sem ação; P15), cobertos por teste com dados fictícios.
    - Barra fixa ≤ 768 px (§7.6) com o preço do formato escolhido e o atributo `data-barra-compra`. `z-index` abaixo do `SupportFab` (40). A página reserva `padding-bottom` igual à altura da barra, para ela não cobrir o rodapé.
    - `SupportFab`: em `SupportFab.module.css`, `@media (max-width: 768px) { :global(body:has([data-barra-compra])) .fab { bottom: 100px; } }`. Sem JavaScript; só vale onde a barra existe de fato.
    - **Pronto quando:** teste: escolher "Meia peça" mostra R$ 78,00 e **ou R$ 74,10 no Pix (5% off)** no painel e na barra; "Fração" → R$ 49,00 / R$ 46,55; − desabilitado em 1. E2e a 390 px: a barra está fixa, o FAB está a 100 px do fundo e não se sobrepõe à barra.

17. **[frontend-nextjs] `ProductTabs` e `useAbas`** (~250)
    - §7.3: cinco abas com os textos literais, **A história** como padrão; painéis com `role="tabpanel"` e `aria-labelledby`; setas esquerda/direita, Home e End.
    - **Pronto quando:** teste: seta direita na aba ativa move o foco e a seleção para "Harmonização"; End vai para "Ficha técnica"; só um painel visível.

18. **Verificação do produto** (guardião a 1440 e 390 px, inclusive a tela de 390 × 844 da §7.6; acessibilidade; testes) → `revisor-de-codigo` → commit `feat(produto): adiciona a página de produto com visualizador em SVG`.

**Bloco E — Painel de atendimento (commit 5)**

19. **[frontend-nextjs] `AtendimentoProvider`, gatilhos e ligações** (~200)
    - Contexto no `app/layout.tsx`. `SupportFab` usa `abrir()`; "Fale conosco" (rodapé) e **Pedir ajuda** (catálogo) viram `BotaoAbrirAtendimento`. Todos com `aria-haspopup="dialog"`.
    - **Pronto quando:** e2e: cada um dos três gatilhos abre o painel; Esc fecha e o foco volta ao gatilho de origem.

20. **[frontend-nextjs] `SupportPanel` (interface da §8)** (~400)
    - `<dialog>` com `showModal()` (ADR-0005), `aria-labelledby` apontando para **Assistente do Ateliê**. Desktop: 390 × 640, raio 16, borda `--pedra`, ancorado acima do FAB, com altura limitada à janela (P16). ≤ 768 px: tela cheia. `::backdrop` transparente (sem cor nova).
    - Cabeçalho (§8.1) com avatar (símbolo de 22 px, só o "A" com a olhadura de cima: **conferir com o guardião qual recorte do A.1 usar**), fechar (`aria-label="Fechar atendimento"`). Abas `role="tablist" aria-label="Como prefere conversar?"` com `useAbas`.
    - Aba Assistente: mensagens de `ROTEIRO_DO_PROTOTIPO` (P4); cartão de produto no chat com A.7, `dadosDoCartao(q, 'chat')` e botão circular `aria-label="Ver Canastra curado em 3D"` que leva a `/queijos/canastra-curado` e fecha o painel; faixa de passagem para humano; formulário com `<label>` visualmente oculto e Enviar (`aria-label="Enviar"`) sem ação.
    - Aba Queijista (WhatsApp): horário **Seg a sex, 9h às 18h · sáb, 9h às 15h** + botão verde **Falar com um queijista** sem ação (P5).
    - **Pronto quando:** teste de componente: abas trocam com as setas; e2e: painel com 390 × 640 a 1440 px e tela cheia a 390 px; o link do cartão navega para o produto.

21. **Verificação do painel** (guardião, acessibilidade, com foco especial no diálogo modal e nas abas; testes) → `revisor-de-codigo` → commit `feat(atendimento): adiciona o painel de atendimento`.

22. **[documentador-tecnico] Fechamento da etapa 3**
    - README (rotas existentes), atualizar este plano (situação da etapa 3 e pendências respondidas).
    - **Pronto quando:** commit `docs: fecha a etapa 3` publicado (ou incluído no commit 5).

### Commits da etapa 3

| # | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| 1 | Tarefas 1 a 6 | `feat(catalogo): adiciona dados dos queijos, ilustrações e cartão de produto` | ✅ Publicado (`4aefc52`) |
| 2 | Tarefas 7 a 10 | `feat(home): adiciona a página inicial completa` | ✅ Publicado (`ea3ca9f`) |
| 3 | Tarefas 11 a 13 | `feat(catalogo): adiciona o catálogo com filtro por origem` | ✅ Publicado (`fb997bd`) |
| 4 | Tarefas 14 a 18 | `feat(produto): adiciona a página de produto com visualizador em SVG` | ✅ Publicado (`594fc87`, mais as correções de acessibilidade em `301743a`) |
| 5 | Tarefas 19 a 22 | `feat(atendimento): adiciona o painel de atendimento` | ✅ Publicado |

Cada commit só sai depois do veredito ✅ (ou ⚠️ resolvido) do `revisor-de-codigo` e com `lint`, `typecheck`, `test`, `build` e `test:e2e` passando (CLAUDE.md, "Antes de commitar").

### Controles sem ação ao fim da etapa 3

| Controle | Onde | Ganha ação na |
| --- | --- | --- |
| Adicionar / Adicionar à sacola | Cartões, quiz, produto, barra fixa | Etapa 4. Até lá: `aria-disabled="true"` + `aria-describedby` para o texto `.sr-only` "Sacola disponível em breve" (botão focável, visual igual) |
| Calcular (frete), Embalar para presente | Produto | Etapa 4 |
| Avise-me (esgotado) | Produto | Pendência P15 |
| Girar, Aproximar (efeito visual), Tela cheia | Produto | Etapa 5 |
| Fale com um queijista, Falar com um queijista (verde) | Produto e painel | Etapa 6 |
| Respostas rápidas, campo de mensagem, Enviar | Painel | Etapa 6 |
| Buscar, Minha conta | Cabeçalho | Já pendente (ver tabela geral) |

### Verificação (vale para cada bloco)

- **`guardiao-do-design`:** compara a página com o protótipo `design/Ateliê do Queijo — Telas.html` aberto no navegador, a **1440 px** e a **390 px**. O arquivo é um *bundle* comprimido: a busca por texto não funciona, então a comparação é visual. Confere valor a valor contra a spec e aponta desvios com o seletor e o valor esperado.
- **`especialista-em-acessibilidade`:** WCAG 2.2 AA. Pontos de atenção: `aria-pressed` nos chips, formatos e alternador; abas WAI-ARIA (produto e painel); diálogo modal (foco inicial, Esc, foco devolvido); foco no quiz a cada passo; ilustrações com `role="img"`; alvos de 44 px; `aria-current` da trilha.
- **`testes-e-qualidade`:** testes de unidade de `lib/` e dos componentes client; e2e das rotas novas a 360, 390, 768, 1440 e 1920 px sem rolagem horizontal; teste de documento sem `id` duplicado e com todo `url(#…)` resolvido (Home, catálogo, produto com o painel aberto).
- **`revisor-de-codigo`:** antes de cada commit.
- **`auditor-de-seguranca`:** não é obrigatório nesta etapa, porque não há dado sensível nem envio para a rede. Volta na etapa 4.

### Critérios de pronto da etapa 3

- Itens da §14 atendidos: Home com as seções na ordem e os espaçamentos exatos; hero; faixa de confiança; catálogo com 10 queijos e filtro na URL; produto com alternador, formatos que mudam preço e Pix, e abas; barra fixa no celular com o FAB acima dela; textos idênticos à spec, com lacunas.
- Item "Painel de atendimento" da §14 **parcialmente** atendido: duas abas, horário e botão verde visíveis. O roteiro real e a mensagem pré-preenchida do WhatsApp são da etapa 6.
- Sem rolagem horizontal de 360 a 1920 px em `/`, `/queijos`, `/queijos/canastra-curado` e `/queijos/brie-frances`.
- `test.fixme` de `e2e/layout-global.spec.ts` ativado e passando.
- Nenhuma dependência nova.

### Riscos da etapa 3

- **`useId()` em Server Component ou formato do id quebrando `url(#…)`** → teste de ids no build e no e2e; plano B: prefixo por prop (ADR-0005).
- **Divergência entre a §5.4 e a §9** (textos da Home × dados) → campo `vitrine` isolado e pendência P1. Se o dono unificar, basta apagar o campo.
- **Tarefa 16 no limite de 400 linhas** → se passar, separar a barra fixa do celular em tarefa própria.
- **Barra fixa cobrindo conteúdo ou o FAB** → `padding-bottom` na página, `z-index` abaixo de 40 e e2e a 390 px.
- **Diálogo modal no desktop bloqueando a página** → é comportamento esperado de `showModal()`. Se o dono ou o especialista em acessibilidade preferirem um painel não modal, reabrir o ADR-0005.
- **Escopo do 3D vazando para cá** → o `CheeseViewer` não importa `@google/model-viewer` nesta etapa (dependência só entra com ADR na etapa 5).

### Decisões do dono para a etapa 3

Todas as recomendações abaixo foram **aceitas pelo dono em 2026-10-26** (P1, P3 e P4 confirmadas individualmente). P6 continua com a lacuna visível até o dono aprovar um modelo de texto.

| # | Pergunta | Decisão (recomendação aceita pelo dono em 2026-10-26) |
| --- | --- | --- |
| P1 | A §5.4 e a §9 divergem: tag do Canastra ("BRASIL · CANASTRA, MG" × "BRASIL · SERRA DA CANASTRA, MG"), tag da Cabra ("BRASIL · LEITE DE CABRA" × "BRASIL · SERRA DA MANTIQUEIRA, SP"), nota do Brie ("…cogumelo e nozes." × "…cogumelo.") e do Gorgonzola ("levemente adocicado" × "adocicado"), e a Cabra aparece com "a partir de" na Home embora tenha um só formato (a regra da §9 daria "~160 g"). Qual vale? | Home e cartão do chat seguem a §5.4 literalmente (protótipo aprovado), por meio do campo `vitrine`; catálogo e produto seguem a §9. Se o dono quiser um texto único, apagamos `vitrine`. |
| P2 | Brie, Parmigiano e Manchego têm formatos só com peso (~500 g, ~250 g). Que nome mostrar na 1ª linha do botão de formato? | `nome: '[A DEFINIR]'` (lacuna visível). Sugestão para o dono: "Meia peça"/"Fração" ou só o peso. |
| P3 | Só o Canastra tem ilustração de produto cortada/inteira (A.5). O que o palco mostra para os outros 9? | A.6 gerada para o queijo, sem alternador de corte e com indicador **PEÇA INTEIRA**, até haver arte ou GLB cortado. |
| P4 | O que a conversa do painel mostra antes da etapa 6? | O roteiro estático do protótipo (§8.2, itens 1 a 7), para permitir a comparação visual. O site não é publicado antes da etapa 9; na etapa 6, a conversa passa a começar só com a saudação e as respostas rápidas. |
| P5 | Dentro do horário, o que a aba "Queijista (WhatsApp)" mostra além do botão? A spec só dá o texto de fora do horário. | A linha de horário **Seg a sex, 9h às 18h · sáb, 9h às 15h** + o botão verde **Falar com um queijista**. |
| P6 | Texto de "Por que combina com você" no resultado do quiz ("gerado das respostas", sem modelo na spec). | Lacuna visível **[POR QUE COMBINA COM VOCÊ]** até o dono aprovar um modelo. Proposta para aprovação: "Você prefere sabores {sabor}, vai servir {uso} e acompanhar com {acompanhamento}. O {nome} foi o que mais combinou com as três respostas." |
| P7 | Interpretação do quiz: "presente → priorizar formatos maiores/kits" e "tábua → … Canastra". | Presente: +1 para queijos com formato de ~500 g ou mais; o resultado é sempre um queijo, nunca um kit. Tábua: os dois Canastras. |
| P8 | O protótipo mostra "Equilibrados" selecionado. O quiz começa com algo marcado? | Nada pré-selecionado; **Próxima pergunta** desabilitado até a escolha. |
| P9 | Newsletter: para onde vai o e-mail? | Nesta etapa, só a mensagem de sucesso, sem gravar nem enviar nada. Escolher o provedor (e a base legal da LGPD) antes da publicação. |
| P10 | §7.4 (Combina com este queijo, Avaliações, Outros queijos da mesma região) não tem layout, e "mel" e "tábua" não existem no catálogo. | Fora da etapa 3. Avaliações só quando houver avaliações reais. Rever na etapa 7, quando o dono definir os produtos de acompanhamento. |
| P11 | **Ver na mesa** (realidade aumentada) sem GLB. | Não exibir enquanto não houver GLB, mesmo na etapa 5. A tela de 390 px fica com dois botões no palco. |
| P12 | No celular, o que sai do fluxo da coluna de informações? A §7.6 não cita a linha do produtor, o preço inline, a quantidade, "Embalar para presente" nem o link do WhatsApp. | Esconder a linha do produtor, o preço inline, a quantidade e o "Adicionar" inline (a barra fixa os substitui e adiciona 1 unidade). Manter "Embalar para presente" e o link do WhatsApp logo abaixo dos formatos, antes do frete. |
| P13 | `<title>` e description do catálogo (a spec só dá o exemplo do produto). | "Queijos — Ateliê do Queijo"; description: **10 queijos escolhidos um a um. Filtre por origem ou deixe o queijista sugerir.** |
| P14 | Selos e perfil sensorial dos 9 queijos sem detalhe. | Um selo **[A DEFINIR]** e, no perfil, **[A DEFINIR]** no lugar das barras. |
| P15 | O que faz o **Avise-me** (esgotado), e de onde vem o estoque? | Todos os queijos ficam como disponíveis. O estado esgotado existe no código e nos testes, com botão sem ação, até o dono definir o fluxo (provavelmente e-mail, junto com P9). |
| P16 | Distância entre o painel e o FAB no desktop, e comportamento em janelas com menos de ~780 px de altura. | `bottom: 100px` (28 + 60 + 12 do `gap` do FAB) e `max-height` limitada à altura visível da janela, com a área de mensagens rolando. |
| P17 | Erro de e-mail inválido na newsletter (a spec só define o sucesso). | **Aprovado pelo dono:** "Informe um e-mail válido, por exemplo voce@email.com." em `--casca-texto`, com a borda do campo na mesma cor. |
| P18 | Borda dos campos (`--pedra-clara`, 1,71:1 sobre `--carvao`) abaixo dos 3:1 da WCAG 1.4.11. | **Mantida a spec pelo dono**, com rótulo visível, fundo próprio e foco dourado nos campos. Desvio aceito; rever antes da publicação. Vale também para CEP e mensagem do chat. |
| P19 | Estado desabilitado de botões (não existe na spec nem no protótipo). | **Aprovado pelo dono:** opacidade 0,5, para qualquer botão desabilitado do site. |
| P20 | Desempate do quiz: "suaves + presente + cerveja" recomenda o Tipo Gruyère (empata com o Brie e vem antes no catálogo). | **Mantido pelo dono** (2026-10-26): desempate pela ordem do catálogo, sem prioridade por sabor. |
| P21 | Botão de corte do 3D: a §7.2 pede rótulo alternado ("Ver peça inteira" / "Ver por dentro") e `aria-pressed`, o que o WAI-ARIA desaconselha em conjunto. | **Decidido pelo dono** (2026-10-27): `role="toolbar"` com setas e `aria-pressed` com rótulo fixo **Ver por dentro**; o indicador POR DENTRO / PEÇA INTEIRA continua alternando. Desvio de texto a anotar no checklist da §14. |
| P22 | Formatos (§7.2, item 6) com `aria-pressed`. | **Decidido pelo dono** (2026-10-27): rádios reais (`input type=radio` oculto + `label`), mesmo visual. |
| P23 | Estado ativo de Girar e Aproximar (a spec só define o repouso). | **Decidido pelo dono** (2026-10-27): borda `--ouro` e fundo `--ouro-vidro`, como nos formatos ativos. |

---

## Pendências e decisões em aberto

| Item | Situação | Quem decide |
| --- | --- | --- |
| Hospedagem (ex.: Vercel ou outra) | **Não decidida.** Nada de publicar em produção sem aprovação. Será tratada na etapa 9 com ADR próprio. | Dono do projeto |
| Gateway de pagamento (Shopify Storefront, Mercado Pago ou Pagar.me, com Pix) | **Não decidido.** Até lá, só funções simuladas em `lib/commerce.ts` (spec §2). | Dono do projeto |
| Número do WhatsApp, CNPJ, endereço, `[PREÇO]` e demais lacunas | Ficam visíveis entre colchetes até o dono preencher. | Dono do projeto |
| Provedor de IA para o assistente | Etapa 6 começa com roteiro determinístico; integração com IA real exigirá ADR. | Dono do projeto + `especialista-em-ia-conversacional` |
| Destino de "Entregas refrigeradas", "Trocas e devoluções" e "Perguntas frequentes" (rodapé) | A spec não define rotas. Ficam como texto não interativo até existir página. | Dono do projeto |
| Contraste de `--placeholder` sobre `--carvao` (4,47:1, abaixo de 4,5:1) | **Aceito como provisório** pelo dono (2026-10-26): só aparece nos textos `[FOTO: …]`. Rever antes da publicação se ainda houver placeholders. | Dono do projeto |
| Teste e2e do foco após navegar pelo menu mobile (`test.fixme` em `e2e/layout-global.spec.ts`) | Depende de `/queijos` existir; **ativar na etapa 3** (tarefa 12). | `testes-e-qualidade` |
| Pendências P1 a P16 da etapa 3 | Ver [Decisões do dono para a etapa 3](#decisões-do-dono-para-a-etapa-3). Cada uma tem um padrão provisório. | Dono do projeto |
| Controles sem ação (Buscar, Minha conta, "Fale conosco", botão flutuante) | "Fale conosco" e o botão flutuante são ligados ao painel no fim da etapa 3; Buscar e Minha conta precisam de destino antes da publicação. | `frontend-nextjs` + dono do projeto |
| Painel de atendimento: rolar a conversa até a última mensagem | **Resolvido:** ao abrir, só o log rola até o fim (suave; instantâneo com `prefers-reduced-motion`). Testes unitário e e2e. | Dono do projeto |
| Painel de atendimento: fechar ao mudar de rota | **Resolvido:** `Atendimento.tsx` fecha o painel (sem devolver o foco) quando o `usePathname()` muda; mudança só de searchParams não fecha. Testes unitário e e2e (`goBack`). | Dono do projeto |
| Etapa 8 (`performance-e-seo`): enxugar o pacote global do painel | **Resolvido:** o cartão do chat usa `lib/cartaoDoChat.ts` (módulo estático, conferido por teste contra `dadosDoCartao`); o painel não importa mais `lib/catalogo` nem `data/cheeses`. | `performance-e-seo` |
| Busca e conta no celular | O cabeçalho compacto (§7.6) não tem Buscar nem Minha conta. Definir outro caminho quando essas funções existirem. | Dono do projeto |

## Decisões de interpretação da spec (etapa 2)

Registradas para não serem rediscutidas. Todas seguem "o padrão mais próximo já definido" (spec §0) ou foram aprovadas pelo dono.

- **h1 de páginas ≤ 768 px: 38 px** (≈ 60% de 64 px, §3.4; igual ao h1 de produto).
- **SupportFab no celular fora do produto:** `right: 16px; bottom: 16px`, círculo de 54 px. Na página de produto, `bottom: 100px` (§7.6), na etapa 3.
- **Cabeçalho:** sem borda só na Home (desktop e celular); com borda em todas as outras rotas (§4.3).
- **Links do rodapé:** `--creme`, hover `--ouro` (padrão do menu, §4.3/§4.4). Com **44 px de altura só em ≤ 768 px**, aprovado pelo dono; o desktop segue a §4.9.
- **Painel do menu mobile** (não descrito na spec): fundo `--cave`, borda inferior `--pedra`, links de 16 px em `--creme` com 44 px de altura. **Aprovado pelo dono** (2026-10-26).
- **Client Components da etapa 2:** `HeaderFrame` (borda por rota), `HeaderNav`, `MobileMenu`, `SupportFab` e o componente que move o foco para `#conteudo` ao trocar de rota.
