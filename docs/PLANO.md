# Plano de implementação — Ateliê do Queijo

> Fonte da verdade: `ATELIE-DO-QUEIJO-SPEC.md`. Decisões técnicas: `docs/adr/`.
> Última atualização: 2026-10-26. Etapas em andamento: **1 (base)** e **2 (tokens e componentes globais)**.

Convenções deste plano:

- Cada tarefa cabe em um PR revisável (idealmente < 400 linhas alteradas).
- `[agente]` indica o responsável pela implementação. Toda tarefa termina com o `revisor-de-codigo` (veredito ✅ ou ⚠️ resolvido) antes do commit, conforme o `CLAUDE.md`.
- "Pronto quando" é verificável: um comando que passa, um arquivo que existe ou um comportamento observável.

---

## Visão geral das etapas

| # | Etapa | Responsáveis principais | Situação |
| --- | --- | --- | --- |
| 1 | Base do projeto e ferramentas | `devops-e-deploy`, `arquiteto-de-software` | Em andamento |
| 2 | Tokens de design e componentes globais | `frontend-nextjs`, `guardiao-do-design` | Planejada |
| 3 | Home → Catálogo → Produto (com `ProductCard` e `data/cheeses.ts`) → interface do painel de Atendimento (§8) | `frontend-nextjs`, `guardiao-do-design` | A detalhar |
| 4 | Sacola (contexto + `localStorage`), frete simulado e checkout simulado em `lib/commerce.ts` | `engenheiro-de-ecommerce` | A detalhar |
| 5 | Visualizador 3D (`CheeseViewer` com `@google/model-viewer`) e fallback SVG do Apêndice A | `especialista-3d-webgl` | A detalhar |
| 6 | Assistente com roteiro determinístico, horários e links do WhatsApp no painel de atendimento | `especialista-em-ia-conversacional` | A detalhar |
| 7 | Páginas restantes: Presentes, Aprenda, Produtores, 404 (textos da §12) | `frontend-nextjs` | A detalhar |
| 8 | Rodada de qualidade: testes, acessibilidade, performance e SEO, segurança | `testes-e-qualidade`, `especialista-em-acessibilidade`, `performance-e-seo`, `auditor-de-seguranca` | A detalhar |
| 9 | CI completo, ambientes e checklist de aceite da §14 | `devops-e-deploy`, `documentador-tecnico` | A detalhar |

As etapas 3 a 9 serão detalhadas pelo `arquiteto-de-software` no início de cada uma.

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

## Pendências e decisões em aberto

| Item | Situação | Quem decide |
| --- | --- | --- |
| Hospedagem (ex.: Vercel ou outra) | **Não decidida.** Nada de publicar em produção sem aprovação. Será tratada na etapa 9 com ADR próprio. | Dono do projeto |
| Gateway de pagamento (Shopify Storefront, Mercado Pago ou Pagar.me, com Pix) | **Não decidido.** Até lá, só funções simuladas em `lib/commerce.ts` (spec §2). | Dono do projeto |
| Número do WhatsApp, CNPJ, endereço, `[PREÇO]` e demais lacunas | Ficam visíveis entre colchetes até o dono preencher. | Dono do projeto |
| Provedor de IA para o assistente | Etapa 6 começa com roteiro determinístico; integração com IA real exigirá ADR. | Dono do projeto + `especialista-em-ia-conversacional` |
