# Plano de implementação — Ateliê do Queijo

> Fonte da verdade: `ATELIE-DO-QUEIJO-SPEC.md`. Decisões técnicas: `docs/adr/`.
> Última atualização: 2026-11-05 (detalhamento da etapa 8). Etapas 1, 2, 3, 4, 5, 6 e 7 **concluídas**; **próxima: etapa 8, detalhada** (aguarda as respostas do dono às perguntas P68 a P84). A loja segue **simulada**.
>
> **AVISO: dados de negócio fictícios** (WhatsApp, CNPJ, endereço, frete, parcelas, produtor) estão em `data/ficticio.ts` e **precisam ser trocados antes da publicação**; o build de produção na Vercel falha enquanto a trava existir. Ver [Decisões do dono de 2026-11-03](#decisões-do-dono-de-2026-11-03-d1-a-d34).
>
> **RETOMADA (2026-11-05): as etapas 1 a 7 estão concluídas; a etapa 8 (rodada de qualidade) está DETALHADA e aguarda o dono responder as [perguntas P68 a P84](#perguntas-ao-dono-etapa-8).** A etapa 7 entregou `/presentes`, `/aprenda`, `/aprenda/<slug>`, `/produtores` e a 404 da §12 (`app/not-found.tsx`), com [ADR-0011](adr/0011-paginas-de-conteudo-e-404.md) (Aceito) e as [perguntas P53 a P67](#perguntas-ao-dono-etapa-7) respondidas com a opção A. Todos os links do menu, do rodapé e da Home levam a uma página com h1. Ver [Etapa 7](#etapa-7--páginas-restantes-presentes-aprenda-produtores-e-404).
>
> - **Próximo passo:** o dono responde P68 a P84 e aprova (ou não) os ADRs propostos [0014](adr/0014-dependencias-da-rodada-de-qualidade.md) (dependências: `@axe-core/playwright` e cobertura do Vitest) e [0015](adr/0015-cabecalhos-http-e-csp.md) (cabeçalhos HTTP e CSP). Depois, a sessão principal segue as [tarefas da etapa 8](#etapa-8--rodada-de-qualidade-testes-acessibilidade-desempenho-seo-e-segurança) na ordem dos blocos A a F. Toda a herança (etapas 4, 6 e 7) foi distribuída no [mapa da herança](#mapa-da-herança-da-etapa-8). Nada da etapa 8 foi implementado ainda.
> - **Estado:** etapa 7 publicada nos commits `0589676`, `6791989`/`eca43a5`, `7602c3d`/`22a508a` e `c5b514e` (ver [Commits da etapa 7](#commits-da-etapa-7)); etapa 6 em `a744972` e `a37640c` ([Commits da etapa 6](#commits-da-etapa-6)). A etapa 5 está nos commits `92fb989` e `a990e3a`. **Nenhum queijo tem GLB**: o bloco C da etapa 5 (hero da Home e giro no cartão) segue **pendente, só com o 1º GLB** (P40 = B).
> - **Lacunas do dono que seguem visíveis:** os 12 textos do assistente e o aviso de nova aba (`[A DEFINIR: …]`, P52) em `TEXTOS_DO_ROTEIRO` (`lib/roteiro.ts`) e `AVISO_DE_NOVA_ABA` (`lib/whatsapp.ts`). Como editar: [`docs/conteudo.md`](conteudo.md#assistente-horário-e-whatsapp). Pendências do bloco B (nova aba para quem enxerga, `depoisDaAcao`, erro do chunk, contraste da borda do campo, aba sem número) em [Verificação do bloco B](#verificação-do-bloco-b-etapa-6-correções-aplicadas-e-pendências).
> - **Publicação (etapa 9):** o número do WhatsApp é resolvido só no servidor; publicar **somente na Vercel** ou garantir `VERCEL_ENV=production`, e conferir que `5520900000000` não aparece em `.next/static`. A trava de build contra `[A DEFINIR` em produção e a conferência automática do número em `.next/static` foram **antecipadas para a etapa 8** (tarefa 5, P73 e P74); a validação profissional do texto de saúde continua na etapa 9. Ver [`docs/ambiente.md`](ambiente.md).
> - **Tudo o que aguarda o dono** (textos novos, contrastes, comportamentos, LGPD) está em [Decisões e textos que aguardam o dono (fim da etapa 4)](#decisões-e-textos-que-aguardam-o-dono-fim-da-etapa-4), com as decisões D1 a D34 já aplicadas por cima. Nada ali bloqueia a etapa 8.
> - **Como retomar:** abra o Claude Code na pasta do projeto, peça "continue de onde paramos" e ele lerá esta nota. Rode `git status` e `npm run lint && npm run typecheck && npm run format:check && npm test && npm run modelos:validar && npm run build && npm run test:e2e` para confirmar o estado antes de seguir.
> - **Para a etapa 8 (teste instável):** `e2e/pagina-sacola.spec.ts:23` (e, em 2026-11-05, `e2e/checkout.spec.ts:13`) falhou uma vez, sob carga, e passou isolado e nas reexecuções (suspeita: corrida de hidratação; o *gate* `data-hidratado` de `e2e/_apoio/teste.ts` entrou em `24d8de4`). Dois testes do vitest também falharam uma vez na primeira execução; os limites de tempo de `lib/pedido.test.ts` foram relaxados por precaução. A confirmação está na tarefa 18 da etapa 8. A divisão do contexto da conversa em dois **já foi feita** ([ADR-0012](adr/0012-folga-do-orcamento-de-js.md), decisão 3: `useAtendimento()` e `useConversa()`); o `axe-core` está na tarefa 10 (ADR-0014, Proposto).
> - **Guias:** [`docs/conteudo.md`](conteudo.md) (queijos, modelos 3D, assistente, horário e WhatsApp, kits, artigos e produtores) e [`docs/ambiente.md`](ambiente.md). O `conteudo.md` já cobre kits, artigos e produtores (etapa 7); frete, Pix e gateway entram na etapa 9. O `CHANGELOG.md` registra as etapas 4 a 7.
>
> Fluxo usado em cada bloco: `frontend-nextjs` (ou o especialista da tarefa) implementa → `guardiao-do-design` (porta 3000, build), `especialista-em-acessibilidade` (`next dev -p 3001`, sem build) e `revisor-de-codigo` conferem em paralelo, sem editar → correções pelo implementador → lint, typecheck, format:check, test, build e test:e2e → commit e push. Na etapa 4, o `auditor-de-seguranca` entrou nos blocos B, C e E. Reaproveitar `BotaoEmBreve` para controles sem ação (Avise-me, WhatsApp, 3D) e o token `--largura-conteiner` nos contêineres.

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
| 4 | Sacola (contexto + `localStorage`), frete simulado e checkout simulado em `lib/commerce.ts` | `engenheiro-de-ecommerce`, `frontend-nextjs`, `auditor-de-seguranca` | **Concluída** ([detalhe](#etapa-4--sacola-frete-simulado-e-checkout-simulado)); P24 a P38 decididos em 2026-10-27 e implementados; commits `48e6ebe` a `b06c604` |
| 5 | Visualizador 3D (`CheeseViewer` com `@google/model-viewer`) e fallback SVG do Apêndice A | `especialista-3d-webgl` | **Concluída** ([detalhe](#etapa-5--visualizador-3d-com-fallback-svg)); blocos A e B publicados (`92fb989`, `a990e3a`), [ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md) Aceito. **Bloco C pendente, só com o 1º GLB** |
| 6 | Assistente com roteiro determinístico, horários e links do WhatsApp no painel de atendimento | `especialista-em-ia-conversacional`, `frontend-nextjs` | **Concluída** ([detalhe](#etapa-6--assistente-com-roteiro-determinístico-horário-e-links-do-whatsapp)); blocos A e B publicados (`a744972`, `a37640c`), [ADR-0010](adr/0010-assistente-deterministico-e-whatsapp.md) Aceito; P44 a P52 decididos em 2026-11-03. Os textos do P52 seguem como `[A DEFINIR: …]` até o dono escrever |
| 7 | Páginas restantes: Presentes, Aprenda, Produtores, 404 (textos da §12) | `frontend-nextjs`, `guardiao-do-design`, `especialista-em-acessibilidade` | **Concluída** ([detalhe](#etapa-7--páginas-restantes-presentes-aprenda-produtores-e-404)); blocos A a D publicados (`0589676`, `eca43a5`, `7602c3d`, `c5b514e`), [ADR-0011](adr/0011-paginas-de-conteudo-e-404.md) Aceito; P53 a P67 decididas (opção A). Textos da §12 seguem com lacunas do dono |
| 8 | Rodada de qualidade: testes, acessibilidade, performance e SEO, segurança | `performance-e-seo`, `devops-e-deploy`, `auditor-de-seguranca`, `especialista-em-acessibilidade`, `frontend-nextjs`, `testes-e-qualidade` | **Detalhada** em 2026-11-05 ([detalhe](#etapa-8--rodada-de-qualidade-testes-acessibilidade-desempenho-seo-e-segurança)): blocos A a F, 21 tarefas, ADRs [0014](adr/0014-dependencias-da-rodada-de-qualidade.md) e [0015](adr/0015-cabecalhos-http-e-csp.md) Propostos; aguarda as respostas P68 a P84 |
| 9 | CI completo, ambientes e checklist de aceite da §14 | `devops-e-deploy`, `documentador-tecnico` | A detalhar; herda itens da etapa 4 ([seção](#etapa-9--ci-completo-ambientes-e-aceite-herança-da-etapa-4) e [lista](#fica-para-depois-segurança-e-lgpd)) |

A etapa 9 será detalhada pelo `arquiteto-de-software` no início dela.

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
   - `.env.example` documentando as variáveis previstas, sem valores reais. Previsto por ora: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (comentada, usada na etapa 6; renomeada depois para `WHATSAPP_NUMBER`, [ADR-0013](adr/0013-numero-do-whatsapp-so-no-servidor.md)).
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

/** União explícita (ordem livre). `Cheese.slug: SlugDoQueijo`; a paridade com `QUEIJOS` é fechada pelo `tsc`
 *  (tipo condicional `ParidadeDosSlugs`, só tipos, sem custo no pacote). */
export type SlugDoQueijo =
  | 'canastra-curado' | 'canastra-meia-cura-premiado' | 'creme-do-marajo' | 'penadinho-de-bufala'
  | /* … os 10 slugs da §9 */ 'manchego';
export const QUEIJOS = [/* os 10 da §9, nesta ordem */] as const satisfies readonly Cheese[];
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

#### `lib/commerce.ts` (criado agora só com o cálculo do Pix; a etapa 4 acrescenta as funções puras de frete, CEP e totais; `calcularFrete` e `criarPedido` ficam em `lib/pedido.server.ts`)

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
| Adicionar / Adicionar à sacola | Cartões, quiz, produto, barra fixa | Etapa 4, tarefa 7 (`BotaoAdicionar`). Até lá: `aria-disabled="true"` + `aria-describedby` para o texto `.sr-only` "Sacola disponível em breve" (botão focável, visual igual) |
| Contador da sacola (cabeçalho desktop e celular) | Cabeçalho | Etapa 4, tarefa 6 (`LinkDaSacola`) |
| Calcular (frete) | Produto | Etapa 4, tarefa 9 |
| Embalar para presente | Produto | Etapa 4, tarefa 7 (P31) |
| Avise-me (esgotado) | Produto | Pendência P15 |
| Girar, Aproximar (efeito visual), Tela cheia | Produto | Etapa 5 |
| Fale com um queijista, Falar com um queijista (verde) | Produto e painel | **Resolvido na etapa 6** (tarefas 5 e 7): `<a href="https://wa.me/…">` via `LinkDoWhatsApp`; somem sem número |
| Respostas rápidas, campo de mensagem, Enviar | Painel | **Resolvido na etapa 6** (tarefa 6): ligados ao motor `lib/roteiro.ts` |
| Buscar, Minha conta | Cabeçalho | Já pendente (ver tabela geral) |

### Verificação (vale para cada bloco)

- **`guardiao-do-design`:** compara a página com o protótipo `design/Ateliê do Queijo — Telas.html` aberto no navegador, a **1440 px** e a **390 px**. O arquivo é um *bundle* comprimido: a busca por texto não funciona, então a comparação é visual. Confere valor a valor contra a spec e aponta desvios com o seletor e o valor esperado.
- **`especialista-em-acessibilidade`:** WCAG 2.2 AA. Pontos de atenção: `aria-pressed` nos chips, formatos e alternador; abas WAI-ARIA (produto e painel); diálogo modal (foco inicial, Esc, foco devolvido); foco no quiz a cada passo; ilustrações com `role="img"`; alvos de 44 px; `aria-current` da trilha.
- **`testes-e-qualidade`:** testes de unidade de `lib/` e dos componentes client; e2e das rotas novas a 360, 390, 768, 1440 e 1920 px sem rolagem horizontal; teste de documento sem `id` duplicado e com todo `url(#…)` resolvido (Home, catálogo, produto com o painel aberto).
- **`revisor-de-codigo`:** antes de cada commit.
- **`auditor-de-seguranca`:** não é obrigatório nesta etapa, porque não há dado sensível nem envio para a rede. Volta na etapa 4.

### Critérios de pronto da etapa 3

- Itens da §14 atendidos: Home com as seções na ordem e os espaçamentos exatos; hero; faixa de confiança; catálogo com 10 queijos e filtro na URL; produto com alternador, formatos que mudam preço e Pix, e abas; barra fixa no celular com o FAB acima dela; textos idênticos à spec, com lacunas.
- Item "Painel de atendimento" da §14 **parcialmente** atendido: duas abas, horário e botão verde visíveis. O roteiro real e a mensagem pré-preenchida do WhatsApp são da etapa 6. **Atendido por inteiro na etapa 6** (ver [Critérios de pronto da etapa 6](#critérios-de-pronto-da-etapa-6)).
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

## Etapa 4 — Sacola, frete simulado e checkout simulado

**Objetivo:** fazer a compra funcionar de ponta a ponta **em simulação**. Os botões Adicionar alimentam uma sacola persistida no navegador, o contador do cabeçalho reflete a soma das quantidades, a calculadora de frete responde por CEP, a página `/sacola` mostra subtotal e frete grátis, e o `/checkout` percorre Entrega → Pagamento → Confirmação (spec §7.2, itens 8 a 10; §7.5; §10.1; §10.2; §14, item "Sacola"). Nenhuma cobrança, nenhum gateway, nada publicado.

**Situação: CONCLUÍDA (2026-10-29).** Blocos A a E publicados (`48e6ebe` a `b06c604`, ver [Commits da etapa 4](#commits-da-etapa-4)). A loja é **simulada**: nenhum pagamento real, nenhum e-mail enviado, frete e pedido simulados. O que ficou aberto está em [Decisões e textos que aguardam o dono (fim da etapa 4)](#decisões-e-textos-que-aguardam-o-dono-fim-da-etapa-4).

**Pré-requisito:** etapa 3 concluída (`0664bf7`) e as decisões P24 a P38 respondidas. **Atendido:** decididas pelo dono em 2026-10-27.

**Decisões:** [ADR-0003](adr/0003-estado-da-sacola.md) (contexto + `useReducer` + `localStorage`, preços derivados), [ADR-0007](adr/0007-validacao-com-zod-mini.md) (Zod via `zod/mini`, orçamento de pacote; **aprovado pelo dono em 2026-10-27**), [ADR-0008](adr/0008-sacola-frete-e-checkout-simulados.md) (formato salvo e tolerância a falhas, índice do catálogo, Server Actions, rotas, dados pessoais).

**Skills:** antes de cada tarefa, o agente confere o mapa em `SKILLS-ATELIE-DO-QUEIJO.md`. Em especial, as regras `client-localstorage-schema` e `rerender-*` da `vercel-react-best-practices` valem para as tarefas 2 e 5. A spec vence em caso de conflito.

### Escopo: o que entra e o que fica para depois

| Item | Etapa 4 | Depois |
| --- | --- | --- |
| Sacola (§10.1) | `SacolaProvider` no layout, `localStorage` versionado, sincronização entre abas, contador no cabeçalho | Sacola entre dispositivos (exige conta e backend) |
| Adicionar (cartões, quiz, produto, barra fixa) | Ligado à sacola, com o aviso **Adicionado à sacola. Boa escolha.** | O assistente adiciona à sacola pelo chat (etapa 6) |
| Embalar para presente | Adiciona à sacola e marca o pedido como presente (P31); cartão com mensagem (até 200 caracteres) e data no checkout | Kits de `/presentes` (etapa 7); preço da embalagem, se houver (P31) |
| Frete (§7.2, item 10) | Máscara de CEP, `calcularFrete(cep)` **simulado** (prazo `[N]`, valor `R$ [PREÇO]` abaixo de R$ 180), fora de área simulado (P27, P28) | Tabela real de frete/transportadora; preenchimento do endereço pelo CEP (ViaCEP ou parecido, com ADR) |
| `/sacola` | Lista, quantidade, remover, subtotal, barra de frete grátis, estado vazio | "Combina com este queijo" na sacola (fora da spec) |
| `/checkout` (§10.2) | Três etapas na mesma rota, aviso de envio, Pix ou Cartão **sem coletar dado de cartão**, erro de pagamento simulado, confirmação | Gateway real (Shopify Storefront, Mercado Pago ou Pagar.me), QR code do Pix, parcelamento real, e-mail transacional, nota fiscal, webhooks (Route Handlers), estoque real |
| Pedido | `criarPedido` **simulado** no servidor: valida, recalcula, devolve número; não grava | Persistência de pedidos, "Onde está meu pedido?" (etapa 6 + gateway) |
| Avise-me (esgotado) | Continua sem ação (P15) | Com P9/P15 (provedor de e-mail) |
| Fale com um queijista, WhatsApp | Sem mudança | Etapa 6 |
| Metadados | `title` e `robots: noindex` de `/sacola` e `/checkout` | JSON-LD `Product` e sitemap (etapa 8; sacola e checkout ficam fora do sitemap) |

**Fora, por regra do projeto:** nenhuma conta em gateway, nenhuma chave real, nenhuma cobrança e nenhuma publicação (CLAUDE.md). Nenhuma variável de ambiente nova nesta etapa.

### Contratos

Todos os valores em dinheiro são `Centavos` (inteiros). Nenhum preço sai do navegador para o servidor.

#### `lib/sacola.ts` (puro, sem React; usado no cliente e no servidor)

```ts
import type { SlugDoQueijo } from '@/data/cheeses';   // só tipo: não entra no pacote
import type { Centavos } from './dinheiro';

export const CHAVE_DA_SACOLA = 'atelie:sacola:v1';
export const VERSAO_DA_SACOLA = 1;
export const QUANTIDADE_MAXIMA_POR_ITEM = 10;   // P35
export const MAXIMO_DE_LINHAS = 30;
export const TAMANHO_MAXIMO_SALVO = 8 * 1024;   // caracteres do JSON salvo

export interface ItemDaSacola { slug: SlugDoQueijo; formatoId: string; quantidade: number }
export interface Sacola { itens: readonly ItemDaSacola[]; presente: boolean }
export const SACOLA_VAZIA: Sacola;

export type AcaoDaSacola =
  | { tipo: 'adicionar'; slug: SlugDoQueijo; formatoId: string; quantidade: number; presente?: boolean }
  | { tipo: 'alterar-quantidade'; slug: SlugDoQueijo; formatoId: string; quantidade: number }
  | { tipo: 'remover'; slug: SlugDoQueijo; formatoId: string }
  | { tipo: 'definir-presente'; presente: boolean }
  | { tipo: 'limpar' }
  | { tipo: 'substituir'; sacola: Sacola };          // leitura do storage e evento de outra aba

/** Puro. Soma linhas iguais, limita a 1..QUANTIDADE_MAXIMA_POR_ITEM e ignora formato inexistente ou esgotado. */
export function reduzirSacola(s: Sacola, a: AcaoDaSacola): Sacola;
/** Soma das quantidades (contador do cabeçalho, §10.1). */
export function totalDeItens(s: Sacola): number;
/** Nunca lança. Aplica a sanitização do ADR-0008 §1. `corrigida` indica que é preciso regravar. */
export function lerSacolaSalva(bruto: string | null): { sacola: Sacola; corrigida: boolean };
export function serializarSacola(s: Sacola): string;

/** O que /sacola e /checkout recebem do servidor (sem textos de detalhe). */
export interface ResumoParaSacola {
  slug: SlugDoQueijo; nome: string; esgotado: boolean;
  ilustracao: { shape: Shape; side: string; top: string };
  formatos: readonly { id: string; nome: string; peso: string; preco: Centavos }[];
}
export interface LinhaPrecificada extends ItemDaSacola {
  nome: string; formatoNome: string; peso: string; precoUnitario: Centavos; total: Centavos;
}
/** Junta itens e catálogo. Itens sem correspondência vão para `ignorados` (não quebram a página). */
export function precificarSacola(s: Sacola, catalogo: readonly ResumoParaSacola[]):
  { linhas: readonly LinhaPrecificada[]; subtotal: Centavos; ignorados: number };
```

#### `lib/formatosDaSacola.ts` (índice estático, ADR-0008 §2)

```ts
/** slug → ids de formato válidos. Escrito à mão; teste de paridade com QUEIJOS. Não importa data/. */
export const FORMATOS_POR_QUEIJO: Readonly<Record<SlugDoQueijo, readonly string[]>>;
export const ESGOTADOS: ReadonlySet<SlugDoQueijo>;   // hoje vazio (P15)
export function ehFormatoValido(slug: unknown, formatoId: unknown): slug is SlugDoQueijo;
```

#### `lib/commerce.ts` (acrescenta à etapa 3; `precoNoPix` não muda)

```ts
export const FRETE_GRATIS_A_PARTIR_DE: Centavos = 18000;              // §1 e §10.1; ≥, P29
/** max(0, 18000 − subtotal). 0 → "Frete grátis garantido." */
export function faltaParaFreteGratis(subtotal: Centavos): Centavos;

/** CEP só com os 8 dígitos. Marca nominal: só nasce de `normalizarCep`. */
export type Cep = string & { readonly __marca: 'Cep' };
/** Mais de 9 caracteres (ou não texto) → null antes de qualquer outra operação. Depois do trim, só aceita /^\d{5}-?\d{3}$/ (dígitos ASCII); senão null. */
export function normalizarCep(entrada: string): Cep | null;
/** Máscara progressiva para o campo: "0131" → "0131", "01310100" → "01310-100" (no máximo 9 caracteres). */
export function mascararCep(entrada: string): string;

// (tipo; a função SIMULADA `calcularFrete(cep: Cep): Promise<ResultadoDoFrete>` fica em lib/pedido.server.ts)
export type ResultadoDoFrete =
  | { situacao: 'atendido'; prazoDiasUteis: number | null; valor: Centavos | null }   // null = lacuna [N] / [PREÇO] (P27)
  | { situacao: 'fora-de-area' };
/** Aplica o frete grátis: subtotal ≥ 18000 → 0; senão o valor do resultado (pode ser null). */
export function valorDoFrete(r: Extract<ResultadoDoFrete, { situacao: 'atendido' }>, subtotal: Centavos): Centavos | null;

export type FormaDePagamento = 'pix' | 'cartao';
export interface TotaisDoPedido {
  subtotal: Centavos;
  frete: Centavos | null;          // null → "R$ [PREÇO]"
  descontoPix: Centavos;           // subtotal − precoNoPix(subtotal) se Pix; 0 se cartão (P30)
  total: Centavos | null;          // null se o frete for null
}
export function calcularTotais(subtotal: Centavos, frete: Centavos | null, pagamento: FormaDePagamento): TotaisDoPedido;

export type ResultadoDoPedido =
  | { ok: true; numero: string; email: string; totais: TotaisDoPedido }
  | { ok: false; motivo: 'pagamento-recusado' | 'fora-de-area' | 'sacola-invalida' };
/**
 * SIMULADO (spec §2: `criarPedido(sacola)`; aqui recebe o pedido já validado e precificado).
 * Não grava nada. Número: "AQ-" + 6 dígitos de crypto.getRandomValues (Web Crypto, amostragem por
 * rejeição, sem viés de módulo), gerado no servidor; é só rótulo de exibição, nunca chave de acesso
 * e NÃO é único por si (1 milhão de números): com persistência, unicidade no banco ou 8 dígitos.
 * Mora em lib/pedido.server.ts (`import 'server-only'`); só o tipo PedidoPrecificado fica em commerce.ts. Recusa o pagamento quando cliente.email === 'recusa@exemplo.com'
 * (domínio reservado RFC 2606), só na implementação simulada e marcado com
 * `// SIMULAÇÃO: remover com o gateway`, para testar o erro da §10.2.
 */
export function criarPedido(pedido: PedidoPrecificado): Promise<ResultadoDoPedido>;
```

#### `lib/pedido.ts` (esquemas `zod/mini` compartilhados e mensagens; ADR-0007)

```ts
export const UFS: readonly ['AC', 'AL', /* … as 27 */ 'TO'];
export type CampoDoCheckout =
  | 'nome' | 'email' | 'telefone' | 'cep' | 'logradouro' | 'numero' | 'complemento'
  | 'bairro' | 'cidade' | 'uf' | 'mensagem' | 'dataDeEntrega' | 'pagamento';

// Regras (P32, P34): limite de tamanho conferido antes de qualquer regex; trim e NFC em todos os
// textos; controle (Cc), invisíveis e bidirecionais recusados (lista completa na tarefa 3);
// mensagem com até 6 linhas (\n é o único Cc liberado, só nela).
// nome 2–100 · email válido ≤ 254 · telefone DDD [1-9][1-9] + 8–9 dígitos · cep 8 dígitos · logradouro 1–120
// número 1–10 · complemento ≤ 60 (opcional) · bairro 1–60 · cidade 1–60 · uf ∈ UFS
// presente: mensagem ≤ 200 caracteres (contados por ponto de código) e ≤ 6 linhas · dataDeEntrega AAAA-MM-DD,
//   de amanhã até +60 dias, calculada em America/Sao_Paulo · pagamento ∈ {'pix','cartao'}
export const esquemaEntrega;      // cliente + endereço + presente (null se não for presente)
export const esquemaPagamento;
export const esquemaEntradaDoPedido;   // { itens: ItemDaSacola[] (1..30), presente, entrega, pagamento }
export type EntradaDoPedido = z.infer<typeof esquemaEntradaDoPedido>;

/** Mensagens em pt-BR por campo, no padrão do P17 ("Informe …, por exemplo …"). Textos: P25. */
export const MENSAGENS_DE_ERRO: Readonly<Record<CampoDoCheckout, string>>;
export function validarEntrega(bruto: unknown):
  | { ok: true; valor: z.infer<typeof esquemaEntrega> }
  | { ok: false; erros: Partial<Record<CampoDoCheckout, string>> };
```

#### Server Actions (ADR-0008 §3)

```ts
// app/_acoes/frete.ts — 'use server'; exporta SÓ consultarFrete
'use server';
/** Confere typeof e tamanho antes de normalizar. Retorno só { ok, resultado | erro }, sem eco da entrada. */
export async function consultarFrete(entrada: unknown):
  Promise<{ ok: true; resultado: ResultadoDoFrete } | { ok: false; erro: 'cep-invalido' | 'indisponivel' }>;
// `cep-invalido`: entrada fora do formato (a interface mostra a mensagem do P25).
// `indisponivel`: falha interna (a interface mostra a mensagem genérica do P25 e permite tentar de novo).
// Nota: o frete usa a chave `erro`; `confirmarPedido` usa `motivo` (ADR-0008 §3). Os dois nomes
// são deliberados: `erro` é só o que a interface mostra; `motivo` carrega a união de casos do pedido.

// app/_acoes/pedido.ts — 'use server'; exporta SÓ confirmarPedido
'use server';
/** Valida com esquemaEntradaDoPedido, confere o índice e o estoque, precifica com data/cheeses,
 *  recalcula o frete pelo CEP e chama criarPedido. Não registra log com dados pessoais. */
export async function confirmarPedido(entrada: unknown): Promise<
  | ResultadoDoPedido
  | { ok: false; motivo: 'dados-invalidos'; erros: Partial<Record<CampoDoCheckout, string>> }
>;
```

#### Sacola no cliente (`components/SacolaProvider.tsx`, `AvisoDaSacola.tsx` e `avisoDaSacola.contexto.ts`, client)

```ts
export function SacolaProvider(props: { children: ReactNode }): JSX.Element; // renderiza children + <AvisoDaSacola/>
export type EstadoDaSacola = { sacola: Sacola; pronta: boolean /* false no servidor e até ler o localStorage */; totalDeItens: number };
export type AcoesDaSacola = {   // identidade estável (useMemo/useCallback)
  adicionar(item: { slug: SlugDoQueijo; formatoId: string; quantidade?: number; presente?: boolean }): void; // mostra o aviso
  alterarQuantidade(slug: SlugDoQueijo, formatoId: string, quantidade: number): void;
  remover(slug: SlugDoQueijo, formatoId: string): void;
  definirPresente(presente: boolean): void;
  limpar(): void;
};
export function useAcoesDaSacola(): AcoesDaSacola;   // não re-renderiza quando a sacola muda
export function useEstadoDaSacola(): EstadoDaSacola; // re-renderiza a cada mudança da sacola
export function useSacola(): EstadoDaSacola & AcoesDaSacola; // compatibilidade; evitar em código novo
// Regra: quem só dispara ações usa useAcoesDaSacola; quem só lê usa useEstadoDaSacola; useSacola só se precisar dos dois.
/** Substitui BotaoDaSacola. <button type="button"> com as variantes visuais do Button. */
export function BotaoAdicionar(props: { slug: SlugDoQueijo; formatoId: string; quantidade?: number;
  presente?: boolean; children: ReactNode } & /* variante, tamanho, aria-label, style */): JSX.Element;
/** Link do cabeçalho: "Sacola" + contador. Sem aria-label (WCAG 2.5.3): nome por conteúdo, "Sacola N itens"
 *  (1 → "item"), com "itens" só para leitores de tela. */
export function LinkDaSacola(): JSX.Element;
```

- `lib/catalogo.ts` ganha `resumoParaSacola(): readonly ResumoParaSacola[]` e `formatoDeVitrine(q: Cheese): Formato`, o formato cujo preço o cartão mostra (P24). O `ResumoDoQueijo` do quiz ganha `formatoIdDeVitrine`.
- `BotaoDaSacola.tsx` é **apagado**. `BotaoEmBreve` continua existindo para Avise-me, o WhatsApp e o 3D.

### Persistência em `localStorage` (resumo do ADR-0008 §1)

| Situação | Comportamento |
| --- | --- |
| Primeira visita, sem chave | Sacola vazia; nada é gravado até a primeira mudança |
| JSON corrompido, mais de 8 KB, `v` diferente de 1 | Sacola vazia; a chave é sobrescrita na próxima gravação |
| Item com `slug`/`formatoId` inexistente, esgotado ou fora do esquema | Só esse item é descartado; a versão limpa é regravada |
| Quantidade 0, negativa, fracionária, texto ou > 10 | Limitada a 1..10 (texto ou não inteiro → item descartado) |
| Linhas repetidas | Somadas e limitadas a 10 |
| Chaves extras, `__proto__`, preço ou nome no JSON | Ignorados (o esquema descarta as chaves desconhecidas; o preço sempre vem do catálogo) |
| `localStorage` indisponível ou cheio (`SecurityError`, `QuotaExceededError`) | Sacola só em memória, sem erro visível |
| Outra aba muda a sacola | Evento `storage` → relê e sanitiza e substitui **só em memória, sem regravar**; `newValue: null` → vazia |
| Hidratação | Servidor e 1ª renderização: vazia, `pronta: false`; leitura no `useEffect`; **nunca grava antes de ler** |
| Versão futura (v2) | `v: 1` passa por `migrarDeV1` antes do esquema novo; a chave muda para `atelie:sacola:v2` e a v1 é removida |

### Aviso "Adicionado à sacola. Boa escolha." (§7.5)

| Estado | O que acontece |
| --- | --- |
| Inicial | Uma região `role="status"` (`aria-live="polite"`, `aria-atomic="true"`) já existe vazia no DOM desde a hidratação, montada pelo `SacolaProvider`. Assim o primeiro anúncio não se perde |
| Mostrando | `adicionar()` → o texto **Adicionado à sacola. Boa escolha.** aparece e fica visível por 4 s (P26). O foco **não** sai do botão |
| Nova adição durante a exibição | Reinicia o tempo; o texto é limpo e reinserido no quadro seguinte para o leitor de tela anunciar de novo |
| Limite atingido (10 unidades) | Texto de limite (P25) em vez do de sucesso; a quantidade não muda. Vale também quando o pedido é cortado pelo limite (linha em 3 + 10 → fica em 10) e quando a linha já está em 10 e só a marca de presente muda (linha em 10 + presente: marca o pedido e mostra o aviso do limite) |
| Saindo | Com movimento, opacidade vai a 0 em 150 ms e só então o texto é removido da região (que continua montada); com `prefers-reduced-motion`, sem animação (o texto some após os mesmos 150 ms) |
| Posição | Não cobre o FAB nem a barra fixa: no celular da página de produto, fica acima da barra (`body:has([data-barra-compra])`, como o FAB); nos demais casos, P26 |
| Mudança de rota | Continua até o tempo acabar (o provider fica no layout) |

O contador do cabeçalho muda junto, e o nome acessível do link "Sacola N itens" é a confirmação permanente. Por isso o aviso temporário atende à WCAG 2.2.1 e 4.1.3.

### Fronteiras Server/Client da etapa 4

| Página / componente | Tipo | Motivo |
| --- | --- | --- |
| `SacolaProvider`, `AvisoDaSacola` (em `components/SacolaProvider.tsx` e `components/AvisoDaSacola.tsx`; o contexto do aviso em `avisoDaSacola.contexto.ts`) | Client, no `app/layout.tsx` | Estado, `localStorage`, evento `storage`, aviso. Importa só `lib/sacola.ts` e `lib/formatosDaSacola.ts`, **nunca** `data/cheeses` |
| `Header` | Server (continua) | Só o link da sacola vira ilha |
| `LinkDaSacola` | Client | Lê `totalDeItens` |
| `ProductCard` | Server (continua) | Calcula `formatoDeVitrine` no servidor e renderiza a ilha `BotaoAdicionar` |
| `BotaoAdicionar` | Client | Chama `adicionar()` |
| `Quiz`, `PainelDeCompra` | Client (já eram) | Passam a usar `useSacola()` |
| `ShippingCalculator` | Client (era Server) | Máscara, envio do formulário, estados, chama `consultarFrete` |
| `app/_acoes/frete.ts`, `app/_acoes/pedido.ts` | Server Actions | Validação e recálculo no servidor (ADR-0008) |
| `app/sacola/page.tsx` | Server, **estática**, `noindex` | Metadados + `resumoParaSacola()` como *props* |
| `ConteudoDaSacola` (em `app/sacola/_sacola/`) | Client | Lê a sacola; quantidade, remover, subtotal, barra de frete grátis |
| `app/checkout/page.tsx` | Server, **estática**, `noindex` | Idem |
| `FluxoDoCheckout` + `EtapaDeEntrega`, `EtapaDePagamento`, `Confirmacao`, `ResumoDoPedido` (em `app/checkout/_checkout/`) | Client | Estado das etapas e dos dados pessoais (só em memória) |
| `QuantityStepper` | Movido de `app/queijos/[slug]/_produto/` para `components/` | Dois usos reais: produto e sacola. Ganha `maximo` (+ desabilitado em 10, opacidade 0,5 do P19) |

Metadados: `/sacola` → `title: 'Sacola'`; `/checkout` → `title: 'Finalizar compra'` (P25); ambos com `robots: { index: false, follow: false }`.

### Requisitos de segurança por tarefa

Resultado da auditoria do `auditor-de-seguranca` (2026-10-27) sobre este plano e os ADR-0007 e 0008. Cada item é critério de **Pronto quando** da tarefa indicada, além dos critérios próprios dela. O `auditor-de-seguranca` confere os itens na verificação de cada bloco.

**Tarefa 1 (Zod)**

- Versão exata no `package.json`, sem `^` nem `~`; `package-lock.json` com `integrity` `sha512-…` e `resolved` em `registry.npmjs.org`.
- Não instalar versão publicada há menos de 7 dias.
- Registrar no ADR-0007: data de publicação da versão, licença MIT, ausência de dependências, resultado de `npm audit signatures` e de `npm audit --omit=dev`.
- Importar sempre de `zod/mini`: nenhum `from 'zod'` no código (conferido por busca).

**Tarefa 2 (`lib/sacola.ts`, `lib/formatosDaSacola.ts`)**

- Busca no índice só com `Object.hasOwn`, `Map` ou objeto sem protótipo. Proibido `slug in OBJ` e `OBJ[slug]` com valor vindo de fora.
- Testes com `constructor`, `toString`, `hasOwnProperty` e `__proto__` como `slug` e como `formatoId`: o item é descartado, sem lançar.
- Limites: `slug` e `formatoId` com no máximo 64 caracteres; quantidade inteira.
- Limite de 8 KB conferido em `bruto.length` **antes** do `JSON.parse`.
- `serializarSacola` grava só `v`, `itens[{ slug, formatoId, quantidade }]` e `presente`.
- Links `/queijos/${slug}` montados só com `slug` já validado.

**Tarefa 3 (`lib/commerce.ts`, `lib/pedido.ts`)**

- Textos sem caracteres de controle (categoria Cc, exceto `\n` na mensagem) e sem bidirecionais nem invisíveis (ver a lista abaixo); normalização NFC e `\r\n`/`\r` → `\n` antes de contar os 200 pontos de código e as 6 linhas da mensagem.
- Limite de tamanho conferido antes de qualquer regex (teste: e-mail de 1 MB recusado em menos de 50 ms).
- `normalizarCep` recusa entrada com mais de 9 caracteres antes do `replace`.
- Gatilho `recusa@exemplo.com` só na implementação simulada, com o comentário `// SIMULAÇÃO: remover com o gateway`.
- Número do pedido com `crypto.getRandomValues` (Web Crypto) e amostragem por rejeição, sem viés de módulo, no servidor; **não** `crypto.randomInt`, porque o módulo `node:crypto` não pode ser importado por código que também roda no navegador (o `commerce.ts` e o `pedido.ts` são compartilhados). Documentado como rótulo de exibição e nunca como chave de acesso.
- **Unicidade do número `AQ-`:** 6 dígitos dão só 1 milhão de números (colisão provável por volta de mil pedidos, pelo paradoxo do aniversário). Quando houver persistência, a unicidade tem de ser garantida **no banco** (índice único e nova tentativa em caso de colisão) ou o número passa a ter 8 dígitos. Registrado no ADR-0008 §3.
- **Separação cliente/servidor (`lib/pedido.server.ts`):** `calcularFrete` e `criarPedido` (implementações simuladas) ficam em `lib/pedido.server.ts` com `import 'server-only'`. A documentação do Next 16 diz que o pacote npm `server-only` é opcional (o Next trata o import internamente e traz as próprias declarações de tipo), então **nenhuma dependência foi instalada**. No Vitest o import é um alias para `vitest.server-only.ts` (módulo vazio). As funções puras (`precoNoPix`, `mascararCep`, `faltaParaFreteGratis`, `valorDoFrete`, `calcularTotais`, `normalizarCep`) continuam em `commerce.ts`, importável no cliente.
- **Teto de R$ 1.000.000** (100.000.000 centavos) em `exigirCentavos` (`lib/dinheiro.ts`), `precoNoPix`, `calcularTotais` (inclusive o total) e `precificarSacola` (preço de cada formato e subtotal); a mensagem do `RangeError` nunca repete o valor recebido.
- **Texto (decisão de segurança da auditoria):** proibidos `\p{Cc}`, `\p{Cs}`, `\p{Co}`, `\p{Zl}`, `\p{Zp}`, U+200B–U+200F, U+061C, U+FEFF, U+2060–U+2064, U+00AD, U+E0000–U+E007F e os bidirecionais; `isWellFormed()`; ZWJ (U+200D) e VS16 (U+FE0F) liberados **só** na `mensagem`; nome, logradouro, bairro e cidade exigem ao menos uma letra ou número. Esses caracteres são sempre escritos em **escape** no código e nos testes, nunca literais invisíveis.
- **E-mail:** lista permitida só ASCII (local `[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}`, domínio em rótulos `[A-Za-z0-9-]{1,63}`; IDN só em punycode), minúsculas, regex linear. **Telefone:** DDD `[1-9][1-9]` (sem zero) + 8 ou 9 dígitos. **CEP:** `/^\d{5}-?\d{3}$/` após `trim`.
- **Mensagem do cartão (decisão do dono, 2026-10-27):** aceita quebra de linha, **até 6 linhas**; `\r\n` e `\r` viram `\n` antes de contar; `\n` é o único Cc permitido e só no campo `mensagem` (nos outros campos continua recusado); demais Cc e bidi seguem proibidos; mais de 6 linhas é recusado; a quebra conta nos 200 pontos de código. Texto de erro do campo (padrão do P17): **Escreva uma mensagem de até 200 caracteres e 6 linhas, por exemplo Feliz aniversário.** Na interface (tarefa 14), o `<textarea>` não deve usar `maxLength` que corte o `\n` de forma diferente do servidor, e o cartão impresso/exibição deve preservar as quebras como texto (`white-space: pre-line`), nunca como HTML.
- **Array `itens` do Zod:** `maxLength(30)` só é conferido **depois** de validar os elementos; a pré-checagem de `itens.length` da tarefa 13 é **obrigatória** (comentário em `lib/pedido.ts`).
- `MENSAGENS_DE_ERRO` fixas, sem interpolar o valor digitado.

**Tarefa 5 (`SacolaProvider`)**

- Evento `storage`: sanitiza e substitui só em memória, sem regravar (teste com espião em `setItem`).
- `getItem`, `setItem` e o tratamento do evento em `try/catch`, sem erro no console.

**Tarefa 8 (verificação do bloco B)**

- E2e com `localStorage` = `{"v":1,"itens":[{"slug":"constructor","formatoId":"x","quantidade":1}]}` e outro com `__proto__`: a página abre com contador 0 e console limpo.

**Tarefa 9 (`consultarFrete`, `ShippingCalculator`)**

- Assinatura `consultarFrete(entrada: unknown)`, com `typeof` e tamanho conferidos.
- `app/_acoes/frete.ts` (`'use server'`) exporta **só** `consultarFrete`.
- `<form action={…}>` ou `method="post"`, nunca o GET padrão (e2e: envio antes de hidratar não põe o CEP na URL).
- Retorno só `{ ok, resultado | erro }`, sem eco da entrada.
- Testes com `null`, `{}`, `123` e `['01310100']` → `cep-invalido`.

**Tarefa 13 (`confirmarPedido`)**

- `app/_acoes/pedido.ts` exporta **só** `confirmarPedido`.
- Pré-checagem: a entrada é objeto simples; `itens` é array com no máximo 30 linhas.
- Só `safeParse`, com `try/catch` geral e retorno genérico; nunca `throw` com dado da entrada.
- Nenhum `console.*` na ação nem em `criarPedido` (teste com espiões).
- Chaves de `erros` só da lista fixa de `CampoDoCheckout`, com valores de `MENSAGENS_DE_ERRO` (nada de mensagem ou `path` do Zod).
- O servidor recusa quantidade fora de 1–10 ou não inteira, soma linhas repetidas e recusa se a soma passar de 10, e confere esgotado em `data/cheeses`.
- Testes: `NaN`/`Infinity`, quantidade 11, duas linhas de 6, `itens` com 31 e com 10.000 linhas, entrada `Map` e `null`; `presente: false` com mensagem → a mensagem é descartada.
- `next.config.ts` com `serverActions.bodySizeLimit: '32kb'` (**antecipado para a tarefa 9**: chave `experimental.serverActions.bodySizeLimit`, conferida em `node_modules/next/dist/docs/.../serverActions.md`; e2e em `e2e/frete.spec.ts` recusa um corpo de ~40 KB).

**Tarefas 14 e 15 (checkout)**

- `<form action>` ou `method="post"`; e2e sem dado pessoal em `page.url()`.
- Depois de `ok: true`: zerar o estado do formulário (guardar só o e-mail exibido) e limpar a sacola.
- E2e ao fim do fluxo: `localStorage`, `sessionStorage` e cookies sem nenhum dos valores digitados.
- Zero `dangerouslySetInnerHTML` e `innerHTML`; nenhum campo de cartão, CVV ou CPF.
- A confirmação mostra os totais devolvidos pelo servidor.

**Tarefas 16 e 17**

- Tarefa 16 (`auditor-de-seguranca`): rever as tarefas 13 a 15 no diff e rodar de novo `npm audit --omit=dev`.
- Tarefa 17: o README rotula a loja como simulada e registra `recusa@exemplo.com` como gatilho de teste a remover com o gateway.

#### Fica para depois (segurança e LGPD)

Não entram na etapa 4. Ficam registrados aqui e devem ser copiados para o detalhamento das etapas 8 e 9 e para o futuro ADR do gateway.

| Item | Destino |
| --- | --- |
| ADR de CSP (nonce exige renderização dinâmica; avaliar o custo com o `performance-e-seo`) | Etapa 8 |
| Cabeçalhos estáticos em `next.config` `headers()`: HSTS sem `preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` com `camera`, `microphone`, `geolocation` e `payment` vazios, `frame-ancestors 'none'`, `poweredByHeader: false`; teste de cabeçalhos no e2e | Etapa 8 |
| `/sacola` e `/checkout` fora do sitemap e **sem** `Disallow` no `robots` (o `noindex` precisa ser lido) | Etapa 8 |
| Limite de taxa nas duas Server Actions (obrigatório antes de e-mail transacional ou de API paga) | Etapa 8, ou antes, se esses serviços chegarem primeiro |
| Dependabot ou Renovate; `npm ci`, `npm audit` e `npm audit signatures` no CI | Etapa 9 |
| Conferir `Host`/`X-Forwarded-Host` na hospedagem, `serverActions.allowedOrigins` exatos e `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` estável entre instâncias | Etapa 9 |
| Logs da hospedagem sem corpo de POST | Etapa 9 |
| LGPD: aviso de privacidade com link antes de **Confirmar pedido**; base legal (art. 7º, V, e obrigação fiscal); justificar o telefone ou torná-lo opcional; prazo de retenção; canal do titular; `localStorage` declarado como estritamente necessário; dados do presenteado quando existirem (depende da pendência do dono sobre o destinatário do presente) | Etapa 9 (antes da publicação), com o dono |
| ADR do gateway: tokenização (nenhum dado de cartão no nosso servidor); webhooks com assinatura, proteção contra *replay* e idempotência; segredos só em módulos `server-only`; identificador do pedido opaco de 128 bits com prova de posse; remover `recusa@exemplo.com`; recalcular e recusar total divergente; codificar a mensagem do presente conforme o contexto de saída | ADR do gateway |

### Tarefas

Cada tarefa termina com `lint`, `typecheck`, `format:check`, `test`, `build` e `test:e2e` passando. A estimativa de linhas está entre parênteses.

**Bloco A — Regras puras (commit 1)**

1. **[engenheiro-de-ecommerce] Zod** (~10 + ADR)
   - `npm view zod version` → `npm i zod@<versão exata>` (publicada há 7 dias ou mais). Conferir a API do `zod/mini` em zod.dev para essa versão. Registrar a versão no ADR-0007 (já Aceito pelo dono em 2026-10-27). Anotar o *First Load JS* compartilhado do `npm run build` **antes** de qualquer outra tarefa (linha de base do orçamento).
   - **Pronto quando:** `package.json` com a versão exata, `package-lock.json` atualizado, `npm audit --omit=dev` sem alerta alto ou crítico, e a linha de base anotada no ADR-0007.
   - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 1).

2. **[engenheiro-de-ecommerce] `lib/sacola.ts` e `lib/formatosDaSacola.ts`** (~350 com testes)
   - Contratos acima. Teste de paridade entre o índice e `QUEIJOS`.
   - Testes de `lerSacolaSalva`, um por linha da tabela de persistência: `null`, `'{'`, `'[]'`, `{"v":2,…}`, texto de 9 KB, slug inexistente, `formatoId` de outro queijo, quantidade `0`/`-1`/`1.5`/`"2"`/`99`, linha repetida, `__proto__` e `preco` no JSON, 31 linhas. `reduzirSacola`: somar, limitar a 10, remover, `definir-presente`, `limpar`. `precificarSacola`: Canastra "meia" × 2 = 15600; item ignorado sem quebrar.
   - **Pronto quando:** os testes passam e nenhum arquivo de `lib/sacola.ts` nem de `lib/formatosDaSacola.ts` importa valor de `data/` (só `import type`), o que pode ser conferido por busca.
   - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 2).

3. **[engenheiro-de-ecommerce] `lib/commerce.ts` (frete, totais), `lib/pedido.server.ts` (frete e pedido simulados, só servidor) e `lib/pedido.ts`** (~400 com testes)
   - Testes: `mascararCep('01310100') === '01310-100'`, `mascararCep('0131') === '0131'`, `mascararCep('01310-1009') === '01310-100'`; `normalizarCep('01310-100')` → `'01310100'`, e com 7 dígitos ou letras → `null`; `calcularFrete('00500000')` (em `lib/pedido.server.test.ts`) → fora de área; `faltaParaFreteGratis(17999) === 1`, `(18000) === 0`; `valorDoFrete` com subtotal 18000 → 0; `calcularTotais(13600, null, 'pix')` → `descontoPix 680`, `total null`; `calcularTotais(18000, 0, 'pix')` → `total 17100`; `criarPedido` com `recusa@exemplo.com` → `pagamento-recusado`; esquemas: mensagem de 201 caracteres é rejeitada, 200 com acentos e emoji é aceita, UF `'XX'` é rejeitada, data de hoje é rejeitada e amanhã é aceita (relógio falso em America/Sao_Paulo).
   - **Pronto quando:** os testes passam e `MENSAGENS_DE_ERRO` traz os textos aprovados em P25.
   - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 3).

4. **[revisor-de-codigo] Revisão do bloco A** → commit `feat(sacola): adiciona regras da sacola, do frete e do pedido simulados`.

**Bloco B — Sacola no navegador (commit 2)**

5. **[engenheiro-de-ecommerce] `SacolaProvider` e `useSacola`** (~250 com testes)
   - Montado no `app/layout.tsx`, por **fora** do `AtendimentoProvider`, porque o assistente (dentro do painel de atendimento) precisa do `useSacola()` para adicionar à sacola na etapa 6. Persistência conforme a tabela; `useState` + `useRef` com `reduzirSacola` em vez de `useReducer`, porque `adicionar` precisa ler a quantidade antes e depois, de forma síncrona, para escolher o texto do aviso; `pronta` só depois da leitura; gravação só com `pronta`; evento `storage`; `try/catch` em `getItem`/`setItem`.
   - Testes (jsdom): JSON corrompido não quebra e mostra 0; `setItem` que lança `QuotaExceededError` mantém a sacola em memória; evento `storage` atualiza; nada é gravado antes da leitura (espião em `setItem`); `adicionar` duas vezes soma.
   - **Pronto quando:** os testes passam e o `build` não acusa erro de hidratação em nenhuma rota (console do e2e limpo).
   - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 5).

6. **[frontend-nextjs] `LinkDaSacola` e `AvisoDaSacola`** (~200)
   - `LinkDaSacola` no lugar do link estático do `Header` (desktop e celular, medidas da §4.3 e §7.6 já existentes). Aviso conforme a tabela de estados e o visual do P26.
   - **Pronto quando:** teste: após `adicionar`, o nome acessível do link vira "Sacola 1 item" e depois "Sacola 3 itens"; a região `role="status"` existe antes da primeira adição e recebe o texto exato **Adicionado à sacola. Boa escolha.**; com timers falsos, some em 4 s; duas adições seguidas reiniciam o tempo.

7. **[frontend-nextjs] `BotaoAdicionar` nos quatro lugares + Embalar para presente** (~250)
   - `ProductCard` (formato do P24, quantidade 1), `Quiz` (mesma regra), `PainelDeCompra` e barra fixa (formato e quantidade escolhidos), **Embalar para presente** (P31: adiciona o formato e a quantidade escolhidos com `presente: true`). Esgotado continua com **Avise-me** sem ação. `QuantityStepper` vai para `components/` com `maximo={10}`. `formatoDeVitrine` (P24) fica em `lib/catalogo.ts` e alimenta `ProductCard` e `Quiz`. **Embalar para presente** não usa `aria-pressed` (adiciona a cada clique, não alterna): o contêiner ganha `data-presente` e aparece o texto visível **Pedido marcado como presente**. Apagar `BotaoDaSacola.tsx` e o aviso "Sacola disponível em breve".
   - **Pronto quando:** não sobra `aria-disabled` em nenhum Adicionar (busca no código); teste do `PainelDeCompra`: "Meia peça" × 2 → `adicionar({ slug: 'canastra-curado', formatoId: 'meia', quantidade: 2 })`; e2e (tarefa 8).

**Status do bloco B (tarefas 5 a 7), implementado em 2026-11-03:**

- **Feito:** `app/layout.tsx` resolve `numeroDoWhatsApp()` e passa ao `AtendimentoProvider`; `LinkDoWhatsApp` (nada com `null` ou número inválido; `target="_blank"`, `rel="noopener noreferrer"`); `LinkDoQueijista` vira link (a linha inteira some sem número); conversa no provider (memória, P51), motor por `carregarAssistente()` ao abrir, fila de entradas, ações de sacola, só o último grupo de respostas rápidas, foco no campo, rolagem a cada resposta, horário calculado ao abrir e ao trocar de aba. Saíram `ROTEIRO_DO_PROTOTIPO`, `SemAcao`, `lib/cartaoDoChat.ts` (+ teste) e os avisos "… disponível em breve" do painel.
- **Desvios técnicos (a registrar no fechamento):** (1) o contexto foi para `components/atendimento.contexto.ts` (evita ciclo `Atendimento` → `SupportPanel` → `LinkDoWhatsApp` → `Atendimento`); (2) a lacuna `avisoNovaAba` mora em `lib/whatsapp.ts` (`AVISO_DE_NOVA_ABA`), porque o link está no pacote global e `TEXTOS_DO_ROTEIRO` é do *chunk* tardio; `TEXTOS_DO_ROTEIRO.avisoNovaAba` aponta para ela; o aviso é a descrição acessível do link (`aria-describedby` para um `<span hidden>`), sem texto visível; (3) o gerador A.6 do cartão é `React.lazy` (fora do pacote global, para caber no orçamento), com reserva de tamanho; (4) `AtendimentoProvider` agora exige `SacolaProvider` acima (executa as ações da sacola), e os testes foram ajustados.
- **Testes:** novos `components/SupportPanel.test.tsx`, `components/LinkDoWhatsApp.test.tsx`, `data/numeroDoWhatsApp.cliente.test.ts` (barra `'use client'` importando `numeroDoWhatsApp`), `e2e/whatsapp.spec.ts` (`page.clock`, hrefs, chunk do motor, rede, 360 e 390 px); atualizados `Atendimento.test.tsx`, `PainelDeCompra.test.tsx`, `e2e/atendimento.spec.ts`, `e2e/produto-teclado.spec.ts`.
- **Orçamento (`npm run medir:pacote`, agora com a medição do motor):** compartilhado 184,11 kB (limite 184,19; +1,42 sobre 182,69); Home 188,50 (limite 188,53); `/queijos` 184,11; produto 193,99 (limite 195,27); motor 4,61 kB gzip (limite 12), ausente do HTML. Folga mínima: qualquer código novo no pacote global estoura.
- **Pendências para a tarefa 8 / decisão do dono:** (a) o aviso de nova aba é só lacuna para leitor de tela (não há como exibi-la visível sem quebrar o botão verde); (b) o aviso **Adicionado à sacola. Boa escolha.** (§7.5) é renderizado fora do diálogo modal, então a confirmação visível no chat é o texto `depoisDaAcao` (lacuna do P52); validar com o `especialista-em-acessibilidade` se o anúncio chega ao leitor de tela; (c) falha ao baixar o *chunk* do motor deixa a conversa como estava, sem mensagem (não há texto aprovado para erro); (d) o gerador A.6 baixa um *chunk* na primeira vez que um cartão que não é o do Canastra aparece.

8. **Verificação do bloco B, em paralelo:**
   - **[testes-e-qualidade]** e2e: Adicionar no catálogo → contador 1 e aviso visível; recarregar → contador 1; `localStorage` com lixo (via `page.addInitScript`) → página abre com 0 e sem erro no console; duas abas (dois `page` no mesmo `context`) → a segunda reflete a primeira; a 390 px na página de produto, o aviso não sobrepõe a barra fixa nem o FAB.
   - **[especialista-em-acessibilidade]** anúncio do aviso (NVDA/VoiceOver), foco que não se move, nome do link da sacola.
   - **[guardiao-do-design]** visual do aviso (P26) e contador.
   - **[auditor-de-seguranca]** sanitização da leitura do `localStorage` e ausência de dado pessoal salvo. **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 8: e2e com `constructor` e `__proto__`).
   - **[performance-e-seo]** *First Load JS* compartilhado contra a linha de base: no máximo +8 kB gzip (ADR-0007).
   - → `revisor-de-codigo` → commit `feat(sacola): liga os botões Adicionar e o contador do cabeçalho`.

**Bloco C — Frete no produto (commit 3)**

9. **[engenheiro-de-ecommerce] `consultarFrete` e `ShippingCalculator`** (~250 com testes)
   - O `ShippingCalculator` vira `<form>` (Enter envia; **Calcular** é `type="submit"`), máscara com `mascararCep` a cada digitação (com o cursor no lugar certo), `maxLength={9}`, `autoComplete="postal-code"`, `inputMode="numeric"`. Estados: ocioso → calculando (botão com `aria-disabled` e sem novo envio) → resultado **Chega refrigerado em até [N] dias úteis.** (ícone frio, `--mofo-texto`; `[N]` enquanto o prazo for `null`) **ou** fora de área **Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.** **ou** CEP inválido (texto do P25, `--casca-texto`, `aria-invalid` + `aria-describedby`, padrão do P17). Resultado numa região `aria-live="polite"`. Erro de rede ou de ação não encontrada → mensagem genérica (P25) e nova tentativa.
   - O "Deixe seu e-mail e avisamos" **não** abre campo de e-mail nesta etapa (P9/P15).
   - **Pronto quando:** teste de componente com `consultarFrete` simulado nos três resultados; teste do Server Action chamado direto com `'abc'`, `''`, `'0'.repeat(10_000)` → `cep-invalido`, sem lançar; e2e: digitar `01310100` mostra `01310-100` e, ao enviar, o texto de prazo; `00500-000` → fora de área.
   - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 9).

10. **Verificação do frete** (guardião: §7.2, item 10; acessibilidade: erro e resultado anunciados; `auditor-de-seguranca`: entrada do Server Action) → `revisor-de-codigo` → commit `feat(frete): adiciona a calculadora de frete simulada`.

**Bloco D — Página da sacola (commit 4)**

11. **[frontend-nextjs] `/sacola`** (~350)
   - Cria `resumoParaSacola()` em `lib/catalogo.ts` (ainda não existe) e tira `sacola` do filtro de 404 de prefetch em `e2e/_apoio/console.ts`.
    - Server: `metadata`, `resumoParaSacola()`, h1 (P25), contêiner `--largura-conteiner`. Client `ConteudoDaSacola`: com `pronta === false`, não mostra nada que dependa da sacola (nem "vazia"); lista com miniatura A.6 (`CheeseIllustration`), nome como link para `/queijos/[slug]`, "formato · peso", preço unitário, `QuantityStepper` (`aria-label` com o nome do item), **Remover** (P25) com `aria-label` completo e foco levado ao próximo item ou ao título depois de remover; subtotal; barra de frete grátis **Faltam R$ [valor] para o frete grátis.** (com o valor formatado) ou **Frete grátis garantido.** (P29, P38); se o pedido é presente, a linha "Embalagem para presente" com opção de tirar (P31); botão principal para `/checkout` (P25). Sacola vazia: **Sua tábua ainda está vazia.** + **Explorar a cave** (→ `/queijos`, §10.5).
    - **Pronto quando:** testes: subtotal 17999 → "Faltam R$ 0,01 para o frete grátis."; 18000 → "Frete grátis garantido."; vazia → texto e link; `pronta: false` não mostra "vazia". E2e: adicionar dois queijos → `/sacola` lista os dois, + e − mudam o subtotal, Remover tira; sem rolagem horizontal de 360 a 1920 px.

12. **Verificação da sacola** (guardião: tokens e padrões da Home, já que a página não foi prototipada, §12; acessibilidade: lista, stepper, remoção e foco) → `revisor-de-codigo` → commit `feat(sacola): adiciona a página da sacola`.

**Bloco E — Checkout (commit 5)**

13. **[engenheiro-de-ecommerce] `confirmarPedido`** (~200 com testes)
   - Ao criar `/checkout`, tira `checkout` do filtro de 404 de prefetch em `e2e/_apoio/console.ts`.
    - Contrato acima. Recalcula tudo no servidor. Itens: valida o esquema, confere o índice e o estoque, precifica com `data/cheeses`; um item inválido → `sacola-invalida` (não "conserta" em silêncio no servidor). Fora de área → `fora-de-area`. Sem `console.log` com a entrada.
    - **Pronto quando:** testes chamando a função direto: entrada com `preco: 1` no item → o preço é ignorado e o total vem do catálogo; `slug` inexistente → `sacola-invalida`; e-mail inválido → `dados-invalidos` com `erros.email`; `recusa@exemplo.com` → `pagamento-recusado`; caso feliz → `numero` no formato `AQ-\d{6}` e `totais` iguais a `calcularTotais`.
    - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 13).

14. **[frontend-nextjs] Checkout, etapa 1 (Entrega)** (~400; se passar, separar o bloco do presente em 14b)
    - `FluxoDoCheckout` com o indicador **1. Entrega · 2. Pagamento · 3. Confirmação** (`<ol>`, `aria-current="step"`); aviso **Enviamos de segunda a quarta, para que seu queijo nunca passe o fim de semana em trânsito.**; campos do P32 com `<label>` visível, `autoComplete` correto (`name`, `email`, `tel`, `postal-code`, `address-line1`, `address-level2`, `address-level1`…), erros por campo no padrão do P17 e um resumo de erros focado ao enviar com falha; CEP com máscara e frete (reusa `consultarFrete`); fora de área impede avançar. Presente (marcado se `sacola.presente`): cartão com mensagem (`<textarea maxLength={200}>` + contador "N de 200" em `aria-live="polite"` só perto do limite, P25) e data de entrega (`<input type="date">` com `min`/`max` do P34); nota **nota fiscal sem valor visível ao presenteado** como texto informativo (§10.2). Ao avançar, o foco vai para o título da etapa (mesmo padrão do quiz).
    - **Pronto quando:** testes de componente para campo obrigatório vazio, e-mail inválido e mensagem de 201 caracteres bloqueada; e2e só com teclado até a etapa 2.
    - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefas 14 e 15).

15. **[frontend-nextjs] Checkout, etapa 2 (Pagamento), erro e etapa 3 (Confirmação)** (~350)
    - `<fieldset>` com rádios **Pix (5% de desconto)** · **Cartão em até [n]x sem juros** (P33; nenhum campo de cartão). `ResumoDoPedido` com subtotal, frete (`formatarPrecoOuLacuna`), desconto do Pix e total (rótulos do P25). Botão de confirmar (P25) → `confirmarPedido` dentro de `startTransition`, botão sem novo envio enquanto pendente. Erro → **Não conseguimos confirmar o pagamento. Nada foi cobrado. Tente outra forma ou fale com a gente.** em `role="alert"`, com "fale com a gente" como `BotaoAbrirAtendimento` (P25). Sucesso → `limpar()` e etapa 3 com o título **Seu queijo já está sendo preparado.** e **Enviamos os detalhes para [e-mail]. Você vai receber o código de rastreio assim que a caixa sair da cave.**, onde `[e-mail]` é o e-mail digitado (P36). Voltar da etapa 2 para a 1 mantém os dados. Checkout com a sacola vazia mostra o mesmo estado vazio da `/sacola`.
    - **Pronto quando:** e2e: fluxo completo (adicionar → sacola → checkout → Pix → confirmação com o e-mail digitado → contador 0); `recusa@exemplo.com` → mensagem de erro, sacola intacta; troca Pix ↔ Cartão muda o total; sem rolagem horizontal de 360 a 1920 px.
    - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefas 14 e 15).

16. **Verificação do checkout, em paralelo:**
    - **[auditor-de-seguranca]** (obrigatório) Server Actions (validação, recálculo, retornos restritos, ausência de log), dados pessoais só em memória (nenhuma escrita em `localStorage`/`sessionStorage`/cookie com dado do cliente; conferir no e2e), mensagem do presente renderizada como texto (sem `dangerouslySetInnerHTML`), `npm audit`, e nenhum campo de cartão nem CPF. **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 16: rever 13 a 15 no diff e novo `npm audit --omit=dev`).
    - **[especialista-em-acessibilidade]** formulário (rótulos, erros, `autocomplete`, resumo de erros), indicador de etapas, foco entre etapas, alerta de erro, rádios.
    - **[guardiao-do-design]** textos literais da §10.2 e padrões visuais (inputs no padrão do CEP §7.2, opções no padrão dos formatos).
    - **[testes-e-qualidade]** e2e do fluxo completo e do erro; teste de documento sem `id` duplicado em `/sacola` e `/checkout`.
    - → `revisor-de-codigo` → commit `feat(checkout): adiciona o checkout simulado`.

17. **[documentador-tecnico] Fechamento da etapa 4**
    - README (rotas `/sacola` e `/checkout`, a simulação e o e-mail de recusa para testes), este plano (situação, pendências respondidas), nota no ADR-0007 com a medição final do pacote.
    - **Feito em 2026-10-29** (README, este plano, ADR-0007, ADR-0008 e CHANGELOG). **Pronto quando:** commit `docs: fecha a etapa 4` publicado (ou incluído no commit 5); o commit fica a cargo da sessão principal.
    - **Requisitos de segurança:** ver a [lista](#requisitos-de-segurança-por-tarefa) (tarefa 17: loja rotulada como simulada; `recusa@exemplo.com` registrado como gatilho de teste a remover com o gateway). Copiar a tabela [Fica para depois](#fica-para-depois-segurança-e-lgpd) para as etapas 8 e 9 quando forem detalhadas.

### Commits da etapa 4

| Bloco | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| A | Tarefas 1 a 4 | `feat(sacola): adiciona regras da sacola, do frete e do pedido simulados` | ✅ Publicado (`48e6ebe`) |
| B | Tarefas 5 a 8 | `feat(sacola): liga os botões Adicionar e o contador do cabeçalho` | ✅ Publicado (`b7f7e73`, mais o fechamento das pendências de acessibilidade e de contexto em `a358fce`) |
| C | Tarefas 9 e 10 | `feat(frete): adiciona a calculadora de frete simulada` | ✅ Publicado (`43e7d7d`) |
| D | Tarefas 11 e 12 | `feat(sacola): adiciona a página da sacola` | ✅ Publicado (`9d4e0b3`) |
| E | Tarefas 13 a 16 | `feat(checkout): adiciona o checkout simulado` | ✅ Publicado (`b06c604`) |
| Docs | Registro dos blocos C e D | `docs: registra os blocos C e D da etapa 4` | ✅ Publicado (`7df3d03`) |
| Docs | Tarefa 17: fechamento da etapa 4 | `docs: fecha a etapa 4` | Pendente de commit (feito pela sessão principal) |

Antes e entre os blocos, dois commits só de documentação: `85de43d` (detalhamento da etapa) e `07e4586` (ponto de retomada).

Ordem seguida: A → B → C → D → E. O E depende de C (reusa `consultarFrete`) e de D (estado vazio, `QuantityStepper` em `components/`).

### Controles ao fim da etapa 4

| Controle | Onde | Situação ao fim da etapa 4 |
| --- | --- | --- |
| Adicionar / Adicionar à sacola | Cartões (Home e catálogo), quiz, produto, barra fixa | **Com ação** (tarefa 7) |
| Contador da sacola | Cabeçalho (desktop e celular) | **Com ação** (tarefa 6) |
| Calcular (frete) | Produto e checkout | **Com ação** (tarefas 9 e 14) |
| Embalar para presente | Produto | **Com ação** (tarefa 7, P31) |
| Avise-me (esgotado) | Produto | Sem ação (P15) |
| "Deixe seu e-mail e avisamos" (frete fora de área) | Produto | Só texto, sem campo (P9/P15) |
| Girar, Aproximar (efeito visual), Tela cheia | Produto | Etapa 5 |
| Fale com um queijista, Falar com um queijista (verde) | Produto e painel | **Resolvido na etapa 6** (tarefas 5 e 7): `<a href="https://wa.me/…">` via `LinkDoWhatsApp`; somem sem número |
| Respostas rápidas, campo de mensagem, Enviar | Painel | **Resolvido na etapa 6** (tarefa 6): ligados ao motor `lib/roteiro.ts` |
| Buscar, Minha conta | Cabeçalho | Pendente (ver tabela geral) |

### Verificação (vale para cada bloco)

- **`guardiao-do-design`:** `/sacola` e `/checkout` não têm protótipo. A conferência é por **tokens e padrões** da spec (§3, §4.4, campos no padrão do CEP §7.2, opções no padrão dos formatos §7.2, item 6, contêiner e respiros da Home, §12). Os textos da §7.5, §10.1 e §10.2 são conferidos letra a letra.
- **`especialista-em-acessibilidade`:** WCAG 2.2 AA. Pontos de atenção: aviso `role="status"`, nome do link da sacola, formulários (rótulos, erros, `autocomplete`, 3.3.1/3.3.3/3.3.7), indicador de etapas, foco entre etapas e depois de remover, alvos de 44 px, `aria-disabled` no envio pendente.
- **`testes-e-qualidade`:** unidade em `lib/` (sacola, commerce, pedido) e nos componentes client; e2e do fluxo de compra, persistência, duas abas e lixo no `localStorage`; sem rolagem horizontal em `/sacola` e `/checkout` de 360 a 1920 px.
- **`auditor-de-seguranca`:** **obrigatório** nos blocos B (persistência), C (Server Action do frete) e E (dados do cliente e pedido). Lista mínima: validação na borda (cliente e servidor), recálculo de preço no servidor, sanitização do `localStorage`, nenhum dado pessoal persistido nem registrado em log, retornos dos Server Actions restritos, ausência de `dangerouslySetInnerHTML`, `npm audit` com o Zod, nenhum dado de cartão nem CPF coletado.
- **`performance-e-seo`:** orçamento do ADR-0007 no bloco B; `noindex` em `/sacola` e `/checkout`.
- **`revisor-de-codigo`:** antes de cada commit.

### Critérios de pronto da etapa 4

- Item "Sacola com contador, barra de frete grátis (R$ 180) e desconto de 5% no Pix" da §14 atendido.
- Item "Mobile: barra fixa com preço e Adicionar à sacola" continua atendido, agora com ação.
- Textos da §7.2 (frete), §7.5 (aviso), §10.1 e §10.2 idênticos à spec, com as lacunas `[N]`, `[PREÇO]`, `[n]`, `[valor]` e `[e-mail]` preenchidas só onde houver dado real (o `[valor]` da barra e o `[e-mail]` da confirmação são preenchidos; `[N]`, `[PREÇO]` e `[n]` continuam visíveis).
- Fluxo completo e erro de pagamento cobertos por e2e; persistência e tolerância a falhas cobertas por testes de unidade.
- Nenhuma escrita de dado pessoal no navegador; nenhum preço aceito do cliente.
- Sem rolagem horizontal de 360 a 1920 px em todas as rotas existentes.
- Única dependência nova: `zod` (ADR-0007), com o orçamento de pacote respeitado.

### Riscos da etapa 4

- **Sacola salva apagada na montagem** (gravar o estado vazio antes de ler) → `pronta` como trava; teste com espião em `setItem`.
- **Erro de hidratação no contador ou na `/sacola`** → servidor e 1ª renderização sempre vazios; nada dependente da sacola antes de `pronta`; console do e2e sem avisos.
- **Pacote global crescendo** (provider, aviso e `zod/mini` no layout) → linha de base na tarefa 1, medição na tarefa 8; plano B do ADR-0007 (*type guard* à mão para a sacola salva), **adotado no bloco B**.
- **Índice do catálogo desatualizado** → teste de paridade com `QUEIJOS`.
- **Adulteração de preço ou de quantidade** (pelo `localStorage` ou por POST direto) → preço nunca salvo nem aceito; servidor recalcula; quantidade limitada a 10.
- **Totais com lacuna** (frete `R$ [PREÇO]` abaixo de R$ 180 deixa o total em `R$ [PREÇO]`) → é a regra das lacunas da spec, confirmada pelo dono no P27 (2026-10-27); some quando houver tabela ou valor fixo. A interface não pode mostrar `R$ 0,00` nem `NaN`, o que um teste garante.
- **Arredondamento do Pix** (por item × sobre o subtotal) → uma regra só, `precoNoPix(subtotal)` (P30), com teste; o produto continua mostrando o Pix por unidade.
- **Fuso da data de entrega** (servidor em UTC × cliente) → `America/Sao_Paulo` nos dois lados, com relógio falso nos testes.
- **Server Action não encontrado depois de nova publicação** → mensagem genérica com nova tentativa (ADR-0008).
- **Tarefas 14 e 15 no limite de 400 linhas** → dividir o presente (14b) e o resumo (15b) se passarem.
- **Aviso cobrindo o FAB, a barra fixa ou o painel de atendimento** → e2e a 390 px; o aviso fica abaixo do `<dialog>` modal (que está na camada superior).
- **Expectativa de cobrança real** → tudo rotulado como simulado no README; nenhum campo de cartão; o e-mail de recusa fica documentado só para testes.

### Decisões do dono para a etapa 4

Todas as perguntas abaixo foram **decididas pelo dono em 2026-10-27**. P24 e P27 foram confirmadas individualmente; P25, P26 e P28 a P38 seguem o padrão recomendado, aprovado em bloco. Na mesma data, o dono aprovou o [ADR-0007](adr/0007-validacao-com-zod-mini.md) (Zod via `zod/mini`), que passou a Aceito.

| # | Pergunta | Decisão (decidido pelo dono em 2026-10-27) |
| --- | --- | --- |
| P24 | Qual formato o **Adicionar** do cartão (Home, catálogo) e do quiz põe na sacola? O cartão mostra "a partir de" + o menor preço, mas o formato padrão do produto é o primeiro (o mais caro). | **Confirmada pelo dono:** o formato **cujo preço o cartão mostra** (o menor; no Canastra, a Fração de R$ 49,00), quantidade 1. Quem quiser outro formato escolhe na página de produto. |
| P25 | Textos que a spec não define. | h1 da sacola **Sua sacola**; botão **Finalizar compra** (sacola → checkout) e título do checkout **Finalizar compra**; **Remover**; resumo **Subtotal**, **Frete**, **Desconto no Pix**, **Total**; frete grátis no resumo **Grátis**; botões **Continuar para o pagamento**, **Voltar para a entrega**, **Confirmar pedido**; título da opção **Embalar para presente**, rótulos **Mensagem do cartão** e **Data de entrega**; contador **N de 200 caracteres**; limite **Você já tem 10 unidades deste queijo na sacola.**; CEP inválido **Informe um CEP com 8 números, por exemplo 01310-100.**; falha genérica **Não conseguimos calcular agora. Tente de novo em instantes.**; erros de campo no padrão do P17 ("Informe seu nome.", "Informe um e-mail válido, por exemplo voce@email.com.", "Informe um telefone com DDD, por exemplo (11) 91234-5678." etc.); na mensagem de erro de pagamento, "fale com a gente" abre o painel de atendimento. |
| P26 | Visual e tempo do aviso **Adicionado à sacola. Boa escolha.** (a spec só dá o texto). | Fundo `--carvao`, borda `1px solid var(--pedra)`, raio 12 px, texto `--creme` 14 px 500, `padding: 12px 16px`, sem sombra e sem botão. Desktop: canto inferior **esquerdo** (`left: 28px; bottom: 28px`), longe do FAB. Celular: `left: 16px; right: 86px` (deixa livre a coluna do FAB), `bottom: 16px`; na página de produto, acima da barra fixa, `bottom: 100px`. Visível por 4 s. Sem link "Ver sacola". |
| P27 | Valor do frete abaixo de R$ 180 e o prazo `[N]` (a spec não tem tabela). | **Confirmada pelo dono:** lacunas visíveis: valor **R$ [PREÇO]** e prazo **[N]**. Com isso, o total de pedidos abaixo de R$ 180 aparece como **R$ [PREÇO]** até o dono fornecer a tabela ou um valor fixo. |
| P28 | Quais CEPs ficam "fora de área" na simulação? | Só a faixa **00000-000 a 00999-999**, que não existe nos Correios. Serve apenas para testar a mensagem, sem afetar nenhum cliente real. A regra real vem com a transportadora. |
| P29 | Frete grátis "acima de R$ 180" (§1, §4.2) ou "ao atingir R$ 180" (§10.1)? E o limite conta antes ou depois do desconto do Pix? | **A partir de R$ 180,00** (≥), sobre o subtotal dos produtos **antes** do desconto do Pix. |
| P30 | Sobre o que incide o desconto de 5% do Pix no pedido? | Só sobre o **subtotal dos produtos** (sem frete), com um único arredondamento: `precoNoPix(subtotal)`. |
| P31 | O que faz **Embalar para presente** na página de produto, e a embalagem tem custo? | Adiciona o formato e a quantidade escolhidos à sacola e marca o **pedido inteiro** como presente (um cartão e uma data por pedido, §10.2). Mesmo aviso de sucesso. **Sem custo** na simulação. A sacola mostra a linha "Embalagem para presente" com opção de tirar. |
| P32 | Quais dados o checkout pede? (a spec não lista campos) | Mínimo para entregar: nome completo, e-mail, telefone, CEP, endereço, número, complemento (opcional), bairro, cidade, UF. **Sem CPF** e sem preenchimento automático pelo CEP nesta etapa (LGPD: coletar só o necessário). O CPF entra com o gateway real, se ele exigir. |
| P33 | Pagamento simulado: o que aparece ao escolher Pix ou Cartão? | Só a escolha (rádios). **Nenhum campo de cartão** (nada de número, CVV ou validade) e nenhum QR code; **Confirmar pedido** confirma direto. `[n]` de "Cartão em até [n]x sem juros" continua lacuna (revogado por D28: 3x fictício). |
| P34 | Regras da data de entrega do presente. | De **amanhã até 60 dias** à frente (fuso de São Paulo), qualquer dia. O aviso de envio de segunda a quarta continua só informativo. A regra real (prazo pelo CEP, sem fim de semana) vem com a transportadora. |
| P35 | Quantidade máxima por item (a spec só define o mínimo 1). | **10 unidades** por linha (formato), no produto e na sacola. O **+** fica desabilitado em 10 (opacidade 0,5, P19). |
| P36 | A confirmação mostra o número do pedido? | **Não**, para seguir o texto literal da §10.2. O número (`AQ-123456`) é gerado e fica disponível para a etapa 6 (mensagem de pedido do WhatsApp). Se o dono quiser exibi-lo, sugestão: **Pedido nº AQ-123456** acima do título. |
| P37 | Os dados digitados no checkout devem sobreviver a um recarregamento da página? | **Não.** Ficam só em memória (ADR-0008); recarregar limpa o formulário. Nada de dado pessoal no navegador. |
| P38 | Visual da "barra de frete grátis" (§10.1). | Texto + barra de progresso decorativa (`aria-hidden`) de 6 px, raio 3, `--ouro` sobre `--pedra` (o mesmo desenho das barras do perfil sensorial), cheia ao atingir R$ 180. |

#### Situação das decisões P24 a P38 ao fim da etapa 4

Todas foram decididas em 2026-10-27 e **implementadas**. A tabela diz onde e o que ainda aguarda o dono.

| #       | Implementada em                                                                                              | Resta ao dono                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| P24     | Tarefa 7 (`formatoDeVitrine` em `lib/catalogo.ts`)                                                           | Nada                                                                                                                           |
| P25     | Tarefas 6, 9, 11, 14 e 15                                                                                    | Confirmar os textos novos que o P25 não cobria ([lista única](#decisões-e-textos-que-aguardam-o-dono-fim-da-etapa-4))         |
| P26     | Tarefa 6 (`AvisoDaSacola`)                                                                                   | Nada                                                                                                                           |
| P27     | Tarefas 3, 9 e 15 (lacunas `[N]` e `R$ [PREÇO]` visíveis; total em lacuna abaixo de R$ 180)                  | Fornecer a tabela de frete e o prazo                                                                                           |
| P28     | Tarefa 3 (`calcularFrete`, faixa 00000-000 a 00999-999)                                                      | Nada (a regra real vem com a transportadora)                                                                                   |
| P29, P30 | Tarefa 3 (`commerce.ts`: frete grátis em ≥ R$ 180 sobre o subtotal antes do Pix; Pix só sobre o subtotal) | Nada                                                                                                                           |
| P31     | Tarefas 7 e 11 (Embalar para presente; linha "Embalagem para presente" com **Tirar**)                       | Nada                                                                                                                           |
| P32     | Tarefa 14 (campos do checkout, sem CPF)                                                                      | Nada                                                                                                                           |
| P33     | Tarefa 15 (rádios Pix e Cartão, sem campo de cartão; `[n]` continua lacuna)                                  | Informar o `[n]` das parcelas (revogado por D28: 3x fictício)                                                                                                  |
| P34     | Tarefa 14 (data de amanhã até 60 dias, fuso de São Paulo)                                                    | Nada                                                                                                                           |
| P35     | Tarefas 2, 7 e 11 (máximo de 10 por linha)                                                                   | Nada                                                                                                                           |
| P36     | Tarefa 15 (a confirmação **não** mostra o número do pedido)                                                  | Decidir se mostra **Pedido nº AQ-…**                                                                                           |
| P37     | Tarefas 14 e 15 (dados só em memória)                                                                        | Nada                                                                                                                           |
| P38     | Tarefa 11 (barra de frete grátis de 6 px)                                                                    | Nada                                                                                                                           |

O [ADR-0007](adr/0007-validacao-com-zod-mini.md) (Zod via `zod/mini`) foi aceito em 2026-10-27 e o orçamento de pacote foi respeitado (medição final no próprio ADR).

---

## Etapa 5 — Visualizador 3D com fallback SVG

**Objetivo:** deixar o `CheeseViewer` completo (spec §7.2, §7.5, §7.6, §10.3 e §11): os controles passam a ter efeito, o 3D carrega tarde e sob demanda quando houver GLB, e o SVG do Apêndice A continua sendo o que o visitante vê primeiro e sempre que o 3D não puder ser exibido.

**Situação: Concluída em 2026-11-03.** Bloco A (`92fb989`) e bloco B (`a990e3a`) publicados; [ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md) **Aceito** (D22 = A). **Bloco C pendente, só com o primeiro GLB** (P40 = B): hero da Home e giro no cartão. Fechamento documental na tarefa 12.

**Pré-requisito:** etapa 4 concluída e o bloco de ajustes D3 a D19 aplicado (`65c6263`); `data/ficticio.ts` criado (`39fd9e0`).

**Decisões:** [ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md) (**Aceito** em 2026-11-03, aprovado pelo dono: `@google/model-viewer` 4.4.0 + `three` 0.183.2, carregamento tardio, decodificadores sem CDN, manifesto de modelos). D21 (etapa só com SVG, pronta para GLB futuros), D22 (ADR antes de instalar), D23 / P11 (**Ver na mesa** oculto até haver GLB real), P21 (rótulo fixo **Ver por dentro** com `aria-pressed`), P23 (ativo de Girar e Aproximar).

**Fato que molda a etapa (D21):** `public/models/` só tem `.gitkeep`. **Nenhum queijo tem GLB.** Com o manifesto vazio, o visitante recebe exatamente o que recebe hoje (SVG), mais os controles que passam a funcionar sobre o SVG; o `model-viewer` nunca é baixado. O caminho do GLB fica implementado, testado com *stub* e ativado sozinho quando o primeiro arquivo entrar no manifesto.

**Skills:** antes de cada tarefa, conferir o mapa em `SKILLS-ATELIE-DO-QUEIJO.md` (em especial `performance` para o carregamento tardio e as regras `bundle-*` e `rerender-*` da `vercel-react-best-practices`). A spec vence em caso de conflito.

### Escopo: o que entra e o que fica para depois

| Item da spec | Etapa 5 | Depois |
| --- | --- | --- |
| Palco, dica, indicador, miniaturas (§7.2) | Sem mudança visual | — |
| **Ver por dentro** (P21) | Com GLB: troca `<slug>-inteiro.glb` ↔ `<slug>-cortado.glb`. Sem GLB: troca A.5.1 ↔ A.5.2 (A.5.3 no celular), como hoje | Arte ou GLB cortado dos outros 9 queijos (P3) |
| **Girar** (§10.3) | Com GLB: `auto-rotate` a `36deg` por segundo; para no primeiro toque no modelo (giro livre depois); o botão liga e desliga. Sem GLB: conforme o **P39** | — |
| **Aproximar** e "toque duas vezes" (§7.2) | Com GLB: muda o raio da câmera (`camera-orbit` de 105% para 89%, o mesmo fator 1,18 do SVG). Sem GLB: o `scale(1.18)` que já existe. Duplo clique ou duplo toque no palco alterna o zoom nos dois modos | — |
| **Tela cheia** (§7.2) | Fullscreen API no palco, `aria-pressed` com rótulo fixo "Tela cheia" (padrão do P21), Esc sai, estado sincronizado por `fullscreenchange`. Só desktop, como hoje. Sem suporte à API: `aria-disabled` com a descrição atual | — |
| `prefers-reduced-motion` (§10.3) | Sem rotação automática; Girar começa com `aria-pressed="false"` e só gira se a pessoa ligar; sem transição de troca SVG → 3D | — |
| **Preparando a peça…** (§7.5) | SVG visível + legenda enquanto o GLB baixa (só quando há GLB) | — |
| **Seu navegador não exibe o 3D. Veja as fotos abaixo.** (§7.5) | SVG + mensagem, só quando o queijo **tem** GLB e o navegador não tem WebGL | Fotos reais nas miniaturas |
| Erro de carregamento ou contexto WebGL perdido | Volta ao SVG, sem mensagem nova; tempo-limite de 20 s conta como erro | — |
| **Ver na mesa** (AR, §7.6) | **Oculto** (D23/P11): o atributo `ar` não é usado, então o `model-viewer` também não mostra o botão dele | Com o primeiro GLB real: `ar` só no celular, `ar-modes`, USDZ para o iOS, aviso de privacidade do Scene Viewer |
| Hero da Home (§5.2, §11) | Conforme o **P40** (recomendação: nada muda sem GLB) | Com GLB: `model-viewer` com giro lento, mantendo halo, ardósia e sombra |
| Giro no hover do `ProductCard` (§4.6) | Conforme o **P40** (recomendação: nada muda sem GLB) | Com GLB: giro do modelo ao passar o mouse, só desktop |
| Modelos GLB (§11) | Convenção de nomes, manifesto `data/modelos3d.ts` (vazio) e validador `npm run modelos:validar` no CI | Arquivos fornecidos pelo dono; decodificadores Draco/KTX2 em `public/decodificadores/` com o primeiro GLB comprimido |

**Fora, por regra do projeto:** nenhuma variável de ambiente nova, nenhum serviço externo, nenhum arquivo carregado de CDN. Dependências novas só as do ADR-0009, e só depois da aprovação.

### Contratos

A interface pública **não muda:** `<CheeseViewer queijo={q} />` continua sendo a única forma de uso, em `app/queijos/[slug]/page.tsx`. O estado da §10.3 (`{ cortado, girando, zoom }`) continua dentro dele.

#### `data/modelos3d.ts` (manifesto; sem dependências além de `import type`)

```ts
import type { SlugDoQueijo } from './cheeses';   // só tipo

export type VarianteDoModelo = 'inteiro' | 'cortado';

/** Presença confirmada pelo validador. `inteiro` é obrigatório; `cortado` é opcional. */
export interface ModelosDoQueijo {
  inteiro: true;
  cortado: boolean;
}

/** Vazio até o dono fornecer os GLB (D21). Uma entrada só é aceita se os arquivos existirem. */
export const MODELOS_3D: Partial<Record<SlugDoQueijo, ModelosDoQueijo>> = {};

/** Convenção da §11: `/models/<slug>-<variante>.glb`. Único lugar que monta o caminho. */
export function caminhoDoModelo(slug: SlugDoQueijo, variante: VarianteDoModelo): string;

/** Tem GLB para esta variante? (`cortado` cai para false quando não houver o arquivo cortado.) */
export function temModelo(slug: SlugDoQueijo, variante: VarianteDoModelo): boolean;

/** §11: "até ~3 MB". Valor final conforme o P43. */
export const LIMITE_DE_BYTES_DO_GLB: number;
```

- **Por que um manifesto e não `fs.existsSync`:** a página de produto é estática, mas `/queijos` é dinâmica e, na hospedagem, a função do servidor pode não enxergar `public/`. O manifesto é explícito, entra no código e é conferido pelo validador (tarefa 4).
- **Por que fora de `data/cheeses.ts`:** o validador (script Node) lê o manifesto sem passar pelo alias `@/` nem pelas importações de valor de `cheeses.ts`. O padrão é o mesmo do mapa `ILUSTRACOES_DE_PRODUTO` (`Partial<Record<SlugDoQueijo, …>>`).
- **Nunca** montar o caminho do GLB a partir de URL, busca ou entrada do usuário: o `src` do `model-viewer` sai só de `caminhoDoModelo`.

#### `lib/suporte3d.ts` (só navegador; puro e testável com *mocks*)

```ts
/** Cria um canvas, tenta 'webgl2' e depois 'webgl', libera o contexto (WEBGL_lose_context). Resultado em cache. */
export function temWebGL(): boolean;
/** matchMedia('(prefers-reduced-motion: reduce)'). */
export function prefereMovimentoReduzido(): boolean;
/** navigator.connection?.saveData === true. Com economia de dados, o GLB não baixa sozinho. */
export function querEconomizarDados(): boolean;
```

#### `lib/estadoDo3d.ts` (puro, sem React)

```ts
export type Situacao3d =
  | 'so-svg'        // sem GLB para a variante atual (hoje: todos os queijos)
  | 'aguardando'    // tem GLB; espera o palco ficar visível e o navegador ficar ocioso
  | 'preparando'    // importando a biblioteca e baixando o GLB: SVG + "Preparando a peça…"
  | 'pronto'        // evento `load`: o modelo substitui o SVG
  | 'sem-webgl'     // tem GLB, mas sem WebGL: SVG + mensagem da §7.5
  | 'erro';         // falha de carga, contexto perdido ou 20 s sem `load`: SVG, sem mensagem

export type EventoDo3d =
  | { tipo: 'iniciar'; temGlb: boolean; temWebGL: boolean; economizarDados: boolean }
  | { tipo: 'visivel' } | { tipo: 'carregou' } | { tipo: 'falhou' } | { tipo: 'trocou-variante'; temGlb: boolean };

export function proximaSituacao(atual: Situacao3d, evento: EventoDo3d): Situacao3d;
export const TEMPO_LIMITE_DO_GLB_MS = 20_000;
```

#### `components/ModeloDoQueijo.tsx` (Client; carregado só por `next/dynamic(…, { ssr: false })` de dentro do `CheeseViewer`)

```ts
type PropsDoModeloDoQueijo = {
  src: string;            // caminhoDoModelo(slug, variante)
  alt: string;            // o mesmo aria-label do SVG da variante (§13)
  girando: boolean;       // auto-rotate
  zoom: boolean;          // camera-orbit 105% ↔ 89%
  aoCarregar: () => void;
  aoFalhar: () => void;   // `error` (carga ou contexto perdido) ou tempo-limite
  aoInteragir: () => void; // `camera-change` com detail.source === 'user-interaction'
};
```

- Faz `await import('@google/model-viewer')` dentro de um efeito, define `dracoDecoderLocation` e `ktx2TranscoderLocation` para `/decodificadores/draco/` e `/decodificadores/basis/` **antes** de qualquer `src` (ADR-0009; nada de CDN) e só então renderiza o `<model-viewer>`.
- Atributos da §11: `camera-controls`, `auto-rotate` (quando `girando`), `auto-rotate-delay="0"`, `rotation-per-second="36deg"`, `shadow-intensity="1"`, `exposure="0.9"`, `interaction-prompt="none"`, `touch-action="pan-y"` (rolagem vertical da página continua funcionando no celular), `loading="eager"` (o atraso já é nosso), fundo transparente sobre `--cave-funda`. **Sem** `ar` (D23) e **sem** `poster` (o SVG faz esse papel).
- Eventos por `ref` + `addEventListener` (`load`, `error`, `camera-change`), não por props `on…`: o comportamento de eventos de elementos customizados no React 19 deve ser conferido em react.dev antes de qualquer outra escolha.
- Tipos do JSX: usar os que o pacote declarar (`lib/model-viewer.d.ts`); se não cobrirem `React.JSX.IntrinsicElements`, declarar só os atributos usados num `components/model-viewer.d.ts`, sem `any`.

### Fronteiras Server/Client e carregamento tardio

| Peça | Tipo | Motivo |
| --- | --- | --- |
| `app/queijos/[slug]/page.tsx` | Server, estática (continua) | Só passa `queijo` |
| `CheeseViewer` | Client (continua) | Estado, toolbar, tela cheia, duplo toque, máquina de `Situacao3d`. O SVG continua sendo renderizado no servidor dentro dele (é o candidato a LCP) |
| `ModeloDoQueijo` | Client, **chunk separado** via `next/dynamic(() => import('./ModeloDoQueijo'), { ssr: false })` | O `ssr: false` só é aceito em Client Component (documentação do Next 16, *Lazy Loading*); o `CheeseViewer` já é client |
| `@google/model-viewer` + `three` | `import()` dentro do efeito do `ModeloDoQueijo` | Não entra no pacote compartilhado nem no JavaScript inicial de nenhuma rota |
| `data/modelos3d.ts`, `lib/suporte3d.ts`, `lib/estadoDo3d.ts` | Módulos pequenos importados pelo `CheeseViewer` | Alguns centésimos de kB na rota de produto |
| `Hero` (`app/_home/Hero.tsx`), `ProductCard` | Server (continuam) | Se o P40 mandar implementar agora, ganham uma ilha client pequena **renderizada só quando o manifesto tiver o queijo**. Server Component não usa `next/dynamic` para isso: a documentação do Next 16 avisa que, nesse caso, não há divisão automática de código |

**Ordem de carregamento na página de produto (com GLB):**

1. O HTML chega com o SVG (A.5 ou A.6) e os controles. Nada de 3D no HTML.
2. Depois da hidratação, `iniciar`: sem GLB → `so-svg` (fim; zero custo). Sem WebGL → `sem-webgl`. Com economia de dados → fica em `so-svg`.
3. `aguardando` até o palco cruzar a janela (`IntersectionObserver`, `rootMargin: '200px'`) **e** o navegador ficar ocioso (`requestIdleCallback`, com `setTimeout` de reserva no Safari). Assim o SVG já foi pintado e o LCP não espera o 3D (§11: "depois que a ilustração SVG já estiver visível").
4. `preparando`: o *chunk* do `ModeloDoQueijo` e a biblioteca são importados; o `<model-viewer>` fica por cima do SVG, invisível, na **mesma proporção** do SVG (`aspect-ratio: 460 / 340` para o A.5, `300 / 190` para o A.6), para não haver CLS.
5. `load` → `pronto`: o SVG sai da árvore de acessibilidade e some; o modelo aparece (troca sem transição com movimento reduzido).

### Estados e textos

| Situação | O que aparece | Texto (literal da §7.5) | Região |
| --- | --- | --- | --- |
| `so-svg` | SVG | — | — |
| `preparando` | SVG + legenda | **Preparando a peça…** | `role="status"` (educada) |
| `sem-webgl` | SVG + mensagem | **Seu navegador não exibe o 3D. Veja as fotos abaixo.** | `role="status"` |
| `erro` | SVG | — (nenhum texto novo) | — |
| `pronto` | Modelo | — | `alt` do `model-viewer` = `aria-label` do SVG da variante |

Posição e estilo da legenda e da mensagem: a spec dá só o texto (**P41**).

### Acessibilidade

- A `role="toolbar"` com setas, Home, End e `tabIndex` móvel continua como está (P21). **Tela cheia** e **Girar** seguem o padrão `aria-pressed` + rótulo fixo.
- Com o modelo pronto, o `model-viewer` entra na ordem de Tab (setas giram a peça); o `alt` dá o nome. Os textos internos dele para leitor de tela vêm em inglês: traduzir pelo atributo `a11y` (**P42**).
- Em tela cheia o foco fica na barra; Esc sai e o `aria-pressed` volta a `false`.
- `prefers-reduced-motion`: ver o escopo. Ligar o giro manualmente é permitido (movimento iniciado pela pessoa).
- Alvos de 44 px (já atendidos) e foco dourado (já global).
- Alternativa textual: o SVG com `role="img"` + `aria-label` é a alternativa do 3D em todos os estados.

### Desempenho (orçamento)

Mesmo método de medição do [ADR-0007](adr/0007-validacao-com-zod-mini.md#registro-da-instalação-tarefa-1-da-etapa-4), agora versionado em `scripts/medir-pacote.mjs` (tarefa 1).

| Medida | Linha de base | Limite |
| --- | --- | --- |
| *First Load JS* compartilhado | 182,74 kB gzip (fim da etapa 4) | **+0,5 kB** (nada de 3D no layout) |
| JavaScript inicial de `/queijos/[slug]` | Medido na tarefa 1 | **+4 kB gzip** (manifesto, `suporte3d`, `estadoDo3d`, tela cheia, duplo toque) |
| JavaScript inicial da Home e de `/queijos` | Medido na tarefa 1 | **+0 kB** sem GLB |
| *Chunk* tardio (`ModeloDoQueijo` + `model-viewer` + `three`) | Medido na tarefa 6 | **350 kB gzip**. Nunca aparece nos `<script>` do HTML de nenhuma página |
| GLB | — | `LIMITE_DE_BYTES_DO_GLB` (P43), texturas até 2048 px |
| LCP e CLS da página de produto | Medidos na tarefa 1 (Lighthouse local, celular) | LCP não piora; CLS 0 na troca SVG → 3D |

### Testes: como testar sem WebGL no jsdom

- **Unidade (Vitest + jsdom):** o jsdom não tem WebGL, `IntersectionObserver`, `matchMedia`, Fullscreen API nem `requestIdleCallback`. Por isso:
  - `lib/estadoDo3d.ts` é puro: todas as transições da tabela de estados testadas sem DOM.
  - `lib/suporte3d.ts`: `HTMLCanvasElement.prototype.getContext` simulado devolvendo `null` e um objeto falso.
  - `CheeseViewer`: `vi.mock('@/data/modelos3d')` com um manifesto falso, `vi.mock('@google/model-viewer', () => ({}))` e um elemento falso registrado com `customElements.define('model-viewer', class extends HTMLElement {})`, que o teste faz disparar `load`, `error` e `camera-change`. Assim se verificam a legenda, a mensagem sem WebGL, a volta ao SVG, os atributos da §11 (e a ausência de `ar`), a troca de `src` no corte, a parada do giro no primeiro toque e o tempo-limite (relógio falso).
  - *Stubs* de `IntersectionObserver`, `matchMedia`, `requestFullscreen`/`exitFullscreen` e `requestIdleCallback` entram no `vitest.setup.ts`, no mesmo estilo do `<dialog>` já simulado.
- **E2E (Playwright, Chromium):**
  - Sem GLB (o caso real de hoje): na página do Canastra, depois de ociosa, `customElements.get('model-viewer')` é `undefined` e não há requisição para `/models/` nem para outro domínio.
  - Tela cheia: clicar → `document.fullscreenElement` é o palco; Esc → sai e `aria-pressed="false"`.
  - Duplo clique no palco → **Aproximar** com `aria-pressed="true"`.
  - `page.emulateMedia({ reducedMotion: 'reduce' })` → **Girar** começa com `aria-pressed="false"`.
  - Sem rolagem horizontal de 360 a 1920 px (continua).
  - Caminho com GLB: teste escrito agora e **pulado** enquanto `MODELOS_3D` estiver vazio (`test.skip`); ele passa a rodar sozinho com o primeiro GLB. Sem WebGL é simulado com `page.addInitScript` que faz `getContext('webgl'|'webgl2')` devolver `null`.
- **Verificação manual com GLB de teste:** o `especialista-3d-webgl` testa localmente com um GLB genérico (CC0, fora do repositório) antes de cada commit do bloco B e descreve o resultado no PR. Nenhum GLB de teste vai para `public/`.
- **Validador:** testes com GLB sintéticos montados em memória no próprio teste (cabeçalho, pedaço JSON e binário), sem arquivo binário no repositório.
- **Regressão visual:** só o modo SVG é comparável pixel a pixel; o canvas 3D não é determinístico e fica fora da comparação.

### Tarefas

Cada tarefa termina com `lint`, `typecheck`, `format:check`, `test`, `build` e `test:e2e` passando. Estimativa de linhas entre parênteses.

**Bloco A — Fundação e controles sobre o SVG (commit 1; não depende do ADR-0009)**

1. **[performance-e-seo] Linha de base e script de medição** (~120)
   - Versionar o método do ADR-0007 em `scripts/medir-pacote.mjs` (pasta nova `scripts/`, sugerida pelo próprio ADR-0007) e o script `npm run medir:pacote`. Medir o compartilhado, o JavaScript inicial de `/`, `/queijos` e `/queijos/canastra-curado`, e o LCP/CLS do produto (Lighthouse local, perfil celular).
   - **Pronto quando:** o script reproduz os 182,74 kB do fim da etapa 4 (±0,1 kB) e as medidas estão anotadas no ADR-0009.

2. **[especialista-3d-webgl] Manifesto, suporte e estados** (~300 com testes)
   - `data/modelos3d.ts`, `lib/suporte3d.ts` e `lib/estadoDo3d.ts` conforme os contratos; *stubs* novos no `vitest.setup.ts`.
   - **Pronto quando:** testes de `proximaSituacao` cobrem as 6 situações e todos os eventos; `caminhoDoModelo('canastra-curado', 'cortado') === '/models/canastra-curado-cortado.glb'`; `temModelo` devolve `false` para todos os 10 slugs com o manifesto vazio; `temWebGL` devolve `false` com `getContext` nulo.

3. **[especialista-3d-webgl] Controles com efeito sobre o SVG** (~250 com testes)
   - **Tela cheia** (Fullscreen API no palco, `aria-pressed`, `fullscreenchange`; `aria-disabled` só sem suporte), duplo clique ou duplo toque no palco alterna o zoom, **Girar** conforme o P39 (sem resposta do dono, o Girar fica como está hoje e o resto da tarefa segue), `prefers-reduced-motion` no estado inicial do Girar. Estilo do palco em tela cheia: fundo `--cave-funda`, ilustração centralizada, barra visível (sem valores novos de cor).
   - **Pronto quando:** testes de componente: Tela cheia chama `requestFullscreen` no palco e o `aria-pressed` acompanha o `fullscreenchange`; `dblclick` no palco liga o **Aproximar**; com `matchMedia` de movimento reduzido, **Girar** começa em `false`. O teste atual de "Tela cheia disponível em breve" é atualizado. E2e da seção de testes (tela cheia, duplo clique, movimento reduzido) passando.

4. **[especialista-3d-webgl + devops-e-deploy] Validador de GLB** (~300 com testes)
   - `scripts/validar-modelos.mjs`, sem dependência nova (Node 24 lê o manifesto `.ts` com remoção de tipos; conferir na documentação do Node 24). Regras:
     - nome `^<slug>-(inteiro|cortado)\.glb$` em `public/models/`, com `<slug>` presente no manifesto (as chaves do manifesto já são conferidas pelo `tsc` contra `SlugDoQueijo`, então o script não precisa importar `data/cheeses.ts`); todo arquivo listado no manifesto e toda entrada do manifesto com arquivo;
     - cabeçalho GLB válido (`glTF`, versão 2, comprimento igual ao do arquivo);
     - tamanho até `LIMITE_DE_BYTES_DO_GLB` (P43);
     - `extensionsRequired` só dentro de uma lista permitida; se exigir `KHR_draco_mesh_compression` ou `KHR_texture_basisu`, os decodificadores precisam existir em `public/decodificadores/` (senão, erro: o `model-viewer` buscaria no CDN do Google);
     - texturas: dimensões lidas do cabeçalho (KTX2, PNG ou JPEG) até 2048 px; textura sem compressão KTX2 gera **aviso**, não erro.
   - Script `npm run modelos:validar`; passo novo no CI, antes do `build` (`devops-e-deploy`).
   - **Pronto quando:** com `public/models/` vazio o script passa; testes com GLB sintéticos em memória cobrem: nome fora da convenção, arquivo sem entrada no manifesto, entrada sem arquivo, cabeçalho inválido, arquivo acima do limite, Draco sem decodificador local e textura de 4096 px.

5. **Verificação do bloco A, em paralelo:** `especialista-em-acessibilidade` (tela cheia, duplo toque, `aria-pressed`), `guardiao-do-design` (palco a 1440 e 390 px sem mudança visual; palco em tela cheia), `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(3d): liga tela cheia, zoom e validador de modelos sobre o SVG`.

**Bloco B — `model-viewer` atrás do carregamento tardio (commit 2; exige o ADR-0009 Aceito)**

6. **[especialista-3d-webgl] Instalação** (~10 + registro no ADR)
   - `npm i @google/model-viewer@4.4.0 three@0.183.2 --save-exact` (ou as versões que o dono aprovar no ADR, respeitando os 14 dias). Registrar no ADR-0009: data de publicação, licenças (inclusive `lit` e `@monogrid/gainmap-js`), `resolved`/`integrity` do `package-lock.json`, `npm audit signatures`, `npm audit --omit=dev`.
   - **Pronto quando:** versões exatas sem `^`/`~`; `npm audit --omit=dev` sem alerta alto ou crítico; `npm run medir:pacote` mostra o compartilhado e o JavaScript inicial do produto **sem mudança** (a biblioteca ainda não é importada).

7. **[especialista-3d-webgl] `ModeloDoQueijo` e a máquina de estados no `CheeseViewer`** (~400 com testes; se passar, dividir em 7a carregamento/estados e 7b controles ligados ao modelo)
   - Contrato acima; ordem de carregamento; legenda e mensagem da §7.5 (estilo do P41); `alt`; tradução do `a11y` (P42, se aprovado); corte troca o `src`; zoom muda o `camera-orbit`; primeiro toque no modelo desliga o giro e esconde a dica; tempo-limite de 20 s; mesma proporção do SVG (CLS 0).
   - **Pronto quando:** os [requisitos obrigatórios do bloco B](#requisitos-obrigatórios-do-bloco-b-critérios-de-pronto-das-tarefas-6-a-8) (WCAG 2.2.2 e 2.5.7, testes de ciclo de vida, e2e com GLB mockado) estão atendidos; os testes de unidade da seção de testes passam; `npm run medir:pacote` confirma o orçamento (o *chunk* tardio não aparece em nenhum HTML); verificação manual com GLB de teste descrita no PR; e2e "sem GLB, zero custo" passando; e2e do caminho com GLB escrito e pulado.

8. **Verificação do bloco B, em paralelo:** `auditor-de-seguranca` (**obrigatório**: dependência nova, procedência, nenhuma requisição a CDN, `src` só do manifesto, requisitos de CSP anotados para a etapa 8), `performance-e-seo` (orçamento, LCP/CLS), `especialista-em-acessibilidade`, `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(3d): adiciona o model-viewer com carregamento tardio e fallback em SVG`.

**Bloco C — Hero e giro do cartão (commit 3; só se o P40 for "agora")**

9. **[especialista-3d-webgl] Ilha `GiroDoCartao` no `ProductCard`** (~200 com testes)
   - Renderizada só quando `temModelo(slug, 'inteiro')`. Desktop com `(hover: hover) and (pointer: fine)`; intenção de 250 ms antes de importar; `auto-rotate` sem controles; o SVG do cartão continua no HTML; sem efeito com movimento reduzido.
   - **Pronto quando:** teste: sem entrada no manifesto, o cartão não renderiza a ilha (mesmo HTML de hoje); com manifesto falso, o *hover* importa o modelo e o `mouseleave` volta ao SVG.

10. **[especialista-3d-webgl + guardiao-do-design] 3D no hero** (~250)
    - Ilha no palco do hero, mesma ordem de carregamento, giro lento, sem controles além do arraste (a pílula "Arraste para girar" já existe). Halo, ardósia e sombra continuam do A.3; para isso é preciso uma variante do A.3 **sem o queijo**, que é um ativo novo e exige aprovação do dono e do guardião.
    - **Pronto quando:** a variante do A.3 está aprovada; JavaScript inicial da Home sem mudança sem GLB; LCP da Home não piora com GLB.

11. **Verificação do bloco C** (guardião, acessibilidade, desempenho) → `revisor-de-codigo` → commit `feat(3d): adiciona o 3D no hero e o giro no cartão`.

**Fechamento**

12. **[documentador-tecnico] Fechamento da etapa 5** — **Concluída (arquivos prontos; commit `docs: fecha a etapa 5` a cargo da sessão principal).**
    - Criados `docs/conteudo.md` (com "Como entregar um modelo 3D") e `docs/ambiente.md` (cabiam hoje: duas variáveis públicas e a trava `VERCEL_ENV`); README e CHANGELOG atualizados; situação da etapa e do ADR-0009 registrada aqui.
    - **Pronto quando:** commit `docs: fecha a etapa 5` publicado.

### O que a etapa 5 deixou para a frente

Lista curta, só com ponteiros. O detalhe de cada item está na seção indicada.

**Bloco C, pendente só com o 1º GLB (P40 = B):** tarefas 9 a 11 (giro no cartão, 3D no hero, verificação). O hero exige uma variante do A.3 sem o queijo, ativo novo a aprovar pelo dono e pelo `guardiao-do-design`. Junto com o 1º GLB entram: luz de ~3200 K e ambiente HDR próprio (§11), `ar`/**Ver na mesa** (D23), rodar o e2e com GLB (hoje pulado) e, se o GLB for comprimido, os decodificadores em `public/decodificadores/`.

**Para o checklist da §14 (desvios e textos novos):** os desvios e textos dos blocos A e B estão em [Textos decididos e desvios da spec](#textos-decididos-e-desvios-da-spec-checklist-da-14), incluindo a lista de [verificação do bloco B](#textos-decididos-e-desvios-da-spec-checklist-da-14). Somam-se os desvios D2, D4, D5 e D6 e o item "trocar dados fictícios" já em [Tarefas geradas por estas decisões](#tarefas-geradas-por-estas-decisões). Pontos que dependem do dono: "Veja as fotos abaixo" não aponta para fotos no celular; economia de dados sem opção manual de pedir o 3D; +4 px de respiro com GLB.

**Etapa 8:** CSP com `connect-src 'self'` e, com Draco/KTX2, `worker-src blob:`, `'wasm-unsafe-eval'` e `blob:` em `img-src` ([Riscos da etapa 5](#riscos-da-etapa-5)); medir LCP e CLS do produto com GLB real; folga do JavaScript inicial do produto (+3,89 kB de +4 kB, [resultado do bloco B](#textos-decididos-e-desvios-da-spec-checklist-da-14)); o e2e com GLB só roda no CI com GLB real e pode exigir `--enable-unsafe-swiftshader`.

**Etapa 9:** `public/licencas-de-terceiros.txt` (já em [Etapa 9](#etapa-9--ci-completo-ambientes-e-aceite-herança-da-etapa-4)); Dependabot ou Renovate agrupando `@google/model-viewer` e `three`; `docs/conteudo.md` e `docs/ambiente.md` ampliados com gateway e hospedagem; remover `DADOS_FICTICIOS_ATIVOS` e a trava ao trocar os dados.

### Textos decididos e desvios da spec (checklist da §14)

Decididos pelo dono em 2026-11-03 e aplicados no bloco A:

| Onde | Texto | Observação |
| --- | --- | --- |
| Girar sem GLB (P39 = C) | **Giro disponível com o modelo 3D** | Só leitor de tela (`aria-describedby` em `<span hidden>`) |
| Tela cheia sem a Fullscreen API | **Tela cheia indisponível neste navegador** | Só leitor de tela; substitui "Tela cheia disponível em breve" |
| Dica do palco sem GLB | **Toque duas vezes para aproximar** | **Desvio da §7.2**: a spec pede "Arraste para girar · Toque duas vezes para aproximar". "Arraste para girar" só aparece quando o queijo tem GLB (`giroDisponivel`), porque o SVG não gira. A dica fica visível no celular sem GLB (antes só aparecia "Arraste para girar") |
| Estilo da legenda do 3D (P41 = A) | 13 px, `--palha`, centralizada abaixo da ilustração | Valem para o bloco B |

Registrar no checklist da §14 (aceite): os três desvios acima (Girar desabilitado sem GLB, descrição da Tela cheia, dica sem "Arraste para girar") e o rótulo fixo do P21.

**Bloco B (2026-11-03): textos novos e desvios para o checklist da §14**

| Onde | Texto / comportamento | Observação |
| --- | --- | --- |
| Legenda durante a carga (§7.5, P41 = A) | **Preparando a peça…** | `role="status"`, 13 px, `--palha`, centralizada entre a cena e a barra. Só em queijos com algum GLB; a linha de 20 px é reservada para não deslocar a barra |
| Sem WebGL (§7.5) | **Seu navegador não exibe o 3D. Veja as fotos abaixo.** | Mesma região e estilo. No celular as miniaturas ficam ocultas: o texto aponta para fotos que não aparecem (a spec manda o texto literal) |
| Botões novos (decisão (b), WCAG 2.5.7) | **Girar à esquerda** e **Girar à direita** (passo de 30°) | Só com GLB, no toolbar, depois de Girar. `aria-disabled` até o modelo estar pronto. Também param o giro automático |
| **Desvio da §7.6** (decisão (a), WCAG 2.2.2) | **Girar** aparece também no celular, apenas quando o queijo tem GLB | A §7.6 só o mostra no desktop. Sem GLB continua oculto no celular. O giro automático para na primeira interação com o modelo (arrasto, roda, setas, botões) |
| Textos internos do `model-viewer` (P42 = A) | Traduzidos pelo atributo `a11y` e pela região de avisos; lista abaixo, **aprovada pelo dono em 2026-11-03** | Só valem com GLB |
| Anúncio ao chegar em `pronto` (aprovado pelo dono) | **Peça pronta. Use Girar à esquerda ou à direita.** | Só leitor de tela (`sr-only` dentro do `role="status"` do aviso), uma vez por carga |
| Botões de giro desabilitados (aprovado pelo dono) | **Disponível quando a peça estiver pronta** | `aria-describedby` em `<span hidden>`, existe só enquanto o modelo não está pronto |

Lista do P42 (aprovada pelo dono em 2026-11-03) (`TRADUCOES_A11Y` em `components/ModeloDoQueijo.tsx`): *front* "Vista de frente"; *back* "Vista por trás"; *left* "Vista pela esquerda"; *right* "Vista pela direita"; *upper-front* "Vista por cima, de frente"; *upper-back* "Vista por cima, por trás"; *upper-left* "Vista por cima, pela esquerda"; *upper-right* "Vista por cima, pela direita"; *lower-front* "Vista por baixo, de frente"; *lower-back* "Vista por baixo, por trás"; *lower-left* "Vista por baixo, pela esquerda"; *lower-right* "Vista por baixo, pela direita"; *interaction-prompt* "Use o mouse, o toque ou as setas do teclado para girar a peça." (vai depois do `alt` no rótulo); rótulo da região de avisos do shadow DOM (originalmente "Live announcements"): "Avisos do visualizador 3D". **Fica em inglês** (não há como traduzir sem alterar a biblioteca): o anúncio "Loading" da região de avisos enquanto o modelo carrega e o foco está nele, e os rótulos "Loading 3D model", "View in your space" e "Exit AR", que não aparecem (sem poster e sem `ar`).

**Para o checklist da §14 (verificação do bloco B):**

- A Canastra só tem GLB inteiro no cenário típico de teste, mas a página abre no corte: o 3D só aparece depois de **Ver por dentro**.
- Os e2e com GLB mockado (`page.route`) só rodam localmente enquanto o manifesto estiver vazio (atendido em parte: rodados com um manifesto temporário, revertido, e pulados no CI).
- Com economia de dados (`saveData`) o 3D não baixa sozinho e **não há opção manual** de pedi-lo.
- Respiro entre o SVG e a barra: com GLB, a linha de aviso (16 px) ocupa o lugar do respiro, que fica com 16 px em vez dos 12 px da §7.2 (+4 px, só em queijos com GLB). Em tela cheia o desconto da cena passa de 170 para 174 px nesse caso.
- Mensagem sem WebGL a 360 px cabe em uma linha (conferido por e2e). **Decisão pendente do dono:** no celular as miniaturas ficam ocultas, então "Veja as fotos abaixo" não aponta para fotos; o texto da spec foi mantido.
- Movimento reduzido: Aproximar e os botões de giro saltam a câmera, sem interpolação. O anel de foco dourado do modelo é desenhado no contêiner (`data-foco`), porque o `:focus-visible` não atravessa o shadow DOM (conferido por e2e).
- Se o 3D falhar com o foco num botão de giro que some, o foco vai para **Girar** (se visível) ou **Aproximar**.

Desvios técnicos em relação ao plano: (0) a camada do 3D (`CamadaDoModelo`, com o anel de foco e o `ModeloDoQueijo`) é um único chunk tardio; (1) o `<model-viewer>` é criado por código em `ModeloDoQueijo` (atributos, não propriedades do React), então os valores da §11 aparecem como atributos do DOM; (2) os decodificadores são definidos em `self.ModelViewerElement` (ver ADR-0009, decisão 6), não na classe; (3) `React.lazy` + `Suspense` no lugar de `next/dynamic` (a documentação do Next 16 aceita os dois; o `next/dynamic` somava ~1,9 kB gzip ao JavaScript inicial do produto e estourava o orçamento) e uma fronteira de erro (`FronteiraDoModelo`) para que falha ao baixar o chunk volte ao SVG em vez de derrubar a página; (4) o zoom e os botões de giro usam a propriedade `cameraOrbit` mantendo theta/phi.

**Resultado do bloco B (medidas em `npm run medir:pacote`, manifesto vazio):** compartilhado 182,69 kB (+0,00); Home 187,03 kB e `/queijos` 182,69 kB (+0,00); produto 193,77 kB (+3,89 sobre a linha de base, limite +4: pouca folga); chunk tardio 293,41 kB gzip (limite 350), ausente do HTML; LCP/CLS sem mudança. Requisitos obrigatórios 1 a 4 atendidos; o e2e com GLB mockado (`page.route`, GLB sintético em `e2e/_apoio/glbSintetico.ts`) está **pulado** com o manifesto vazio e foi rodado e aprovado localmente alterando o manifesto por instantes (revertido). **Pendências:** luz quente de ~3200 K e ambiente HDR próprio (§11) ficam para o primeiro GLB real (hoje vale a luz neutra padrão); `ar`/Ver na mesa segue oculto (D23). **Verificações da tarefa 8 concluídas** (segurança, desempenho, design, acessibilidade e revisor, sem bloqueios; correções aplicadas no commit `a990e3a`).

### Requisitos obrigatórios do bloco B (critérios de pronto das tarefas 6 a 8)

Vindos da verificação do bloco A (acessibilidade, testes e revisor). A tarefa 7 só fecha com todos; a 8 confere.

1. **WCAG 2.2.2 (pausar, parar, ocultar):** o giro automático com GLB precisa poder ser pausado também no celular, hoje o **Girar** é `soDesktop` (§7.6). **Recomendação: A)** mostrar o Girar no celular apenas quando o queijo tem GLB (desvio pequeno da §7.6, a aprovar pelo dono) **e** parar o giro na primeira interação (já previsto). Por quê: parar no primeiro toque só ajuda quem toca no modelo; quem lê com leitor de tela ou outro dispositivo de entrada, ou tem distração por movimento, precisa de um controle explícito, e a volta de 10 s passa de 5 s. Alternativas: **B)** autorrotate só no desktop (perde o efeito no celular, que é o maior público); **C)** só parar na 1ª interação (não atende 2.2.2 sozinha).
2. **WCAG 2.5.7 (movimentos de arrastar) e 2.1.1:** alternativa sem arrasto para girar: botões "girar para a esquerda" e "girar para a direita" (passo de 30°) na barra, ou o `model-viewer` focável com setas. Rótulos novos **a aprovar pelo dono** (proposta: "Girar à esquerda" e "Girar à direita"). O `model-viewer` precisa ser focável com `alt`/`aria-label` descritivo (P42: `a11y` traduzido).
3. **Testes de ciclo de vida do componente** (unidade): tempo-limite de 20 s com *fake timers* (`vi.useFakeTimers`), `IntersectionObserver` simulado (visível → preparando), `requestIdleCallback` simulado, `load`, `error`, `camera-change` e desmontagem (sem ouvintes nem *timers* soltos).
4. **E2E com GLB mockado:** `page.route('**/models/*.glb', …)` entregando um GLB sintético mínimo (montado no teste, sem arquivo binário no repositório) para exercitar carga, troca inteiro/cortado, tempo-limite e erro sem depender de um GLB real.

### Commits da etapa 5

| Bloco | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| Docs | Este detalhamento e o ADR-0009 (Proposto) | `docs: detalha a etapa 5 e propõe o ADR-0009` | Publicado (`cdae7aa`); ADR aceito em 2026-11-03 |
| A | Tarefas 1 a 5 | `feat(3d): liga tela cheia, zoom e validador de modelos sobre o SVG` | Publicado (`92fb989`) |
| B | Tarefas 6 a 8 | `feat(3d): adiciona o visualizador com model-viewer carregado sob demanda` | Publicado (`a990e3a`) |
| C | Tarefas 9 a 11 | `feat(3d): adiciona o 3D no hero e o giro no cartão` | **Pendente, só com o 1º GLB** (P40 = B) |
| Docs | Tarefa 12 | `docs: fecha a etapa 5` | Arquivos prontos; commit a cargo da sessão principal |

Ordem: A → B → fechamento; C espera o primeiro GLB (P40 = B).

### Verificação (vale para cada bloco)

- **`guardiao-do-design`:** palco a 1440 e 390 px igual ao de hoje no modo SVG (nenhuma mudança visual não aprovada); legenda e mensagem conforme o P41; palco em tela cheia só com tokens existentes.
- **`especialista-em-acessibilidade`:** WCAG 2.2 AA. Toolbar (setas, Home, End), `aria-pressed` de Girar, Aproximar e Tela cheia, foco em tela cheia, `role="status"` das legendas, `alt` do modelo, `a11y` traduzido, movimento reduzido.
- **`testes-e-qualidade`:** unidade em `lib/` e no `CheeseViewer`; e2e da seção de testes; nenhuma requisição a outro domínio em nenhuma rota.
- **`performance-e-seo`:** orçamento da tabela; LCP e CLS do produto.
- **`auditor-de-seguranca`:** obrigatório no bloco B.
- **`revisor-de-codigo`:** antes de cada commit.

### Critérios de pronto da etapa 5

- Spec §7.5 (os dois textos do 3D), §10.3 e §11 atendidas, com o manifesto vazio e com um manifesto falso nos testes.
- **Ver na mesa** ausente do HTML (D23).
- Sem GLB, nenhum byte do `model-viewer` é baixado em nenhuma página, e nenhuma requisição vai para outro domínio.
- Orçamento de desempenho respeitado e registrado no ADR-0009.
- `npm run modelos:validar` no CI.
- Única dependência nova: `@google/model-viewer` + `three` (ADR-0009), instaladas só depois da aprovação.

### Riscos da etapa 5

- **Caminho do GLB sem teste ponta a ponta** (não há GLB) → *stub* de elemento nos testes de unidade, e2e pulado que se ativa sozinho, verificação manual com GLB de teste fora do repositório.
- **Biblioteca carregando decodificadores do CDN do Google** → locais definidos antes de qualquer `src`; validador barra GLB comprimido sem decodificador local; e2e confere que não há requisição externa.
- **`three` fora da faixa do `model-viewer`** (o `peerDependency` é `^0.183.0`, que no npm só aceita 0.183.x) → versão exata 0.183.2; Dependabot/Renovate (etapa 9) não pode subir o `three` sozinho: agrupar as duas atualizações.
- **WebGL por software no Chromium sem cabeça** (o Chrome vem restringindo o SwiftShader automático) → nenhum e2e desta etapa depende de WebGL real; o caso com GLB, quando ativado, pode exigir `--enable-unsafe-swiftshader` só no projeto de teste.
- **Fullscreen API no Chromium sem cabeça ou no Safari** → teste de unidade com *stub*; e2e em Chromium; sem suporte, o botão fica `aria-disabled`.
- **Erro de hidratação no Girar com movimento reduzido** (o servidor não sabe a preferência) → servidor e primeira renderização usam o padrão da §10.3; a preferência é aplicada depois da montagem, sem mudar o HTML do servidor.
- **CLS na troca SVG → 3D** → mesma proporção do SVG, modelo por cima e invisível até `load`.
- **Textos internos do `model-viewer` em inglês** → atributo `a11y` (P42).
- **Licença Apache-2.0 exige manter os avisos** → conferir se o build preserva os comentários de licença; página ou arquivo de avisos de terceiros na etapa 9.
- **CSP futura (etapa 8)** → o 3D exige, no mínimo, `connect-src 'self'`; com Draco/KTX2, `worker-src blob:` e `'wasm-unsafe-eval'` em `script-src`; texturas podem usar `blob:` em `img-src`. Conferir na etapa 8 com o GLB real; anotado no ADR-0009.

### Perguntas ao dono (etapa 5)

| # | Pergunta | Opções | Recomendação | Decisão do dono |
| --- | --- | --- | --- | --- |
| P39 | Sem GLB, o que fazer com **Girar** e com a dica "Arraste para girar", que prometem um giro que o SVG não tem? | **A)** Como no protótipo: Girar visível e com `aria-pressed="true"`, sem efeito. **B)** Sem GLB, esconder o Girar e mostrar só "Toque duas vezes para aproximar" na dica (desvio de texto e de layout). **C)** Manter o visual do protótipo, mas o Girar fica `aria-pressed="false"` e `aria-disabled="true"`, com o texto só para leitor de tela "Giro disponível com o modelo 3D" (mesmo padrão já usado na Tela cheia) | **C** agora (fidelidade visual e estado honesto para o leitor de tela), revendo antes da publicação se ainda não houver GLB | **C** (2026-11-03). Texto novo aprovado: "Giro disponível com o modelo 3D" |
| P40 | Hero e giro do cartão sem GLB | **A)** Implementar agora as ilhas, ativadas pelo manifesto (~450 linhas sem efeito visível e sem e2e real). **B)** Implementar quando chegar o primeiro GLB; os contratos já ficam neste plano. **C)** Efeito em CSS sobre o SVG agora (mudança de design fora da spec) | **B.** O hero precisa de uma variante do A.3 sem o queijo (ativo novo a aprovar) e o giro do cartão baixa até ~3 MB por cartão; nada disso pode ser calibrado sem o GLB | **B** (2026-11-03): hero e giro do cartão só com o primeiro GLB (bloco C adiado) |
| P41 | Visual da legenda **Preparando a peça…** e da mensagem sem WebGL (a spec só dá o texto) | **A)** Mesmo estilo da dica (13 px, `--palha`), centralizada logo abaixo da ilustração, acima da barra. **B)** No lugar da dica, no canto superior esquerdo. **C)** Dentro de uma pílula como a do hero (`--vidro-escuro`, borda `--pedra`) | **A**, sem cor nem medida nova. Observação: no celular as miniaturas ficam ocultas, então "Veja as fotos abaixo" não tem fotos para onde apontar; recomendamos manter o texto literal até haver fotos | **A** (2026-11-03): 13 px, `--palha`, centralizada abaixo da ilustração |
| P42 | O `model-viewer` tem textos próprios para leitor de tela, em inglês (por exemplo, "Use mouse, touch or arrow keys to move"). Traduzir pelo atributo `a11y`? | **A)** Traduzir; o `especialista-3d-webgl` levanta a lista na tarefa 7 e o dono aprova (como no D8). **B)** Deixar em inglês | **A** (só vale quando houver GLB) | **A** (2026-11-03): traduzir; lista a aprovar na tarefa 7 |
| P43 | Limite do GLB: a §11 diz "até ~3 MB" | **A)** Erro acima de 3 MiB (3.145.728 bytes). **B)** Aviso acima de 3 MB e erro acima de 4 MB | **A**, simples e fiel ao número da spec; o dono afrouxa se um modelo bom não couber | **A** (2026-11-03): erro acima de 3 MiB (3.145.728 bytes) |
| D22 | Aprovar o [ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md) (instalar `@google/model-viewer` 4.4.0 e `three` 0.183.2)? | **A)** Aprovar agora (bloco B segue logo após o A). **B)** Aprovar, mas instalar só com o primeiro GLB (a etapa fecha só com o bloco A). **C)** Rejeitar e ficar só no SVG | **A**, porque o D21 pede o carregamento pronto; o custo para o visitante sem GLB é zero | **A** (2026-11-03): aprovado, instalar no bloco B; ADR-0009 **Aceito** |

---

## Etapa 6 — Assistente com roteiro determinístico, horário e links do WhatsApp

**Objetivo:** dar ação a todos os controles do painel de atendimento e ao **Fale com um queijista** do produto (spec §8.2, §8.3, §10.5 e item "Painel de atendimento" da §14): a conversa começa só com a saudação e as respostas rápidas (P4), segue uma árvore de opções determinística, passa para humano pelo WhatsApp com a mensagem da §8.3 e mostra o horário ou a mensagem de cave fechada conforme a hora em `America/Sao_Paulo`.

**Situação: concluída em 2026-11-05.** Bloco A (tarefas 1 a 4) publicado em `a744972`; bloco B (tarefas 5 a 8) publicado em `a37640c`; tarefa 9 (documentação) fechada com `docs: fecha a etapa 6`. O dono aceitou todas as recomendações das [perguntas P44 a P52](#perguntas-ao-dono-etapa-6) em 2026-11-03. Os 13 textos do P52 seguem como `[A DEFINIR: …]` até o dono escrevê-los.

**Pré-requisito:** etapa 5 concluída (`a990e3a`, `5794996`); `data/ficticio.ts` com `numeroDoWhatsApp()` (`39fd9e0`).

**Decisões:** [ADR-0010](adr/0010-assistente-deterministico-e-whatsapp.md) (motor puro atrás de interface assíncrona, roteiro carregado sob demanda, número resolvido no servidor, horário com `Intl`, sem dependência nova). D24 (roteiro determinístico agora, IA depois com ADR), D26 (número fictício), P4 (conversa começa só com a saudação), P5 (aba do queijista dentro do horário).

**Skills:** antes de cada tarefa, conferir o mapa em `SKILLS-ATELIE-DO-QUEIJO.md` (em especial as regras `bundle-*` e `rerender-*` da `vercel-react-best-practices` para o *chunk* tardio e o estado da conversa). A spec vence em caso de conflito.

### Escopo: o que entra e o que fica para depois

| Item da spec | Etapa 6 | Depois |
| --- | --- | --- |
| Conversa inicial (§8.2, itens 1 e 2; P4) | Só a saudação e **Sugira um queijo** · **Montar uma tábua** · **Onde está meu pedido?** | — |
| Roteiro do protótipo (§8.2, itens 3 a 7) | Reproduzido quando a pessoa escreve uma frase com presente + vinho tinto (a frase do item 3 é o caso de teste): resposta do item 4, cartão do Canastra, pergunta do item 6 e as respostas **Sim, com cartão** (sugerida) · **Ver outras opções** | — |
| Árvore de opções (§8.2, "Regras do assistente") | Sugerir queijo (P44), montar tábua (P45), status do pedido, harmonização, presente (P46), passagem para humano, saúde, "não entendi" (P48). Textos sem fonte na spec ficam como lacuna `[A DEFINIR: …]` (P52) | IA real (D24), com ADR próprio |
| Cartão de produto no chat (§8.2) | Qualquer um dos 10 queijos: A.7 para o Canastra, A.6 a 84 px para os demais (decisão da etapa 3); botão `aria-label="Ver {nome} em 3D"` | — |
| Adicionar à sacola pelo chat | Conforme P46, pela ação devolvida pelo motor e executada pelo painel com `useSacola()`; aviso **Adicionado à sacola. Boa escolha.** (§7.5) | — |
| Consulta de pedido pelo número | Valida o formato `AQ-` + 6 dígitos e passa para humano com **Olá! Quero falar sobre o pedido nº [número].** Os pedidos são simulados e não são gravados (ADR-0008), então não há consulta real | Com o gateway e um banco (etapa 9 ou depois) |
| Passagem para humano (§8.2) | Mensagem literal **Vou chamar um queijista da nossa equipe. Continue pelo WhatsApp, já com o resumo desta conversa.** + o botão verde da faixa com a mensagem da §8.3 escolhida pelo contexto (P47) | — |
| Links `wa.me` (§8.3, §10.5) | Faixa de passagem, aba **Queijista (WhatsApp)** e **Fale com um queijista** do produto viram `<a href="https://wa.me/…">` (P49) | **Pedir orçamento** de `/presentes` (mensagem corporativa) na etapa 7, com o mesmo componente |
| Horário (§1, §8.3) | Dentro: linha **Seg a sex, 9h às 18h · sáb, 9h às 15h** + botão (P5). Fora: a mensagem literal de cave fechada **no lugar** da linha de horário + botão (o botão continua, §8.3). Feriados conforme P50 | — |
| Número ausente em produção (`numeroDoWhatsApp() === null`) | Os links e botões do WhatsApp **não são renderizados** (regra de `docs/ambiente.md`); a aba continua com o texto do horário | Etapa 9: avaliar falhar o build (ADR-0010, alternativas) |
| Mensagem automática do WhatsApp Business (§8.3) | **Fora** (não é código; configuração do dono no aplicativo) | Checklist da etapa 9 |
| Faixa de passagem (§8.2) | Sem mudança visual; o botão vira link | — |

**Fora, por regra do projeto:** nenhuma dependência nova, nenhuma variável de ambiente nova, nenhuma requisição de rede, nada gravado (`localStorage`, `sessionStorage`, servidor ou log).

### Contratos

#### `lib/whatsapp.ts` (puro; não importa `data/`)

```ts
export type NumeroDoPedido = `AQ-${string}`;   // sempre validado por lerNumeroDoPedido

export type MotivoDoContato =
  | { tipo: 'geral' }
  | { tipo: 'produto'; nomeDoQueijo: string }   // nome vindo do catálogo, nunca do usuário
  | { tipo: 'pedido'; numero: NumeroDoPedido }
  | { tipo: 'corporativo' };

/** Textos literais da §8.3: geral, produto ("…sobre o {nome}."), pedido ("…pedido nº {número}.") e corporativo. */
export function mensagemDoWhatsApp(motivo: MotivoDoContato): string;

/** `https://wa.me/<numero>?text=<encodeURIComponent(mensagem)>`. RangeError se `numero` não casar com ^55\d{10,11}$. */
export function linkDoWhatsApp(numero: string, motivo: MotivoDoContato): string;

/** "aq-123456", "AQ 123456", "AQ123456" → "AQ-123456"; qualquer outra coisa → null. Mesmo formato de lib/pedido.server.ts. */
export function lerNumeroDoPedido(texto: string): NumeroDoPedido | null;

export const FUSO_DO_ATENDIMENTO = 'America/Sao_Paulo';

export type IntervaloDoDia = Readonly<{ abre: number; fecha: number }>;   // minutos desde 0h, [abre, fecha)

/** 7 posições, índice 0 = domingo (null = fechado). Dom: null; seg a sex: { abre: 540, fecha: 1080 }; sáb: { abre: 540, fecha: 900 }. */
export const HORARIO_DO_ATENDIMENTO: readonly (IntervaloDoDia | null)[];

/** Dia, hora e minuto lidos com Intl.DateTimeFormat no fuso de São Paulo, qualquer que seja o fuso da máquina. */
export function atendimentoHumanoAberto(agora?: Date): boolean;

/** Textos literais: linha do horário (§8.2) e mensagem de cave fechada (§8.3). */
export const TEXTO_DO_HORARIO: string;
export const TEXTO_DA_CAVE_FECHADA: string;
```

- Fronteiras: 8:59 fechado, 9:00 aberto, 17:59 aberto, 18:00 fechado; sábado 14:59 aberto, 15:00 fechado; domingo sempre fechado. O Brasil não tem horário de verão desde 2019, mas o cálculo pelo `Intl` não depende disso.
- O número do WhatsApp não é lido aqui: chega por parâmetro (ADR-0010, decisão 5).

#### `lib/assistant.ts` (leve, no pacote global; ponto de integração da §8.2)

```ts
import type { Shape, SlugDoQueijo } from '@/data/cheeses';   // só tipos
import type { Centavos } from './dinheiro';
import type { MotivoDoContato } from './whatsapp';
import type { RespostasDoQuiz } from './quiz';

export type RespostaRapida = { id: string; rotulo: string; sugerida?: boolean };   // não muda

/** Dados mínimos do cartão (antes em lib/cartaoDoChat.ts). Viajam dentro da mensagem: o painel não importa catálogo. */
export type CartaoDoChat = {
  nome: string; tag: string; linhaPequena: string; preco: Centavos;
  ilustracao: { shape: Shape; side: string; top: string };   // A.6; o Canastra usa A.7
};

export type MensagemDoChat =
  | { id: string; tipo: 'assistente'; texto: string }
  | { id: string; tipo: 'cliente'; texto: string }
  | { id: string; tipo: 'produto'; slug: SlugDoQueijo; cartao: CartaoDoChat }   // + cartao
  | { id: string; tipo: 'respostas-rapidas'; opcoes: readonly RespostaRapida[] };

export type EntradaDoCliente =
  | { tipo: 'resposta-rapida'; id: string }
  | { tipo: 'texto'; texto: string };            // até TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE

export type AcaoDoAssistente =
  | { tipo: 'adicionar-a-sacola'; slug: SlugDoQueijo; formatoId: string; quantidade: 1; presente: boolean };   // conforme P46

export type EtapaDoRoteiro =
  | 'inicio' | 'quiz-sabor' | 'quiz-uso' | 'quiz-acompanhamento'
  | 'harmonizar' | 'pedido-numero' | 'presente' | 'presente-formato' | 'livre';

export interface EstadoDaConversa {
  etapa: EtapaDoRoteiro;
  respostasDoQuiz: Partial<RespostasDoQuiz>;
  /** Motivo usado pelos botões verdes enquanto a conversa estiver neste estado (P47). Começa em { tipo: 'geral' }. */
  contato: MotivoDoContato;
  /** Contador dos ids das mensagens: sem Math.random nem relógio, para testes estáveis. */
  proximoId: number;
}

export interface RespostaDoAssistente {
  mensagens: readonly MensagemDoChat[];          // já inclui o eco do cliente
  acoes: readonly AcaoDoAssistente[];
  /** Presente quando o assistente passa para humano (§8.2). */
  transferirParaHumano?: MotivoDoContato;
  estado: EstadoDaConversa;
}

export interface Assistente {
  responder(estado: EstadoDaConversa, entrada: EntradaDoCliente): Promise<RespostaDoAssistente>;
}

/** §8.2, itens 1 e 2, literais. Estáticas: aparecem sem esperar o motor. */
export const MENSAGENS_INICIAIS: readonly MensagemDoChat[];
export const ESTADO_INICIAL: EstadoDaConversa;
export const TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE = 500;

/** Hoje: import('./roteiro'). A IA futura troca só esta função (ADR-0010). */
export function carregarAssistente(): Promise<Assistente>;
```

- `ROTEIRO_DO_PROTOTIPO` sai. Quem o usa hoje (`SupportPanel`, `components/Atendimento.test.tsx`, `e2e/atendimento.spec.ts`) passa a reproduzir o protótipo digitando a frase do item 3.

#### `lib/roteiro.ts` (motor determinístico; carregado só por `carregarAssistente()`)

```ts
export const assistenteDeterministico: Assistente;
/** Texto em minúsculas, sem acento (NFD), espaços normalizados. Exportada para teste. */
export function normalizar(texto: string): string;
/** Intenção do texto livre, pela tabela de palavras-chave (P48). Ordem de prioridade fixa. */
export function reconhecerIntencao(texto: string): Intencao;
```

- **Ordem de prioridade do texto livre** (a primeira que casar vence): saúde (gravidez, leite cru e afins) → passagem para humano (pede pessoa, reclamação, problema com entrega, corporativo/empresa) → número de pedido (`lerNumeroDoPedido`) → presente + vinho tinto (roteiro do protótipo) → tábua → harmonização → sugestão → "não entendi".
- **Saúde:** responde com o texto do dono (P52), que precisa recomendar consultar um médico e nada além (§8.2). Nunca recomenda um queijo nessa resposta.
- **Nunca inventa queijo:** todo cartão sai de `lib/cartoesDoChat.ts`, indexado por `SlugDoQueijo`; o tipo impede slug fora do catálogo.
- **Nunca promete prazo:** nenhuma resposta cita prazo de entrega; perguntas de entrega vão para a passagem para humano.
- **Textos:** os literais da spec e os de `lib/quiz.ts` (`PERGUNTAS`, `textoPorQueCombina`, D11) são reaproveitados; os demais ficam num único objeto `TEXTOS_DO_ROTEIRO`, com `[A DEFINIR: …]` até o dono preencher (P52).
- **Resposta rápida antiga:** só o último grupo de respostas rápidas aceita clique; o motor ignora (sem mensagem) um id que não pertence à etapa atual.

#### `lib/cartoesDoChat.ts` (substitui `lib/cartaoDoChat.ts`)

```ts
export const CARTOES_DO_CHAT: Readonly<Record<SlugDoQueijo, CartaoDoChat>>;
/** O que a pontuação do quiz precisa (slug + maior formato), na ordem do catálogo. */
export const QUEIJOS_DO_QUIZ_NO_CHAT: readonly QueijoDoQuiz[];
```

- Cópia estática e mínima (o mesmo padrão do `cartaoDoChat`), importada só pelo motor. O teste confere os 10 cartões contra `dadosDoCartao(q, 'chat')` e `q.ilustracao`, e a lista do quiz contra `maiorFormatoEmGramas(q.formatos)`, na ordem de `QUEIJOS`.

#### Atendimento (`components/Atendimento.tsx` e `components/LinkDoWhatsApp.tsx`, client)

```ts
export function AtendimentoProvider(props: {
  children: ReactNode;
  /** Resolvido no servidor (app/layout.tsx chama numeroDoWhatsApp()). null = esconder os links. */
  numeroDoWhatsApp: string | null;
}): JSX.Element;

/** Acrescenta ao valor atual de useAtendimento(): */
type ValorDoAtendimento = {
  aberto: boolean; abrir: (origem?: HTMLElement) => void; fechar: (opcoes?: OpcoesDeFechamento) => void;
  numeroDoWhatsApp: string | null;
  conversa: { mensagens: readonly MensagemDoChat[]; estado: EstadoDaConversa };   // memória, conforme P51
  enviar: (entrada: EntradaDoCliente) => Promise<void>;
};

/** <a href="https://wa.me/…"> com o ícone e o texto recebidos; null quando não há número. Comportamento de aba conforme P49. */
export function LinkDoWhatsApp(props: { motivo: MotivoDoContato; className?: string; children: ReactNode }): JSX.Element | null;
```

- **Ninguém no cliente chama `numeroDoWhatsApp()`**: `VERCEL_ENV` não chega ao navegador, e a função cairia sempre no número fictício (ADR-0010, decisão 4). Um teste confere que nenhum arquivo com `'use client'` importa `numeroDoWhatsApp`.
- `LinkDoQueijista` (produto) passa a usar `LinkDoWhatsApp` com `{ tipo: 'produto', nomeDoQueijo: q.nome }`; recebe o nome por prop do `PainelDeCompra`. Sem número, a linha inteira **Dúvidas sobre este queijo? Fale com um queijista** some.
- `SemAcao` e os dois avisos "… disponível em breve" do `SupportPanel` saem. `BotaoEmBreve` continua só no **Avise-me** (P15).

### Fronteiras Server/Client e carregamento

| Peça | Tipo | Motivo |
| --- | --- | --- |
| `app/layout.tsx` | Server (continua) | Chama `numeroDoWhatsApp()` e passa o resultado ao provider |
| `AtendimentoProvider`, `SupportPanel`, `LinkDoWhatsApp` | Client (continuam / novo) | Estado da conversa, diálogo, horário calculado no navegador |
| `lib/whatsapp.ts`, `lib/assistant.ts` | Módulos leves no pacote global | Usados pelo painel e pelo link do produto |
| `lib/roteiro.ts` + `lib/cartoesDoChat.ts` + `lib/quiz.ts` (no chat) | *Chunk* tardio por `import()` ao abrir o painel | Fora do JavaScript inicial de todas as rotas |
| `CheeseIllustration` (A.6) dentro do cartão do chat | Importado pelo painel (client) | Sem `useId` e pequeno; se estourar o orçamento, vai para o *chunk* tardio |
| Horário (`atendimentoHumanoAberto`) | Calculado ao abrir o painel e ao selecionar a aba do queijista | O conteúdo do painel só existe com ele aberto: sem HTML do servidor, sem erro de hidratação |

### Acessibilidade

- O `role="log"` da conversa já é região viva educada: cada resposta nova é anunciada. Não anunciar as respostas rápidas em separado.
- Ao escolher uma resposta rápida, o grupo antigo sai e vira a mensagem do cliente; o foco vai para o **campo de mensagem** (estável e previsível). Validar com o `especialista-em-acessibilidade` antes de fechar a tarefa 4.
- Enter no campo envia; campo vazio ou só com espaços não envia nada e não gera mensagem. `maxLength` = `TAMANHO_MAXIMO_DA_MENSAGEM_DO_CLIENTE`.
- Links do WhatsApp são `<a>` reais (§13), com o mesmo visual de hoje; o aviso de nova aba segue o P49.
- A troca da linha do horário pela mensagem de cave fechada acontece só ao abrir ou ao trocar de aba, nunca enquanto a pessoa lê.
- A rolagem até a última mensagem (já existe ao abrir) passa a valer também a cada resposta nova, instantânea com `prefers-reduced-motion`.

### Desempenho (orçamento)

Medido com `npm run medir:pacote` (etapa 5).

| Medida | Linha de base (fim da etapa 5) | Limite |
| --- | --- | --- |
| *First Load JS* compartilhado | 182,69 kB gzip | **+1,5 kB** (`lib/whatsapp`, `lib/assistant`, estado da conversa, `LinkDoWhatsApp`, A.6 no cartão) |
| JavaScript inicial de `/queijos/[slug]` | 193,77 kB | Só o que o compartilhado somar (o link do produto não traz nada próprio) |
| *Chunk* tardio do motor | — | **12 kB gzip**; nunca nos `<script>` do HTML de nenhuma página |

### Segurança e privacidade

- Nada sai do navegador além da navegação para `wa.me`, iniciada pela pessoa.
- A URL do WhatsApp só contém dados fixos ou validados (ADR-0010, decisão 5). Teste: nenhum texto livre digitado aparece em nenhum `href`.
- Mensagens renderizadas como texto do React (sem `dangerouslySetInnerHTML`); `rel="noopener noreferrer"` se o P49 mandar abrir em nova aba.
- A conversa fica só em memória (P51); fechar a aba do navegador apaga tudo. Para a IA futura: registro de conversas e aviso de LGPD entram no ADR próprio.

### Testes

- **Unidade (`lib/`):** `mensagemDoWhatsApp` com os quatro textos literais; `linkDoWhatsApp` codifica acentos, `?`, `&`, `#` e espaços (comparar com `decodeURIComponent`), e lança com número inválido; `lerNumeroDoPedido` (válidos, minúsculas, sem hífen, com espaço, 5 e 7 dígitos, letras); `atendimentoHumanoAberto` em todas as fronteiras acima, com `agora` explícito e com `TZ=UTC` e `TZ=Asia/Tokyo` simulados (`process.env.TZ` no teste ou datas em UTC que caem em outro dia em São Paulo); motor: o caminho do protótipo produz literalmente os itens 4 a 7 da §8.2; cada resposta rápida; quiz no chat igual a `recomendarQueijo` para as 36 combinações; prioridade do texto livre; saúde nunca devolve cartão; id de resposta rápida antiga é ignorado; nenhuma resposta contém prazo; `CARTOES_DO_CHAT` igual ao catálogo.
- **Componente:** painel abre com 2 mensagens (saudação e respostas); clique numa resposta rápida põe a mensagem do cliente e a resposta, e leva o foco ao campo; Enter envia; vazio não envia; com `numeroDoWhatsApp={null}` não há nenhum link `wa.me` no painel nem no `LinkDoQueijista`; `vi.setSystemTime` num domingo mostra a cave fechada e o botão continua; ação de sacola chama `adicionar` com os dados da ação (P46); nenhum arquivo client importa `numeroDoWhatsApp`.
- **E2E (Playwright):** o fluxo do protótipo digitando a frase do item 3 (e é este estado que o `guardiao-do-design` compara com o protótipo); `href` dos três links (`decodeURIComponent` igual ao texto literal da §8.3, com o número fictício); `page.clock.setFixedTime` num sábado às 15h00 e num domingo → mensagem de cave fechada; numa terça às 10h → linha de horário; nenhuma requisição para outro domínio ao usar o chat; sem rolagem horizontal a 360 px com o painel aberto e a conversa longa; o *chunk* do motor não aparece no HTML.
- Os testes atuais que esperam o roteiro estático (`components/Atendimento.test.tsx:216`, `:236`; `e2e/atendimento.spec.ts:154`, `:182`), os que esperam **Fale com um queijista** como botão (`e2e/produto-teclado.spec.ts:93`, `:105`; `PainelDeCompra.test.tsx:113`) e o da rolagem ao abrir (a conversa inicial é curta) são atualizados nas tarefas que mudam o comportamento.

### Tarefas

Cada tarefa termina com `lint`, `typecheck`, `format:check`, `test`, `modelos:validar`, `build` e `test:e2e` passando. Estimativa de linhas entre parênteses.

**Bloco A — Regras sem interface (commit 1)**

1. **[especialista-em-ia-conversacional] `lib/whatsapp.ts`** (~200 com testes)
   - Contrato acima: mensagens literais da §8.3, link, `lerNumeroDoPedido`, horário, `TEXTO_DO_HORARIO` e `TEXTO_DA_CAVE_FECHADA` literais. Feriados conforme P50 (sem resposta, nenhum feriado).
   - **Pronto quando:** os testes de unidade da seção de testes para `lib/whatsapp.ts` passam, inclusive com o fuso da máquina diferente de São Paulo; `linkDoWhatsApp('5520900000000', { tipo: 'geral' })` decodificado devolve exatamente **Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.**

2. **[especialista-em-ia-conversacional] Contratos de `lib/assistant.ts` e `lib/cartoesDoChat.ts`** (~250 com testes)
   - Tipos, `MENSAGENS_INICIAIS`, `ESTADO_INICIAL`, `carregarAssistente()` (com `lib/roteiro.ts` ainda mínimo, só com o "não entendi"); `CARTOES_DO_CHAT` e `QUEIJOS_DO_QUIZ_NO_CHAT` com testes contra o catálogo. `lib/cartaoDoChat.ts` sai (o `SupportPanel` passa a ler `mensagem.cartao`, mudança de poucas linhas). **Anotação (bloco A):** a remoção de `lib/cartaoDoChat.ts` e de `ROTEIRO_DO_PROTOTIPO` foi movida para a tarefa 6, porque o bloco A não mexe na UI e o `SupportPanel` ainda os usa.
   - **Pronto quando:** `typecheck` passa sem `any`; os 10 cartões batem com `dadosDoCartao(q, 'chat')`; `MENSAGENS_INICIAIS` tem exatamente os itens 1 e 2 da §8.2.

3. **[especialista-em-ia-conversacional] Motor determinístico `lib/roteiro.ts`** (~400 com testes; se passar, dividir em 3a quiz e protótipo, 3b pedido, tábua, harmonização, humano e saúde) — **depende de P44 a P48**
   - Árvore, prioridade do texto livre, ações, `contato` por estado (P47), textos em `TEXTOS_DO_ROTEIRO` com as lacunas do P52.
   - **Pronto quando:** os testes do motor da seção de testes passam; uma busca em `lib/roteiro.ts` não encontra nenhum texto visível fora de `TEXTOS_DO_ROTEIRO`, de `lib/quiz.ts` e das constantes literais da spec.

4. **Verificação do bloco A:** `testes-e-qualidade` (cobertura das fronteiras de horário e do motor), `auditor-de-seguranca` (montagem da URL, validação do número do pedido, nada de texto livre na URL) → `revisor-de-codigo` → commit `feat(atendimento): adiciona o roteiro do assistente e as regras do WhatsApp`.

**Bloco B — Interface (commit 2)**

5. **[frontend-nextjs] Número no servidor e `LinkDoWhatsApp`** (~200 com testes)
   - `app/layout.tsx` passa `numeroDoWhatsApp()` ao provider; `LinkDoWhatsApp`; `LinkDoQueijista` vira link com a mensagem de produto (nome por prop do `PainelDeCompra`); testes de `PainelDeCompra` e `e2e/produto-teclado.spec.ts` atualizados (botão → link, mesma ordem de Tab).
   - **Pronto quando:** na página do Canastra, o `href` de **Fale com um queijista**, decodificado, é `https://wa.me/5520900000000?text=Olá! Tenho uma dúvida sobre o Canastra curado.`; com o provider recebendo `null`, a linha não existe no DOM; teste confirma que nenhum arquivo `'use client'` importa `numeroDoWhatsApp`.

6. **[frontend-nextjs + especialista-em-ia-conversacional] Conversa ligada ao motor** (~350 com testes)
   - Estado da conversa no provider (P51), `enviar`, `import()` do motor ao abrir, respostas rápidas e campo com ação, cartões para os 10 queijos, execução das ações (P46) com o aviso da §7.5, foco e rolagem conforme a seção de acessibilidade. Saem `ROTEIRO_DO_PROTOTIPO`, `SemAcao` e `lib/cartaoDoChat.ts`. Também: esconder ou desativar o grupo antigo de respostas rápidas depois de saúde, humano e pedido; reconfirmar a ausência de `innerHTML` (texto do cliente e do motor só como texto); e um teste que barre arquivo `'use client'` importando `numeroDoWhatsApp`.
   - **Pronto quando:** os testes de componente da seção de testes passam; o e2e do protótipo (frase do item 3) mostra os itens 4 a 7 literais; `npm run medir:pacote` dentro do orçamento e o *chunk* do motor ausente do HTML.

7. **[frontend-nextjs + especialista-em-ia-conversacional] WhatsApp no painel e horário** (~200 com testes)
   - Botão verde da faixa e da aba como `LinkDoWhatsApp` com `conversa.estado.contato`; passagem para humano mostra a mensagem literal da §8.2; aba do queijista com linha de horário ou cave fechada, calculada ao abrir e ao trocar de aba; comportamento de aba conforme P49.
   - **Pronto quando:** e2e com `page.clock` (sábado 15h00, domingo, terça 10h) passa; depois de informar `AQ-123456` no chat, o `href` do botão verde decodificado termina em **Olá! Quero falar sobre o pedido nº AQ-123456.**; sem número, nenhum `wa.me` no painel.

8. **Verificação do bloco B, em paralelo:** `guardiao-do-design` (painel a 1440 e 390 px no estado do protótipo; cave fechada; cartão A.6 de um queijo que não é o Canastra, a 84 px), `especialista-em-acessibilidade` (foco após resposta rápida, região viva, links, diálogo), `auditor-de-seguranca` (campo livre, links externos, nenhuma requisição), `performance-e-seo` (orçamento), `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(atendimento): liga o assistente, o horário e os links do WhatsApp`.

**Fechamento**

9. **[documentador-tecnico] Fechamento da etapa 6**
   - `docs/conteudo.md`: como editar `TEXTOS_DO_ROTEIRO`, o horário (e feriados, se o P50 pedir) e as palavras-chave; `docs/ambiente.md`: o número agora é usado, resolvido no servidor, e o que acontece sem ele; CHANGELOG e README; neste plano, a situação da etapa, a tabela de [controles sem ação](#controles-sem-ação-ao-fim-da-etapa-3) (linhas da etapa 6 resolvidas) e o item "Painel de atendimento" da §14.
   - **Feito em 2026-11-05.** `docs/conteudo.md` ganhou a seção "Assistente, horário e WhatsApp" (textos do P52, `HORARIO_DO_ATENDIMENTO`, palavras-chave do P48); `docs/ambiente.md`, CHANGELOG e README foram atualizados; as linhas da etapa 6 das duas tabelas de controles sem ação foram marcadas como resolvidas.
   - **Pronto quando:** commit `docs: fecha a etapa 6` publicado.

### Commits da etapa 6

| Bloco | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| Docs | Este detalhamento e o ADR-0010 | `docs: detalha a etapa 6 e registra o ADR-0010` | **Publicado** (`3da1c16`) |
| A | Tarefas 1 a 4 | `feat(atendimento): adiciona o roteiro do assistente e as regras do WhatsApp` | **Publicado** (`a744972`) |
| B | Tarefas 5 a 8 | `feat(atendimento): liga o assistente, o horário e os links do WhatsApp` | **Publicado** (`a37640c`) |
| Docs | Tarefa 9 | `docs: fecha a etapa 6` | Publicado (`2b2922d`) |

### Critérios de pronto da etapa 6

**Todos atendidos em 2026-11-05** (lacunas do P52 ainda visíveis, como previsto).

- §8.2 e §8.3 atendidas, com as lacunas do P52 visíveis enquanto o dono não preencher.
- Item "Painel de atendimento" da §14: duas abas, roteiro do assistente, horário e botão verde do WhatsApp com mensagem pré-preenchida.
- §10.5: **Fale com um queijista** abre o WhatsApp com a mensagem do produto.
- Nenhum controle do painel ou do link do produto sem ação; `BotaoEmBreve` só no **Avise-me**.
- Sem número em produção, nenhum link `wa.me` renderizado.
- Nenhuma dependência nova, nenhuma requisição de rede, nada gravado; orçamento respeitado.

### Riscos da etapa 6

- **Número fictício vazando para produção pelo navegador** (`VERCEL_ENV` não existe no cliente) → número resolvido só no servidor e teste que barra `numeroDoWhatsApp` em arquivo client (ADR-0010).
- **Horário errado por fuso da máquina** (CI em UTC, dono em outro fuso) → `Intl` com `timeZone` explícito e testes com datas em UTC que caem em outro dia em São Paulo.
- **Erro de hidratação por relógio** → o horário só é calculado dentro do conteúdo do painel, que não vem do servidor.
- **Texto livre reconhecido de forma errada** (ex.: "não quero tinto" casando com tinto) → prioridade fixa, saúde e humano primeiro, "não entendi" sempre devolve as respostas rápidas; lista de palavras-chave revisável pelo dono (P48). Não é IA e não deve parecer: nenhuma resposta finge entender o que não entendeu.
- **Lacunas `[A DEFINIR: …]` visíveis na conversa** → é o comportamento pedido pelo `CLAUDE.md`; o site não é publicado antes da etapa 9, que não fecha com lacunas do P52 abertas.
- **Promessa "já com o resumo desta conversa"** maior do que o que entregamos → P47.
- **Tarefa 3 acima de 400 linhas** → divisão 3a/3b já prevista.
- **Orçamento do pacote global** → motor em *chunk* tardio; A.6 no cartão pode ir para o mesmo *chunk* se passar do limite.
- **Testes que dependem do roteiro estático** (lista na seção de testes) → atualizados nas tarefas 5 a 7, não removidos.

### Pendências da verificação do bloco A (etapa 6)

- **Lista de saúde (P48):** `PALAVRAS_DE_SAUDE` em `lib/roteiro.ts` é revisável pelo dono e **ampla de propósito** (inclui doença, intoxicação, mal-estar, bebê, criança, glúten, celíaco, idoso, gravidez etc.): na dúvida, a mensagem recebe a resposta de saúde, que não recomenda nada. Efeito colateral aceito: falsos positivos (ex.: "quem bebe vinho").
- **Pedido:** `pedido` no texto livre exige posse ou consulta ("meu pedido", "status", "rastreio", "onde está"), ou a palavra sozinha; "fazer um pedido de presente" é compra.
- **Corporativo:** "brinde" e "colaborador" sozinhos não levam ao corporativo; "para empresa", "funcionários" e "corporativo" bastam.
- **Etapa 9 (a):** trava de build ou teste de CI que falhe em produção se `TEXTOS_DO_ROTEIRO` tiver `[A DEFINIR`; o texto de saúde precisa de validação profissional antes de ir ao ar.
- **Decisão de produto aberta (b):** mensagem com sinal de saúde **e** pedido ou produto estragado deveria também passar para humano? Hoje saúde vence e só mostra o texto de saúde.
- **(c)** "presente sem tinto" e "tábua de frios para o presente com tinto" seguem a prioridade documentada (hoje o segundo vira `presente-tinto`).
- **(d)** Se o motor for ao servidor (IA, versão 2), validar `EstadoDaConversa` com Zod na entrada.

### Verificação do bloco B (etapa 6): correções aplicadas e pendências

**Corrigido (2026-11-03):**

- **Texto digitado não se perde:** `enviar` devolve `Promise<boolean>` e nunca rejeita (o erro vai a `console.error` só fora de produção); o `SupportPanel` limpa o campo só no sucesso e só se a pessoa não mexeu nele no meio do caminho. A fila interna segue `Promise<void>`. Testes: promessa adiada (respostas em ordem) e motor que falha (texto fica, reenvio funciona).
- **Ilustração do cartão:** limite de erro mínimo (classe, sem dependência) em volta do `Suspense`, com a mesma reserva `.miniaturaVazia`; o `import()` do gerador A.6 é pré-aquecido ao abrir o painel, junto com o motor, sem entrar no HTML inicial.
- **Marca do motor** em `scripts/medir-pacote.mjs` e `e2e/whatsapp.spec.ts`: agora o literal da §8.2 "Vou chamar um queijista da nossa equipe" (não depende de lacunas `[A DEFINIR]`). O `medir:pacote` também **falha** se o código de `CheeseIllustration` voltar ao pacote compartilhado.
- **Confirmação da sacola para leitor de tela:** `adicionar` devolve `boolean`; ao entrar a ação do assistente com sucesso, o provider acrescenta à conversa uma mensagem do assistente com **Adicionado à sacola. Boa escolha.** (dentro do `role="log"`, porque o toast fica fora do `<dialog>` modal, inerte). O toast visual continua. O e2e exige `toBeVisible()` dentro do painel. Quando o limite de unidades corta a quantidade, só o toast avisa (o texto do limite não vai ao log): se o dono quiser, a mesma regra vale para `TEXTO_LIMITE`.
- **Acessibilidade e reflow:** `tabIndex={0}` no `role="log"` rolável; aba e botão do WhatsApp com altura **mínima** de 40 px (o texto quebra a 320 px em vez de estourar) e faixa com `flex-wrap`; e2e a 320, 360 e 390 px sem corte nem rolagem horizontal. Zonas de toque de 44 px por `::after` invisível na aba e no botão verde.
- **Sem número do WhatsApp:** a faixa "Prefere falar com uma pessoa?" (texto, horário e botão) não é renderizada; o horário continua na aba Queijista.
- **Orçamento:** a folga do pacote compartilhado, da Home e de `/queijos` subiu de +1,5 para **+2,0 kB** (as correções acima somam ~0,2 kB gzip); o produto segue em +1,5 kB.
- **Segurança:** `numeroDoWhatsApp()` só roda no servidor (comentário atualizado). Busca feita após o build de produção: `5520900000000` **não aparece em `.next/static`** (aparece só no HTML/RSC do servidor, como esperado, por ser o número entregue ao provider).

**Pendências do dono (nada bloqueia a etapa):**

1. **Aviso de nova aba** ("abre em nova aba") hoje só para leitor de tela; decidir se também aparece para quem enxerga.
2. **`depoisDaAcao`:** o que dizer logo depois que a ação do assistente adiciona o queijo à sacola (texto novo; hoje só a confirmação literal da §7.5).
3. **Texto de erro do chunk:** quando o motor não carrega, o painel não mostra mensagem (o texto digitado fica no campo). Escrever o texto, se desejado.
4. **Borda do campo de mensagem:** `--pedra-clara` sobre `--cave` tem contraste ≈ 1,9:1, abaixo de 3:1 (WCAG 1.4.11). **Não alterada** (cores da spec exigem aprovação do dono).
5. **Faixa e aba sem número:** a faixa some; a aba Queijista mantém só o horário, sem botão. Confirmar se o texto da aba deve mudar nesse caso.

**Exceção de zona de toque:** as respostas rápidas (`.resposta`, 36 px) **não** ganham zona de 44 px: o espaçamento de 6 px entre linhas da spec faria as zonas se sobreporem. Têm mais de 24 px (WCAG 2.5.8 AA atendido); revisar se o dono aceitar mais respiro entre elas.

**Para a etapa 8:** dividir o contexto da conversa em dois contextos (estado e ações) e instalar `axe-core` nos testes de acessibilidade.

**Para a etapa 9 (checklist):** publicar **somente na Vercel** ou garantir `VERCEL_ENV=production` no ambiente de produção (sem ela, `numeroDoWhatsApp()` cai no número fictício); depois do build de produção, conferir que `5520900000000` não aparece em `.next/static` (`grep -r 5520900000000 .next/static`).

### Perguntas ao dono (etapa 6)

| # | Pergunta | Opções | Recomendação | Decisão do dono |
| --- | --- | --- | --- | --- |
| P44 | O que **Sugira um queijo** faz? | **A)** Faz no chat as três perguntas do quiz (textos e opções literais da §5.6), recomenda pela mesma pontuação da §10.4 e mostra o cartão com o texto aprovado no D11. **B)** Mostra direto os quatro destaques da semana (§5.4), sem perguntas. **C)** Leva para o quiz da Home e fecha o painel | **A**: reaproveita textos e regras já aprovados, sem texto novo além da transição (P52) | **Decidido em 2026-11-03: recomendação aceita** |
| P45 | Que queijos **Montar uma tábua** sugere? | **A)** Os de "casca bonita" da §10.4: Brie francês, Canastra curado e Cabra com cinzas, em três cartões. **B)** Os quatro destaques da semana. **C)** Uma lista definida pelo dono | **A**, porque já está na spec | **Decidido em 2026-11-03: recomendação aceita** |
| P46 | O que **Sim, com cartão** faz depois da sugestão do Canastra? | **A)** Põe na sacola 1 unidade do formato padrão (Peça inteira ~1 kg, R$ 136,00) marcada como presente. **B)** Põe o formato do preço do cartão (Fração ~250 g, R$ 49,00), marcada como presente. **C)** Pergunta o formato com respostas rápidas ("Peça inteira ~1 kg", "Meia peça ~500 g", "Fração ~250 g", da §9) e só então põe na sacola como presente. **D)** Não põe nada; leva à página do produto | **C**: a pessoa escolhe o que compra, e os rótulos vêm dos dados; o cartão com mensagem é escrito no checkout (§10.2) | **Decidido em 2026-11-03: recomendação aceita** |
| P47 | A passagem para humano diz "já com o resumo desta conversa". O que vai na mensagem do WhatsApp? | **A)** A mensagem da §8.3 escolhida pelo contexto: pedido nº, se a pessoa informou; produto, se houve sugestão; corporativo, se pediu para empresa; geral nos demais casos. Nada do texto digitado. **B)** A mensagem da §8.3 + um resumo com o texto digitado (formato a definir pelo dono; leva texto livre e talvez dados pessoais para a URL). **C)** Sempre a mensagem geral | **A** (ADR-0010). Se o dono achar que "resumo" promete mais do que isso, ajustar o texto da §8.2 | **Decidido em 2026-11-03: recomendação aceita** |
| P48 | O campo de mensagem aceita texto livre? | **A)** Sim, com reconhecimento por palavras-chave (lista revisável pelo dono) e "não entendi" com as respostas rápidas. **B)** Só reconhece número de pedido; qualquer outro texto recebe o "não entendi". **C)** Campo só aparece quando o roteiro pede o número do pedido (desvio da §8.2) | **A**: é o único jeito de o roteiro do protótipo (frase digitada no item 3) acontecer | **Decidido em 2026-11-03: recomendação aceita** |
| P49 | O WhatsApp abre na mesma aba ou em outra? | **A)** Outra aba (`target="_blank"`), com um texto só para leitor de tela avisando a nova aba (texto a definir pelo dono, P52). **B)** Mesma aba, sem texto novo (a sacola não se perde: está no `localStorage`) | **A**, comum em lojas e mantém o site aberto; no celular o `wa.me` abre o aplicativo de qualquer forma | **Decidido em 2026-11-03: recomendação aceita** |
| P50 | Feriados contam como cave fechada? | **A)** Não; vale só o dia da semana (a spec não cita feriados). **B)** Sim, com uma lista fixa de datas mantida pelo dono em `lib/whatsapp.ts` | **A** agora; B quando o dono quiser | **Decidido em 2026-11-03: recomendação aceita** |
| P51 | Ao fechar e reabrir o painel, a conversa continua? | **A)** Continua enquanto a aba do navegador estiver aberta (só memória; fechar a aba apaga). **B)** Recomeça a cada abertura, como hoje | **A**: fechar sem querer não faz perder a conversa, e nada é gravado | **Decidido em 2026-11-03: recomendação aceita** |
| P52 | Textos novos do assistente (a spec não os traz). Até o dono escrever, aparecem como lacuna. | Lista abaixo | O dono escreve cada um; o agente não propõe texto | **Decidido em 2026-11-03: recomendação aceita** |

**Lista do P52 (textos que o dono precisa escrever).** Cada um aparece como `[A DEFINIR: <descrição>]` até ser preenchido em `TEXTOS_DO_ROTEIRO`:

| Id | Onde aparece | Observação |
| --- | --- | --- |
| `transicao-sugestao` | Antes da primeira pergunta do quiz no chat (P44 = A) | — |
| `tabua` | Antes dos cartões da tábua (P45) | — |
| `pedido-pedir-numero` | Ao escolher **Onde está meu pedido?** | Pede o número no formato AQ-123456 |
| `pedido-numero-invalido` | Número fora do formato | — |
| `pedido-encaminhar` | Número válido: não há consulta real (pedidos simulados), então encaminha ao WhatsApp | Antes ou no lugar da mensagem de passagem da §8.2 |
| `harmonizar` | Antes da pergunta "Vai acompanhar com…" e dos cartões | — |
| `outras-opcoes` | Ao escolher **Ver outras opções** (Manchego DOP e Parmigiano Reggiano DOP, os outros curados de tinto na §10.4) | — |
| `presente-formato` | Pergunta do formato (só se P46 = C) | — |
| `depois-da-acao` | Depois de pôr na sacola, antes de novas respostas rápidas | O aviso **Adicionado à sacola. Boa escolha.** (§7.5) continua |
| `continuar` | Depois de cada sugestão, com as respostas rápidas iniciais de novo | — |
| `nao-entendi` | Texto livre sem intenção reconhecida | Devolve as três respostas rápidas iniciais |
| `saude` | Perguntas de saúde (ex.: gravidez e leite cru) | **Obrigatório** recomendar consultar um médico e não dar outra orientação (§8.2) |
| `aviso-nova-aba` | Só leitor de tela, nos links do WhatsApp (só se P49 = A) | — |

Também para o checklist da etapa 9 (não é código): configurar no WhatsApp Business a mensagem de boas-vindas literal da §8.3.

---

## Etapa 7 — Páginas restantes: Presentes, Aprenda, Produtores e 404

**Objetivo:** dar destino real a todos os links do menu, do rodapé e da Home (spec §10.5) com as páginas da §12 (`/presentes`, `/aprenda`, `/produtores` e a 404), montadas só com os componentes, tokens e espaçamentos que já existem, com os textos literais da spec e as lacunas visíveis.

**Situação: CONCLUÍDA (2026-11-05).** O dono aceitou todas as recomendações (opção A) das [perguntas P53 a P67](#perguntas-ao-dono-etapa-7). Blocos A a D publicados (ver [Commits da etapa 7](#commits-da-etapa-7)); fechamento documental na tarefa 13. O que ficou aberto está em [Pendências do dono](#pendências-do-dono-ao-fim-da-etapa-7) e na [herança para a etapa 8](#herança-da-etapa-7-para-a-etapa-8).

**Pré-requisito:** etapa 6 concluída (`a744972`, `a37640c`, `2b2922d`).

**Decisões:** [ADR-0011](adr/0011-paginas-de-conteudo-e-404.md) (**Aceito** em 2026-11-05: conteúdo em `data/`, páginas estáticas só no servidor, artigos em rota estática, sem filtros por ora, `app/not-found.tsx`, `classesDoBotao` para link externo, JSON-LD na etapa 8, sem dependência nova). Herdadas: P13 (padrão de `<title>`), D9 (texto da nota fiscal do presente), D18 (itens de Ajuda do rodapé sem link), D29 (produtor fictício), P49 (WhatsApp em nova aba), [ADR-0010](adr/0010-assistente-deterministico-e-whatsapp.md) (número só no servidor; sem número, nenhum link `wa.me`).

**Skills:** antes de cada tarefa, conferir o mapa em `SKILLS-ATELIE-DO-QUEIJO.md` (`vercel-composition-patterns` para os cartões extraídos, `vercel-react-best-practices` para manter tudo no servidor, `seo` para os metadados, `accessibility` e `web-design-guidelines` na verificação). A `vercel-react-view-transitions`, listada como opcional para a etapa 7, **fica fora**: não está na spec e soma risco sem caso de uso. A spec vence em caso de conflito.

### Estado dos links e das rotas no início da etapa 7 (histórico)

> Resolvido: as três rotas e `app/not-found.tsx` existem desde a etapa 7. A tabela abaixo descreve o ponto de partida.

No início da etapa 7, nenhuma das três rotas existia em `app/`, e não havia `app/not-found.tsx`. Todos os links abaixo levam à 404 padrão do Next, **em inglês** ("This page could not be found."), dentro do layout do site.

| Onde | Link | Destino hoje | Muda na etapa 7 |
| --- | --- | --- | --- |
| Menu principal (`components/navegacao.ts`, desktop e celular) | Presentes · Aprenda · Nossos produtores | `/presentes`, `/aprenda`, `/produtores` (404) | Nenhum código muda: as rotas passam a existir. O `aria-current` já cobre subrotas (`startsWith`), então `/aprenda/<slug>` destaca **Aprenda** |
| Rodapé, LOJA | Presentes | `/presentes` (404) | Rota passa a existir |
| Rodapé, LOJA | Presentes corporativos | `/presentes` (404) | **Muda** para `/presentes#presentes-corporativos` (âncora do bloco corporativo) |
| Rodapé, ATELIÊ | Sobre · Nossos produtores | `/produtores` (404), os dois | Rota passa a existir; os dois continuam no mesmo destino (comentário do `Footer.tsx`) |
| Rodapé, ATELIÊ | Escola do Ateliê | `/aprenda` (404) | Rota passa a existir |
| Rodapé, AJUDA | Entregas refrigeradas · Trocas e devoluções · Perguntas frequentes | Texto sem link (D18) | Nada muda |
| Home, hero | **Montar um presente** | `/presentes` (404) | Rota passa a existir |
| Home, §5.7 | **Ver todos os presentes →** | `/presentes` (404) | Rota passa a existir |
| Home, §5.8 | Os três artigos (link inteiro) | `/aprenda` (404), os três | **Muda** para `/aprenda/<slug>` de cada artigo (se P59 = A) |
| `/queijos/<slug inexistente>` | `notFound()` | 404 padrão em inglês | Passa a mostrar a 404 da §12 |
| `e2e/_apoio/console.ts` | Filtro `ROTA_AINDA_INEXISTENTE` | Ignora os 404 de *prefetch* das três rotas | **Sai** (cada rota é tirada do filtro no bloco que a cria; o filtro inteiro some no bloco D) |

### Escopo: o que entra e o que fica para depois

| Item da spec | Etapa 7 | Depois |
| --- | --- | --- |
| Topo das páginas (§12: "mesmos cabeçalhos de seção") | Padrão do topo do catálogo (§6): sobretítulo (se houver, P53) + h1 (64 px, 38 px ≤ 768 px) + parágrafo 18 px `--palha`; contêiner `padding: 64px 32px 112px` | — |
| **Presentes**: título **Para quem merece uma boa tábua.** | h1 literal, sem `<em>` (a spec não marca ênfase nesse título) | — |
| **Presentes**: kits | Os três kits da §5.7 (**Primeira Degustação**, **Volta ao Mundo**, **Grande Cave**) com o mesmo cartão da Home, preço **R$ [PREÇO]**, sem botão (P55) | Mais kits, preços e página de kit quando o dono definir |
| **Presentes**: filtros Ocasião · Faixa de preço · Tamanho (2 a 7 queijos) | Conforme P54 (recomendação: nenhum visível agora, desvio registrado na §14) | Com dados de ocasião e preço, no padrão do catálogo (`?parametro=` no servidor) |
| **Presentes**: "Em todo kit: …" | Bloco com os quatro itens, conforme P56 | — |
| **Presentes**: bloco corporativo + **Pedir orçamento** | Texto literal com a lacuna **[n]**; **Pedir orçamento** = `LinkDoWhatsApp` com `{ tipo: 'corporativo' }` (mensagem **Olá! Quero um orçamento de presentes para empresa.**), nova aba (P49); aparência conforme P57; sem número, conforme P58 | — |
| **Aprenda**: título **Escola do Ateliê** e categorias | h1 literal; categorias **Primeiros passos · Harmonização · Servir e guardar · Regiões e produtores** conforme P61 | — |
| **Aprenda**: artigos | Os três da §5.8, com o cartão da Home; página de artigo conforme P59 (corpo `[TEXTO DO ARTIGO]`) | Textos reais; MDX só com ADR, se os textos forem longos |
| **Aprenda**: "Cada artigo termina com os queijos citados" (`ProductCard`) | Conforme P60 (recomendação: lacuna até o dono escolher) | — |
| **Produtores**: título **Quem faz o queijo importa.** e texto | h1 e parágrafo literais | — |
| **Produtores**: grade (foto, nome, região, "desde [ano]", link para os queijos) | Conforme P62 e P63 (recomendação: só o produtor do Canastra, fictício pelo D29, com link para o queijo) | Demais produtores quando o dono informar; página de produtor |
| **404**: **Esta página foi maturar em outro lugar.** + **Volta para a cave** (→ `/`) | `app/not-found.tsx` para URLs sem rota e para `notFound()`; status 404; `noindex` automático do Next; conforme P64 e P65 | — |
| §7.4 Abaixo da dobra do produto (P10 dizia "rever na etapa 7") | Conforme P67 (recomendação: continua fora) | Quando houver produtos de acompanhamento e avaliações reais |
| SEO: `<title>` e description | `metadata` por página, conforme P66 | — |
| SEO: JSON-LD, sitemap, `metadataBase`, canônicas | **Fora** (ADR-0011, decisão 8): nenhum tipo teria dados verdadeiros hoje | Etapa 8 (`performance-e-seo`) |
| Fotos reais | `PhotoPlaceholder` com `[FOTO: …]` (220 px nos kits, 200 px nos artigos, 240 px nos produtores) | `next/image` quando houver fotos |

**Fora, por regra do projeto:** nenhuma dependência nova, nenhuma variável de ambiente nova, nenhum Client Component novo, nenhuma requisição de rede, nada gravado.

### Contratos

#### `data/kits.ts` (sai de `app/_home/Presentes.tsx`)

```ts
import type { Centavos } from '@/lib/dinheiro';

export type IdDoKit = 'primeira-degustacao' | 'volta-ao-mundo' | 'grande-cave';

export interface Kit {
  id: IdDoKit;                 // chave estável (React key, âncora, futura sacola)
  nome: string;                // §5.7, literal
  descricao: string;           // §5.7, literal
  /** null = lacuna "R$ [PREÇO]". Nunca 0. Nada com preço null vai para a sacola (etapa 4). */
  preco: Centavos | null;
}

export const KITS: readonly Kit[];   // ordem da §5.7
```

- Se P54 for B ou C, o tipo ganha só o campo que o filtro escolhido usar (`quantidadeDeQueijos: 3 | 5 | 7`, `ocasioes`); nada antecipado.

#### `data/artigos.ts` (sai de `app/_home/Escola.tsx`)

```ts
import type { SlugDoQueijo } from './cheeses';

export type CategoriaDoArtigo = 'primeiros-passos' | 'harmonizacao' | 'servir-e-guardar' | 'regioes-e-produtores';

/** Ordem e nomes literais da §12. O sobretítulo em MAIÚSCULAS vem do CSS do Overline. */
export const CATEGORIAS: readonly { id: CategoriaDoArtigo; nome: string }[];

export type SlugDoArtigo = 'como-montar-uma-tabua-de-queijos' | 'queijo-e-vinho' | 'como-guardar-queijo-na-geladeira';

export interface Artigo {
  slug: SlugDoArtigo;
  titulo: string;                          // §5.8, literal
  categoria: CategoriaDoArtigo;
  foto: string;                            // descrição do [FOTO: …] da §5.8
  /** null = lacuna "[TEXTO DO ARTIGO]". */
  corpo: readonly string[] | null;
  /** null = lacuna (P60). Lista não vazia quando o dono definir; o tipo impede slug fora do catálogo. */
  queijosCitados: readonly [SlugDoQueijo, ...SlugDoQueijo[]] | null;
}

export const ARTIGOS: readonly Artigo[];   // ordem da §5.8
export function obterArtigo(slug: string): Artigo | undefined;
```

- Os slugs dos artigos são técnicos (sem acento, a partir dos títulos da §5.8) e podem mudar sem afetar texto visível.

#### `data/produtores.ts`

```ts
import type { SlugDoQueijo } from './cheeses';

export interface Produtor {
  id: string;
  nome: string;          // igual ao `detalhe.produtor` dos queijos dele (teste de consistência)
  regiao: string;        // texto visível, ex.: "Serra da Canastra, MG" (P62)
  /** Texto do ano, sem o "desde": o componente monta "desde {ano}". Lacuna: "[ano]". */
  desde: string;
  foto: string;          // descrição do [FOTO: …]
  queijos: readonly [SlugDoQueijo, ...SlugDoQueijo[]];
}

export const PRODUTORES: readonly Produtor[];
```

- Nome e ano do Canastra vêm de `PRODUTOR_CANASTRA_FICTICIO` e `ANO_PRODUTOR_CANASTRA_FICTICIO` (`data/ficticio.ts`), nunca copiados: a troca dos dados fictícios continua num lugar só.

#### Componentes compartilhados (Server Components)

```ts
/** Topo de página (§6 e §12): sobretítulo opcional, h1 e parágrafo. O catálogo passa a usá-lo, sem mudança visual. */
export function CabecalhoDePagina(props: {
  sobretitulo?: string; titulo: ReactNode; paragrafo?: string; idDoTitulo?: string;
}): JSX.Element;

/** Cartão de kit da §5.7 (foto 220, h 28/600, texto 14 `--palha`, preço 600 `--ouro`). */
export function CartaoDeKit(props: { kit: Kit; nivelDoTitulo: 'h2' | 'h3' }): JSX.Element;

/** Item da Escola (§5.8): link inteiro com foto 200, sobretítulo `--mofo` e título 26/600. */
export function CartaoDeArtigo(props: { artigo: Artigo; href: string; nivelDoTitulo: 'h2' | 'h3' }): JSX.Element;

/** Trilha genérica (sai de app/queijos/[slug]/_produto/Trilha.tsx); o produto passa a montá-la com os mesmos itens. */
export function Trilha(props: { itens: readonly { href: string; texto: string }[]; atual: string }): JSX.Element;
```

- `components/Button.tsx` passa a exportar `classesDoBotao(opcoes: { variante: 'principal' | 'secundario' | 'contorno' | 'link'; tamanho?: 'padrao' | 'compacto' }): string`, usada pelo `Button` e pelo `className` do `LinkDoWhatsApp` em **Pedir orçamento**. O `Button` em si não muda de comportamento.
- `nivelDoTitulo`: na Home os cartões ficam sob um h2 de seção (h3); nas páginas novas, conforme a hierarquia de cada uma (ver Acessibilidade).
- `CabecalhoDeSecao` continua em `app/_home/` (só a Home usa).

#### `components/FocoNoConteudo.tsx` (ajuste)

- Ao navegar para uma URL com `#âncora` (ex.: **Presentes corporativos** do rodapé), o foco vai para o elemento da âncora (com `tabIndex={-1}`) em vez de `#conteudo`, e a página rola até ele. Sem âncora, o comportamento atual não muda.

#### Rotas

| Arquivo | Renderização | Metadados |
| --- | --- | --- |
| `app/presentes/page.tsx` (+ `_presentes/BlocoCorporativo.tsx`) | Estática | `metadata` (P66) |
| `app/aprenda/page.tsx` | Estática | `metadata` (P66) |
| `app/aprenda/[slug]/page.tsx` (se P59 = A) | Estática: `generateStaticParams` de `ARTIGOS`, `dynamicParams = false`; slug desconhecido → 404 | `generateMetadata`: título do artigo (P66) |
| `app/produtores/page.tsx` | Estática | `metadata` (P66) |
| `app/not-found.tsx` | Server Component, no layout raiz (com cabeçalho, rodapé e botão de atendimento) | `metadata` com o título do P64; `noindex` injetado pelo Next |

### Fronteiras Server/Client

| Peça | Tipo | Motivo |
| --- | --- | --- |
| As quatro páginas, `BlocoCorporativo`, `CabecalhoDePagina`, `CartaoDeKit`, `CartaoDeArtigo`, `Trilha` | Server | Só texto e links |
| `LinkDoWhatsApp` em **Pedir orçamento** | Client (já existe, já no pacote compartilhado pelo painel) | Lê o número do provider (ADR-0010) |
| `ProductCard` → `BotaoAdicionar` nos queijos citados e na página de produtores (se houver cartões) | Client (já existe) | Sacola |
| `FocoNoConteudo` | Client (já existe; ajuste da âncora) | Foco após navegação |

Orçamento: **nenhum kB novo** no pacote compartilhado; o JavaScript inicial de cada rota nova é igual ao compartilhado (as rotas não importam nada client que o layout já não importe). Medido com `npm run medir:pacote`; a linha de base muda só porque a interseção passa a incluir as rotas novas.

### Acessibilidade

- **Um h1 por página**, o primeiro conteúdo de `<main>`; o `FocoNoConteudo` já leva o foco a `#conteudo` após a navegação.
- **Hierarquia sem saltos:** Presentes: h1 → h2 de cada kit (`CartaoDeKit` com `nivelDoTitulo="h2"`) → h2 **Em todo kit** (P56) → h2 do bloco corporativo (P57). Aprenda: h1 → h2 de cada categoria (P61) → h3 dos artigos. Artigo: h1 → h2 da seção de queijos citados → h3 dos `ProductCard`. Produtores: h1 → h2 de cada produtor. 404: só o h1.
- **Seções com `aria-labelledby`** apontando para o próprio h2; grades em `<ul>`; cada cartão em `<article>`.
- **Link inteiro do artigo:** o nome acessível é o sobretítulo + o título (como na Home); a foto é `decorativa`.
- **Pedir orçamento:** `<a>` real com o aviso de nova aba do `LinkDoWhatsApp` (P49); alvo ≥ 44 px; foco dourado visível sobre o fundo do bloco.
- **Âncora do corporativo:** o foco vai para o bloco ao chegar por `#presentes-corporativos` (teste e2e com teclado).
- **Lacunas** (`[n]`, `R$ [PREÇO]`, `[TEXTO DO ARTIGO]`, `[A DEFINIR: …]`) são texto comum, lido pelo leitor de tela; nenhuma usa `--placeholder` como cor de texto importante (§13).
- **Trilha do artigo** com `aria-current="page"` no item atual (igual ao produto).
- **Reflow:** sem rolagem horizontal de 320 a 1920 px; o bloco corporativo quebra em coluna no celular.

### Testes

- **Unidade (`data/`):** `KITS` com os nomes, descrições literais da §5.7 e `preco === null`; `ARTIGOS` com títulos e categorias literais da §5.8, slugs únicos, `obterArtigo`; `CATEGORIAS` na ordem da §12; `PRODUTORES` com queijos que existem em `QUEIJOS`, `nome` igual ao `detalhe.produtor` de cada queijo e ano vindo de `data/ficticio.ts`.
- **Componente:** `CabecalhoDePagina` (com e sem sobretítulo); `CartaoDeKit` mostra **R$ [PREÇO]** e não tem botão; `CartaoDeArtigo` tem `href` e nome acessível; `Trilha` genérica (os testes do produto continuam passando sem mudança); `BlocoCorporativo` com número: `href` decodificado igual a `https://wa.me/5520900000000?text=Olá! Quero um orçamento de presentes para empresa.`, `target="_blank"` e aviso; com `numeroDoWhatsApp={null}`: nenhum `wa.me` e o texto conforme P58; `classesDoBotao` igual às classes do `Button` da mesma variante; `FocoNoConteudo` com âncora.
- **E2E (Playwright), por rota nova:** status 200; `<title>` conforme P66; h1 literal; sem rolagem horizontal a 320, 360, 390, 768, 1440 e 1920 px; console limpo **sem** o filtro de `ROTA_AINDA_INEXISTENTE`; `aria-current="page"` no item certo do menu; documento sem `id` duplicado.
- **E2E da 404:** `/nao-existe`, `/queijos/nao-existe` e `/aprenda/nao-existe` (se P59 = A) respondem **404**, mostram **Esta página foi maturar em outro lugar.** e `meta[name="robots"]` com `noindex`; **Volta para a cave** leva a `/`. O teste atual `e2e/produto.spec.ts:7` (slug inexistente → 404) continua e passa a conferir o texto.
- **E2E de navegação:** clicar em cada link do menu, do rodapé e da Home citados na tabela de estado leva a uma página com h1 (nenhum 404); **Presentes corporativos** com teclado deixa o foco no bloco corporativo; **Pedir orçamento** abre `wa.me` com a mensagem corporativa (sem navegar de fato).
- **Home sem regressão:** os testes atuais de `e2e/home.spec.ts` (inclusive o de `/presentes` na linha 121) passam sem mudança, exceto o destino dos artigos da Escola (se P59 = A).

### Tarefas

Cada tarefa termina com `lint`, `typecheck`, `format:check`, `test`, `modelos:validar`, `build` e `test:e2e` passando. Estimativa de linhas entre parênteses.

**Bloco A — Base compartilhada e 404 (commit 1)**

1. **[frontend-nextjs] Dados: `data/kits.ts`, `data/artigos.ts`, `data/produtores.ts`** (~250 com testes)
   - Contratos acima, com os textos literais e as lacunas; a Home passa a ler `KITS` e `ARTIGOS` (sem mudança visual nem de link ainda).
   - **Pronto quando:** os testes de unidade de `data/` da seção de testes passam; `app/_home/Presentes.tsx` e `app/_home/Escola.tsx` não têm mais constantes de conteúdo; `e2e/home.spec.ts` passa sem mudança.

2. **[frontend-nextjs] Componentes compartilhados** (~300 com testes)
   - `CabecalhoDePagina` (o catálogo passa a usá-lo), `CartaoDeKit` e `CartaoDeArtigo` (a Home passa a usá-los), `Trilha` genérica (o produto passa a usá-la), `classesDoBotao`.
   - **Pronto quando:** testes de componente passam; `e2e/home.spec.ts`, `e2e/catalogo.spec.ts` e `e2e/produto.spec.ts` passam sem mudança; o `guardiao-do-design` confirma Home, catálogo e produto idênticos a 1440 e 390 px.

3. **[frontend-nextjs] `app/not-found.tsx`** (~120 com testes) — **depende de P64 e P65**
   - Topo no padrão do P64, h1 literal e **Volta para a cave** (botão principal) para o destino do P65.
   - **Pronto quando:** os e2e da 404 passam (status 404, texto, `noindex`, botão); a 404 padrão em inglês não aparece em nenhuma URL.

4. **Verificação do bloco A:** `guardiao-do-design` (Home, catálogo e produto sem diferença; 404 a 1440 e 390 px), `especialista-em-acessibilidade` (404: h1, foco, botão), `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(paginas): extrai os dados de kits e artigos e adiciona a página 404`.

**Bloco B — Presentes (commit 2)**

5. **[frontend-nextjs] `app/presentes/page.tsx`** (~250 com testes) — **depende de P53 a P56 e P66**
   - Topo (P53), kits com `CartaoDeKit` (P55), filtros conforme P54, bloco **Em todo kit** (P56), metadados (P66). Tirar `presentes` de `ROTA_AINDA_INEXISTENTE`.
   - **Pronto quando:** e2e da rota passa (status, título, h1 **Para quem merece uma boa tábua.**, três kits com **R$ [PREÇO]**, sem rolagem horizontal); textos idênticos à §12 e à §5.7.

6. **[frontend-nextjs] Bloco corporativo e âncora** (~200 com testes) — **depende de P57 e P58**
   - `BlocoCorporativo` com `id="presentes-corporativos"`, texto literal com **[n]**, **Pedir orçamento** como `LinkDoWhatsApp` com `{ tipo: 'corporativo' }` e `classesDoBotao` (P57), comportamento sem número (P58); `Footer.tsx`: **Presentes corporativos** → `/presentes#presentes-corporativos`; `FocoNoConteudo` com âncora.
   - **Pronto quando:** o `href` decodificado de **Pedir orçamento** é `https://wa.me/5520900000000?text=Olá! Quero um orçamento de presentes para empresa.`; com o provider recebendo `null`, não há `wa.me` na página; o e2e com teclado a partir do rodapé deixa o foco no bloco; nenhum verde do WhatsApp fora do que a §3.1 permite.

7. **Verificação do bloco B, em paralelo:** `guardiao-do-design` (1440 e 390 px; um principal por bloco; verde só onde a §3.1 permite), `especialista-em-acessibilidade` (hierarquia, link externo, âncora), `auditor-de-seguranca` (link externo: `rel`, nada digitado na URL, número só no servidor), `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(presentes): adiciona a página de presentes com o pedido de orçamento`.

**Bloco C — Aprenda (commit 3)**

8. **[frontend-nextjs] `app/aprenda/page.tsx`** (~200 com testes) — **depende de P53, P61 e P66**
   - Topo (P53), categorias (P61) e grade da §5.8 com `CartaoDeArtigo`; metadados. Tirar `aprenda` de `ROTA_AINDA_INEXISTENTE`.
   - **Pronto quando:** e2e da rota passa; as quatro categorias da §12 aparecem na ordem e com o comportamento do P61; os três títulos da §5.8 são literais.

9. **[frontend-nextjs] `app/aprenda/[slug]/page.tsx` e links da Home** (~250 com testes) — **depende de P59, P60 e P66**
   - `Trilha` (Início / Aprenda / título), sobretítulo da categoria, h1, `PhotoPlaceholder` 200 px de artigo, corpo ou **[TEXTO DO ARTIGO]**, seção de queijos citados com `ProductCard` (contexto `catalogo`) ou a lacuna do P60; `generateMetadata`; os três itens da Escola na Home e na `/aprenda` passam a apontar para `/aprenda/<slug>`.
   - **Pronto quando:** os três artigos respondem 200 e `/aprenda/nao-existe` responde 404; cada link da Escola na Home leva ao artigo certo; `aria-current` em **Aprenda** dentro do artigo.

10. **Verificação do bloco C, em paralelo:** `guardiao-do-design`, `especialista-em-acessibilidade` (hierarquia h1 → h2 → h3, trilha, links inteiros), `testes-e-qualidade` → `revisor-de-codigo` → commit `feat(aprenda): adiciona a escola do ateliê e as páginas de artigo`.

**Bloco D — Produtores e fechamento das rotas (commit 4)**

11. **[frontend-nextjs] `app/produtores/page.tsx`** (~200 com testes) — **depende de P53, P62, P63 e P66**
   - h1 e texto literais da §12; grade de produtores (P62) com foto, nome, região, **desde {ano}** e link para os queijos (P63); metadados. Remover `ROTA_AINDA_INEXISTENTE` inteiro de `e2e/_apoio/console.ts`.
   - **Pronto quando:** e2e da rota passa; **Sobre** e **Nossos produtores** do rodapé chegam a ela; o link do produtor leva à página do queijo; nenhum filtro de 404 sobra no apoio do e2e.

12. **Verificação do bloco D e da etapa, em paralelo:** `guardiao-do-design`, `especialista-em-acessibilidade`, `performance-e-seo` (metadados das quatro páginas, `npm run medir:pacote` sem kB novo, rotas estáticas no `next build`), `testes-e-qualidade` (e2e de navegação de todos os links da tabela de estado) → `revisor-de-codigo` → commit `feat(produtores): adiciona a página de produtores`.

**Fechamento**

13. **[documentador-tecnico] Fechamento da etapa 7**
   - `docs/conteudo.md`: como editar kits, artigos (corpo e queijos citados), categorias e produtores, e onde estão as lacunas; CHANGELOG e README; neste plano: situação da etapa, desvios para o checklist da §14 (filtros de Presentes, se P54 = A; textos novos aprovados nos P53 a P66) e a lista de testes que citam dados fictícios (agora também `/produtores`) para a etapa 9.
   - **Pronto quando:** commit `docs: fecha a etapa 7` publicado.

### Commits da etapa 7

| Bloco | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| Docs | Este detalhamento e o ADR-0011 | `docs: detalha a etapa 7 e registra o ADR-0011` | Publicado (`4e94cd4`) |
| A | Tarefas 1 a 4 | `feat(paginas): extrai os dados de kits e artigos e adiciona a página 404` | Publicado (`0589676`) |
| B | Tarefas 5 a 7 | `feat(presentes): adiciona a página de presentes com o pedido de orçamento` | Publicado (`eca43a5`; o hash foi registrado em `6791989`) |
| C | Tarefas 8 a 10 | `feat(aprenda): adiciona a escola do ateliê e as páginas de artigo` | Publicado (`7602c3d`; o hash foi registrado em `22a508a`) |
| D | Tarefas 11 e 12 | `feat(produtores): adiciona a página de produtores` | Publicado (`c5b514e`) |
| Docs | Registros dos hashes dos blocos B e C | `docs: registra o hash do bloco B da etapa 7` (`6791989`), `docs: registra o hash do bloco C da etapa 7` (`22a508a`) | Publicado |
| Docs | Tarefa 13 | `docs: fecha a etapa 7` | A fazer (commit feito pela sessão principal) |

### Critérios de pronto da etapa 7

- [x] §12 atendida com os textos literais e as lacunas visíveis (`[n]`, `R$ [PREÇO]` e as do P53 a P63, conforme as respostas).
- [x] §10.5: todos os links do menu, do rodapé e da Home levam a uma página com h1; nenhum leva à 404.
- [x] Item "Textos idênticos" da §14 conferido nas quatro páginas; desvios aprovados registrados para o checklist (ver [Desvios para a §14](#desvios-para-o-checklist-da-14-etapa-7)).
- [x] Item "Sem rolagem horizontal de 360 px a 1920 px" da §14 vale também para as rotas novas.
- [x] URL sem rota, produto e artigo inexistentes respondem 404 com a página da §12 e `noindex`.
- [x] **Pedir orçamento** abre o WhatsApp com a mensagem corporativa; sem número, nenhum `wa.me`.
- [x] Nenhuma dependência nova, nenhum Client Component novo, nenhum kB novo no pacote compartilhado; filtro `ROTA_AINDA_INEXISTENTE` removido. (Observação: a folga de JavaScript da Home ficou em **zero**; `FocoNoConteudo`, que já era Client Component, foi enxugado para caber.)

### Riscos da etapa 7

- **Páginas sem protótipo** (desvio visual por invenção) → só padrões existentes (topo do catálogo, cartões da Home, caixa de ajuda do catálogo); todo valor novo vira pergunta (P53 a P67); o `guardiao-do-design` confere contra tokens e padrões, não contra imagem.
- **Páginas quase vazias por causa das lacunas** → comportamento pedido pelo `CLAUDE.md`; o site não é publicado antes da etapa 9.
- **Regressão na Home, no catálogo ou no produto** com a extração dos cartões, do cabeçalho e da trilha → bloco A sem mudança visual, coberto pelos e2e atuais e pelo `guardiao-do-design`.
- **Âncora do corporativo brigando com o `FocoNoConteudo`** (foco em `#conteudo` e rolagem ao topo) → ajuste do `FocoNoConteudo` e e2e com teclado (tarefa 6).
- **Status 200 na 404** (se a 404 for servida depois do início do *streaming*) → páginas estáticas e `notFound()` antes de qualquer renderização; e2e confere o status nas três URLs.
- **Dados fictícios do produtor em mais uma página** → continuam vindo de `data/ficticio.ts`, sob a trava `DADOS_FICTICIOS_ATIVOS`; os testes novos que citam esses valores entram na lista da etapa 9.
- **`[n]` do bloco corporativo** não foi coberto pelos fictícios (D26 a D30) → continua como lacuna visível (P57).
- **`medir:pacote` mudando a linha de base** porque a interseção inclui rotas novas → registrar a nova linha de base no fechamento; o critério é "nenhum kB novo por rota", não o número absoluto.

### Perguntas ao dono (etapa 7)

| # | Pergunta | Opções | Recomendação | Decisão do dono |
| --- | --- | --- | --- | --- |
| P53 | A §12 dá só o título de Presentes e de Aprenda (e o texto de Produtores). O que vai no sobretítulo e no parágrafo do topo? | **A)** Só textos que já existem na spec: Presentes com sobretítulo **PRESENTES** e o parágrafo da §5.7 (**Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão.**); Aprenda sem sobretítulo e com o parágrafo **O jeito certo de servir, guardar e harmonizar.** (h2 da §5.8); Produtores sem sobretítulo e com o texto da §12. **B)** Sobretítulo em todas, com lacuna `[A DEFINIR: sobretítulo]` onde a spec não tem. **C)** O dono escreve os textos | **A**: nenhum texto novo, e o topo segue o padrão do catálogo | **A** (aceita a recomendação, 2026-11-05) |
| P54 | Filtros de Presentes (Ocasião · Faixa de preço · Tamanho). Hoje há três kits, todos com **R$ [PREÇO]** e sem ocasião definida | **A)** Nenhum filtro visível agora, como os "filtros previstos para quando o catálogo crescer" da §6; desvio registrado na §14. **B)** Só **Tamanho** (3, 5 e 7 queijos, tirados das descrições), em chips no padrão do catálogo, com `?tamanho=` na URL. **C)** Os três, com as ocasiões de cada kit definidas pelo dono e o filtro de preço oculto enquanto houver `[PREÇO]` | **A**: com três kits, um filtro não ajuda e o de preço seria falso. B ou C quando houver mais kits | **A** (aceita a recomendação, 2026-11-05) |
| P55 | Os kits têm botão ou página própria? (o mapa do site cita "Kit (cartão, data)") | **A)** Cartão igual ao da Home, sem botão e sem página de kit (preço `null` não pode ir para a sacola, regra da etapa 4). **B)** Página `/presentes/[kit]` com lacunas. **C)** Botão por kit que abre o WhatsApp (texto e mensagem novos, fora da §8.3) | **A**: não há preço nem conteúdo para a página; o pedido de presente corporativo já tem caminho | **A** (aceita a recomendação, 2026-11-05) |
| P56 | Como mostrar "Em todo kit: embalagem de presente, cartão com mensagem (até 200 caracteres), data de entrega escolhida, nota fiscal sem valor visível ao presenteado."? | **A)** Bloco com h2 **Em todo kit** e lista de quatro itens, iniciais maiúsculas: **Embalagem de presente** · **Cartão com mensagem (até 200 caracteres)** · **Data de entrega escolhida** · **Nota fiscal sem valor visível ao presenteado.** (texto do D9), em grade no padrão da faixa de confiança da Home, sem ícones. **B)** A frase literal da §12 como um parágrafo abaixo do topo. **C)** Faixa de confiança com ícones (só **presente** existe na §4.10; os outros seriam ícones novos) | **A**: legível, sem ícone novo, e o item 4 já foi aprovado no D9 | **A** (aceita a recomendação, 2026-11-05) |
| P57 | Aparência do bloco corporativo e de **Pedir orçamento** | **A)** Caixa no padrão da caixa de ajuda do catálogo (§6: `--cave-quiz`, borda `--pedra`, raio 12, `padding: 28px 32px`): h2 Cormorant 26/600 **Presentes para equipes e clientes.**, texto 15 px `--palha` **Pedidos a partir de [n] kits com personalização.** e **Pedir orçamento** como botão principal dourado (altura 48), sem verde (a §3.1 só permite o verde no ícone e no botão **Falar com um queijista**). **B)** Igual, mas com botão secundário e ícone conversa em traço `--whatsapp`, como **Fale com um queijista** do produto. **C)** Caixa com borda `--ouro` (padrão do quiz) | **A**: um principal por bloco, nenhuma cor nova. O **[n]** continua lacuna (não entrou nos fictícios) | **A** (aceita a recomendação, 2026-11-05) |
| P58 | Sem número do WhatsApp em produção, o que o bloco corporativo mostra? | **A)** Só o texto, sem botão (mesma regra do **Fale com um queijista**, que some). **B)** **Pedir orçamento** abre o painel de atendimento no lugar do WhatsApp. **C)** O bloco inteiro some | **A**: coerente com a etapa 6; produção sem número é erro de configuração que a etapa 9 vai travar | **A** (aceita a recomendação, 2026-11-05) |
| P59 | Os três artigos da §5.8 ganham página própria? | **A)** Sim, `/aprenda/<slug>` estática, com trilha, categoria, título, foto `[FOTO: …]`, corpo **[TEXTO DO ARTIGO]** e queijos citados (P60); os links da Escola na Home passam a levar ao artigo. **B)** Não: só a listagem, e os itens continuam levando a `/aprenda` até haver texto | **A**: a §12 diz que cada artigo termina com os queijos citados, e o link da Home deixa de levar a uma página genérica | **A** (aceita a recomendação, 2026-11-05) |
| P60 | Quais queijos cada artigo cita, e qual o título da seção? | **A)** O dono define; até lá, a seção mostra **[A DEFINIR: queijos citados]**. Título da seção: **Queijos citados** (palavras da §12). **B)** O arquiteto propõe a partir da §10.4 (tábua: Brie, Canastra curado, Cabra com cinzas; vinho: Canastra curado, Manchego, Parmigiano, Brie, Cabra com cinzas; guardar: nenhum) e o dono confirma | **A**: "citados" depende do texto do artigo, que ainda não existe | **A** (aceita a recomendação, 2026-11-05) |
| P61 | Como mostrar as quatro categorias em `/aprenda`? (só três têm artigo; **Regiões e produtores** está vazia) | **A)** Uma seção por categoria, na ordem da §12, com h2 = nome da categoria e a grade da §5.8; a categoria vazia mostra **[A DEFINIR: artigos]**. **B)** Chips de filtro `?categoria=` no padrão do catálogo (exige texto novo para "nenhum artigo"). **C)** Grade única com a categoria no sobretítulo de cada artigo, como na Home, sem mostrar a categoria vazia | **A**: mostra todas as categorias da spec sem filtro nem texto de "nenhum resultado" | **A** (aceita a recomendação, 2026-11-05) |
| P62 | Quem entra na grade de produtores? | **A)** Só o produtor do Canastra curado, com os dados fictícios do D29: **Queijaria Produtor Exemplo**, região **Serra da Canastra, MG**, **desde 1985**, foto `[FOTO: produtor na câmara de maturação, Serra da Canastra]` (texto da §5.5); os demais entram quando o dono informar. **B)** Um cartão por queijo brasileiro, com `[NOME DO PRODUTOR]`, `[REGIÃO]` e **desde [ano]** (supõe um produtor por queijo). **C)** Também as queijarias dos importados | **A**: nada inventado além do que o D29 já aprovou; B criaria seis cartões de lacuna com uma suposição | **A** (aceita a recomendação, 2026-11-05) |
| P63 | Como é o "link para os queijos dele"? | **A)** O nome de cada queijo do produtor como link sublinhado com " →" para `/queijos/<slug>` (ex.: **Canastra curado →**), sem texto novo e sem página de produtor. **B)** Página `/produtores/<id>` com os `ProductCard` dos queijos dele (o mapa do site cita "Produtor (seus queijos)"). **C)** Link **Ver os queijos →** (texto novo) para a página do produtor | **A** agora; B quando houver mais produtores e textos | **A** (aceita a recomendação, 2026-11-05) |
| P64 | Aparência e `<title>` da 404 | **A)** Topo no padrão do catálogo (alinhado à esquerda, h1 64 px), **Volta para a cave** como botão principal sem seta, `margin-top: 40px` (padrão dos botões do hero); `<title>` **Esta página foi maturar em outro lugar. — Ateliê do Queijo**. **B)** Mesmo layout, com `<title>` **Página não encontrada — Ateliê do Queijo** (texto novo). **C)** Conteúdo centralizado | **A**: sem texto novo e com o padrão de página já usado | **A** (aceita a recomendação, 2026-11-05) |
| P65 | **Volta para a cave** leva a `/` (literal da §12), mas no resto do site "a cave" é o catálogo (**Explorar a cave** → `/queijos`; h1 **A cave**) | **A)** `/`, como diz a §12. **B)** `/queijos` | **A**: a spec é explícita; B só se o dono quiser corrigir a spec | **A** (aceita a recomendação, 2026-11-05) |
| P66 | `<title>` e description das páginas novas | **A)** Títulos no padrão do P13 (rótulo do menu): **Presentes**, **Aprenda**, **Nossos produtores** e, nos artigos, o título do artigo (todos com " — Ateliê do Queijo"); descriptions com textos da spec: Presentes = parágrafo da §5.7, Aprenda = **O jeito certo de servir, guardar e harmonizar.**, Produtores = texto da §12 (≈ 230 caracteres; os buscadores cortam por volta de 155), artigos sem description própria (vale a do layout) até haver corpo. **B)** Títulos = h1 de cada página (**Para quem merece uma boa tábua.**, **Escola do Ateliê**, **Quem faz o queijo importa.**). **C)** O dono escreve títulos e descriptions | **A**: segue o P13 e não cria texto | **A** (aceita a recomendação, 2026-11-05) |
| P67 | A §7.4 (Combina com este queijo, Avaliações, Outros queijos da mesma região) estava marcada no P10 para "rever na etapa 7". Entra agora? | **A)** Continua fora: mel e tábua não existem no catálogo, avaliações só reais, e "mesma região" hoje só liga os dois Canastras. **B)** Só **Outros queijos da mesma região**, com `ProductCard`, quando houver ao menos um outro queijo da região (hoje só nos dois Canastras) | **A**: fora do escopo da §12; volta quando o catálogo crescer | **A** (aceita a recomendação, 2026-11-05) |

### Pendências do dono ao fim da etapa 7

Nada abaixo bloqueia a etapa 8. Os textos seguem visíveis como lacuna, conforme o `CLAUDE.md`.

| Assunto | Situação | Quem decide |
| --- | --- | --- |
| Topo de `/presentes`: **128 px** (a §5.7 fala em 128 px de respiro) ou **64 px** (padrão do catálogo, usado hoje) | Hoje 64 px, para manter o padrão das páginas de topo. Aguarda decisão | Dono |
| Textos `[A DEFINIR: …]` | `[A DEFINIR: artigos]` (categoria **Regiões e produtores**, vazia) e `[A DEFINIR: queijos citados]` (P60) em `/aprenda` e nos artigos | Dono |
| `[TEXTO DO ARTIGO]` | Corpo dos três artigos (`data/artigos.ts`, campo `corpo`) | Dono |
| `[n]` | Quantidade mínima de kits do bloco corporativo (**Pedidos a partir de [n] kits com personalização.**); não entrou nos dados fictícios | Dono |
| `R$ [PREÇO]` | Preço dos três kits (`data/kits.ts`, campo `preco`) | Dono |
| Queijos citados de cada artigo | Campo `queijosCitados` de `data/artigos.ts` (sugestão do P60, opção B, se o dono quiser: tábua = Brie, Canastra curado, Cabra com cinzas; vinho = Canastra curado, Manchego, Parmigiano, Brie, Cabra com cinzas) | Dono |
| Foto do produtor em `/produtores` | Está sem raio e sem borda (a §5.5 não define para essa foto). Decisão visual pendente | Dono |
| Produtor fictício | **Queijaria Produtor Exemplo**, **desde 1985** (D29): trocar em `data/ficticio.ts` antes da publicação | Dono |
| Descrição de `/produtores` | O texto da §12 tem cerca de 230 caracteres; os buscadores cortam por volta de 155. Uma descrição própria depende de texto aprovado | Dono |

### Desvios para o checklist da §14 (etapa 7)

- **P54 (sem filtros em Presentes):** a §12 lista os filtros Ocasião, Faixa de preço e Tamanho; o dono aceitou não mostrar filtro algum enquanto houver só três kits, todos com **R$ [PREÇO]**. **Registrar na §14** no fim do projeto. Os filtros voltam com mais kits ou com a decisão do dono (opções B e C do P54).
- **P55:** os kits não têm botão nem página própria (cartão igual ao da Home).
- **P63:** sem página de produtor; o link leva ao queijo (`/queijos/<slug>`).
- **P67:** a §7.4 (Combina com este queijo, Avaliações, Outros queijos da mesma região) continua fora.
- **Testes que citam dados fictícios** (para a etapa 9, junto dos demais): `e2e/produto.spec.ts` cita o produtor e o ano fictícios (conferir também os testes de `/produtores`, que leem `data/produtores.ts`); os testes do bloco corporativo (`app/presentes/page.test.tsx`, `e2e/presentes.spec.ts`) citam o número `5520900000000`.

### Herança da etapa 7 para a etapa 8

Registrada aqui, **sem implementar**. **Distribuída** em 2026-11-05 no [mapa da herança da etapa 8](#mapa-da-herança-da-etapa-8).

**SEO (`performance-e-seo`)**

- `metadataBase` no layout raiz, a partir de `NEXT_PUBLIC_SITE_URL` (variável pública; documentar em `docs/ambiente.md`).
- URL canônica (`alternates.canonical`) em todas as páginas indexáveis.
- Open Graph e Twitter (título, descrição, imagem) por página.
- `app/sitemap.ts` com `/`, `/queijos`, `/queijos/<slug>` (de `CHEESES`), `/presentes`, `/aprenda`, `/aprenda/<slug>` (de `ARTIGOS`) e `/produtores`; **sem** `/sacola`, `/checkout` e a 404.
- `app/robots.ts` sem `Disallow` para `/sacola` e `/checkout` (o `noindex` delas precisa ser lido).
- JSON-LD por página, com cuidado para não publicar lacuna como dado: `Offer` só com preço **não nulo** (os kits seguem com `preco: null`); `Article` sem campos vazios (corpo ainda é `null`); `Organization` só com CNPJ e endereço reais; `BreadcrumbList` no produto e no artigo.
- Descrição própria de `/produtores` com até 160 caracteres (o texto da §12 tem cerca de 230; depende do dono).
- Descrição do artigo: hoje é o primeiro parágrafo do `corpo` (`generateMetadata`); quando houver corpo, limitar a 160 caracteres.
- `npm run medir:pacote` deve incluir as rotas novas (`/presentes`, `/aprenda`, `/aprenda/[slug]`, `/produtores`, a 404) e registrar a nova linha de base. A **folga de JavaScript da Home é zero**: qualquer código novo global estoura o orçamento.

**Acessibilidade (`especialista-em-acessibilidade`)**

- Instalar `axe-core` nos testes, com ADR (nova dependência), e cobrir as páginas novas; somar e2e de teclado (Tab) em `/presentes`, `/aprenda`, `/aprenda/<slug>`, `/produtores` e na 404.
- A seta `→` dos links da Home (`SectionHeading`) precisa de `aria-hidden`.
- Trilha: pendência de contraste e de tamanho do alvo (WCAG 2.5.8) dos links da trilha.
- `hashchange`: o `FocoNoConteudo` já trata cliques em âncora da mesma rota e `hashchange`; conferir com e2e de teclado que o foco vai ao bloco **Presentes para equipes e clientes.** quando a pessoa já está em `/presentes`.

**Segurança e configuração**

- [x] Renomear `NEXT_PUBLIC_WHATSAPP_NUMBER` para `WHATSAPP_NUMBER` (sem o prefixo `NEXT_PUBLIC_`) e marcar o módulo com `server-only`: feito, ver [ADR-0013](adr/0013-numero-do-whatsapp-so-no-servidor.md).

**Qualidade e testes (`testes-e-qualidade`)**

- Instabilidade sob carga de `e2e/checkout.spec.ts:13` e `e2e/pagina-sacola.spec.ts:23` (3 ocorrências no total; passam isoladas e nas reexecuções; suspeita de corrida de hidratação).
- Tipo do corpo do artigo: agora `readonly [string, ...string[]] | null`, ou seja, **não vazio**; lista vazia não compila. O mesmo vale para `queijosCitados` e `Produtor.queijos`.

---

## Etapa 8 — Rodada de qualidade: testes, acessibilidade, desempenho, SEO e segurança

**Objetivo:** deixar o site pronto para ser indexado, auditado e publicado sem surpresa: metadados e dados estruturados só com dados verdadeiros, cabeçalhos HTTP e CSP, travas que impedem publicar com lacunas ou dados fictícios, varredura automática de acessibilidade (WCAG 2.2 AA) em todas as rotas e estados, orçamento de JavaScript e Core Web Vitals medidos por rota, cobertura e regressão visual, sem mudar textos, cores ou medidas da spec sem aprovação.

**Situação: DETALHADA (2026-11-05), aguardando o dono.** Nada implementado. Antes de começar o bloco que depende delas, o dono responde as [perguntas P68 a P84](#perguntas-ao-dono-etapa-8) e aprova ou recusa os ADRs propostos [0014](adr/0014-dependencias-da-rodada-de-qualidade.md) e [0015](adr/0015-cabecalhos-http-e-csp.md). O plano abaixo está escrito com as **recomendações**; se uma resposta for outra, a tarefa correspondente muda antes de começar.

**Pré-requisito:** etapa 7 concluída (`c5b514e`, `50fbf93`) e o painel sob demanda com o *gate* de hidratação dos e2e (`24d8de4`, ADR-0012).

**Decisões:** [ADR-0014](adr/0014-dependencias-da-rodada-de-qualidade.md) (**Proposto**: `@axe-core/playwright` e `@vitest/coverage-v8`, só de desenvolvimento, zero kB no site); [ADR-0015](adr/0015-cabecalhos-http-e-csp.md) (**Proposto**: cabeçalhos estáticos e CSP sem nonce, páginas continuam estáticas). Herdadas: [ADR-0012](adr/0012-folga-do-orcamento-de-js.md) (medição sem `noModule`, limite = medido + 3 kB por rota; `global-error` próprio recusado pelo dono), [ADR-0013](adr/0013-numero-do-whatsapp-so-no-servidor.md) (`WHATSAPP_NUMBER` só no servidor), [ADR-0011](adr/0011-paginas-de-conteudo-e-404.md) (JSON-LD só com dados verdadeiros), [ADR-0010](adr/0010-assistente-deterministico-e-whatsapp.md) e [ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md) (requisitos de CSP do 3D). Do dono: D2 (borda dos campos mantida), D3 (opacidade `.65`), D19 (sem busca), D25 (newsletter não grava), D26 a D29 (fictícios), D31 (Vercel), D33 (rascunho de privacidade na etapa 9), D34 (`--placeholder` provisório).

**Skills:** antes de cada tarefa, conferir o mapa em `SKILLS-ATELIE-DO-QUEIJO.md`: `seo` (blocos A e C), `core-web-vitals`, `performance` e `web-quality-audit` (bloco E), `accessibility` e `web-design-guidelines` (bloco D), `webapp-testing` (blocos D e F), `vercel-react-best-practices` (manter tudo no servidor). As skills de segurança da Trail of Bits ficam **fora** (não estão na lista aprovada; exigiriam CodeQL/Semgrep e aprovação do dono). A spec vence em caso de conflito.

### Mapa da herança da etapa 8

Tudo o que as etapas 4, 6 e 7 deixaram para cá, com o destino de cada item.

| Item herdado | Origem | Destino na etapa 8 |
| --- | --- | --- |
| `metadataBase` a partir de `NEXT_PUBLIC_SITE_URL` | Etapa 7 | Tarefa 1 (P69) |
| Canônica por rota; `/queijos` sem *query* | Etapa 7 | Tarefa 1 |
| Open Graph e Twitter com imagem padrão | Etapa 7 | Tarefas 1 e 2 (P70) |
| Descrições próprias ≤ 160 caracteres (`/produtores`, artigos) | Etapa 7 | Tarefa 1 (P72) |
| `app/sitemap.ts` (de `QUEIJOS` e `ARTIGOS`; sem `/sacola`, `/checkout` e 404) e `app/robots.ts` sem `Disallow` para `/sacola` e `/checkout` | Etapas 4 e 7 | Tarefa 2 |
| JSON-LD: `Organization`/`WebSite`, `Product` + `Offer` só com preço não nulo, `BreadcrumbList` pela `Trilha`, `Article` sem campos vazios, `ItemList` de kits, produtores | Etapas 4 e 7 (ADR-0011, decisão 8) | Tarefa 8 (P71) |
| ADR de CSP e cabeçalhos estáticos (HSTS sem `preload`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`, `poweredByHeader: false`), teste de cabeçalhos no e2e; requisitos do ADR-0009 | Etapas 4 e 5 | Tarefa 4 (P68, ADR-0015) |
| Trava de build contra `[A DEFINIR` em produção | Etapa 6 (estava na 9) | Tarefa 5 (P73) |
| Número fictício fora da Vercel; `5520900000000` fora de `.next/static` | Etapa 6 | Tarefa 5 (P74) |
| `npm audit` e `npm audit signatures` | Etapa 4 | Tarefa 6 (manual; o passo no CI fica na etapa 9) |
| LGPD da newsletter e do checkout simulado | Etapa 4 | Tarefa 6 (inventário; o rascunho do aviso fica na etapa 9, D33) |
| Limite de taxa nas Server Actions | Etapa 4 | Tarefa 6 (P75) |
| Validar `EstadoDaConversa` com Zod se o motor for ao servidor | Etapa 6 (d) | **Fora**: o motor continua no navegador; entra no ADR da IA |
| `axe-core` com ADR e varredura de todas as rotas e do painel | Etapas 6 e 7 | Tarefa 10 (ADR-0014) |
| e2e de Tab nas páginas novas; `hashchange` em `/presentes` | Etapa 7 | Tarefa 12 |
| `aria-hidden` nas setas `→` dos links da Home | Etapa 7 | Tarefa 11 |
| Trilha: alvo (WCAG 2.5.8) e contraste | Etapa 7 | Tarefa 11 (P82) |
| Indicador de carregamento do painel | ADR-0012 | Tarefa 11 (P80) |
| Borda do campo de mensagem do chat (≈ 1,9:1) | Etapa 6 | Tarefa 11 (P81) |
| Foco do botão desabilitado com `.65` (D3): reconferir | Etapa 4 | Tarefas 10 e 12 |
| Colar "CEP 01310-100" (`maxLength` corta antes da máscara) | Etapa 4 | Tarefa 11 |
| Reserva de 320 px da `/sacola` (CLS) | Etapa 4 | Tarefas 14 e 15 |
| Lighthouse e Core Web Vitals no build de produção; LCP do hero com 3D | Etapas 5 e 7 | Tarefas 14 e 15 (P76) |
| `useReportWebVitals` | Pedido desta etapa | P77 |
| `medir:pacote` com as rotas novas | Etapa 7 | Tarefa 14 |
| Cobertura de testes | Pedido desta etapa | Tarefa 17 (P78) |
| Regressão visual com *baselines* | Pedido desta etapa | Tarefa 19 (P79) |
| Specs instáveis (`checkout.spec.ts:13`, `pagina-sacola.spec.ts:23`) e o *gate* de hidratação | Etapas 6 e 7 | Tarefa 18 |
| Dividir o contexto da conversa em dois | Etapa 6 | **Já feito** (ADR-0012, decisão 3) |
| Aviso "abre em nova aba" visível | Etapa 6 | P83 (tarefa 11, se mudar) |
| Texto depois da ação do assistente, texto de erro do *chunk*, aba sem número | Etapa 6 | P84 |
| `app/global-error.tsx` próprio | ADR-0012 | **Decidido: não criar** (o dono recusou) |
| Tipografia do checkout (D5) e borda dos campos (D2) no checklist da §14 | Etapa 4 | Etapa 9 (registro no checklist) |

### Escopo: o que entra e o que fica para depois

| Item | Etapa 8 | Depois |
| --- | --- | --- |
| §13 SEO: `<title>` por página, description com a nota sensorial | Já existe (etapas 3 a 7); a etapa 8 acrescenta canônica, Open Graph e Twitter com a mesma fonte de texto | — |
| §13 SEO: "dados estruturados `Product` com preço em BRL" | `Product` com um `Offer` por formato (preços literais da §9, `priceCurrency: BRL`) | `image` e `brand` quando houver foto e produtor real |
| Outros JSON-LD | Conforme P71 (recomendação: só dados verdadeiros e não fictícios) | Kits com preço, artigos com corpo, produtores reais |
| Sitemap e robots | `app/sitemap.ts` e `app/robots.ts` estáticos | `lastModified` quando houver datas reais |
| Imagem de compartilhamento e ícone | Conforme P70 | Foto do dono |
| Cabeçalhos e CSP | ADR-0015 (P68) | Revisão no ADR do gateway |
| Travas de publicação | Lacunas (P73) e dados fictícios fora da Vercel (P74) | Remoção das travas quando o dono trocar os dados (etapa 9) |
| Auditoria de dependências | `npm audit` manual com triagem | `npm audit` e `npm audit signatures` no CI, Dependabot ou Renovate (etapa 9) |
| LGPD | Inventário dos dados pessoais e conferência de que nada é gravado, enviado ou registrado em log | Rascunho do aviso de privacidade (D33) e validação jurídica (etapa 9) |
| Acessibilidade | axe em todas as rotas e estados, e2e de teclado, correções sem mudança visual; mudanças visuais só com P80 a P83 | Reconferir quando os textos e cores pendentes forem decididos |
| Desempenho | Orçamento por rota, CWV de laboratório, Lighthouse manual (P76) | Dados de campo (P77), Lighthouse no CI (etapa 9) |
| 3D no hero e giro no cartão | **Fora** (bloco C da etapa 5, só com o 1º GLB); a etapa 8 só deixa a medida pronta | Com o 1º GLB |
| Testes | Cobertura (P78), regressão visual (P79), estabilidade dos e2e | Regressão visual no CI (etapa 9) |
| CI | Nenhuma mudança no `ci.yml`: o axe e o teste de cabeçalhos entram no `test:e2e`, que já roda no CI | Etapa 9 (cobertura, visual, audit, Lighthouse) |

**Fora, por regra do projeto:** nenhuma dependência de produção nova; nenhum texto, cor ou medida da spec alterados sem resposta do dono; nenhuma conta ou serviço externo (análise, monitoramento, *rate limit* hospedado); nada publicado.

### Contratos

#### `lib/site.ts` (servidor e build; sem `'use client'`)

```ts
/** URL pública do site (sem caminho, query ou hash), validada com zod/mini na primeira chamada. */
export function urlDoSite(ambiente?: {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string;
}): URL;
```

- Com `VERCEL_ENV=production`: **obrigatória** e `https:` (P69 = A); ausente ou inválida lança erro em português, e o `next.config.ts` chama a função para o build falhar cedo.
- Fora de produção: ausente vale `http://localhost:3000`; presente e inválida lança erro (erro de configuração não é silencioso).
- Único leitor de `NEXT_PUBLIC_SITE_URL`. Usada por `app/layout.tsx` (`metadataBase`), `app/sitemap.ts`, `app/robots.ts` e `lib/dadosEstruturados.ts`.

#### `lib/seo.ts` (puro)

```ts
export const NOME_DO_SITE = 'Ateliê do Queijo';

/** Caminhos indexáveis, na ordem do sitemap: '/', '/queijos', '/queijos/<slug>' (QUEIJOS), '/presentes',
 *  '/aprenda', '/aprenda/<slug>' (ARTIGOS), '/produtores'. Nunca '/sacola', '/checkout' ou a 404. */
export function caminhosIndexaveis(): readonly `/${string}`[];

/** Canônica, Open Graph e Twitter de uma página. O merge de metadados do Next é RASO: quem define
 *  `openGraph` substitui o do layout inteiro, então toda página indexável usa esta função. */
export function metadadosDaPagina(opcoes: {
  caminho: `/${string}`;     // sem query: /queijos?origem=brasil tem canônica /queijos
  titulo: string | null;     // null = Home (título padrão). O template '%s — Ateliê do Queijo' não vale para og:title: a função monta o texto completo
  descricao: string;
  tipo?: 'website' | 'article';
}): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'>;

/** Corta em palavra inteira até `limite` caracteres (com "…" quando corta). Nunca corta lacuna "[...]" ao meio. */
export function descricaoCurta(texto: string, limite?: number /* 160 */): string;
```

- `openGraph`: `title`, `description`, `url` (= canônica), `siteName: NOME_DO_SITE`, `locale: 'pt_BR'`, `type`. A imagem vem do arquivo `app/opengraph-image.*` (P70), que tem prioridade sobre o objeto e vale para todas as rotas.
- `twitter`: `card: 'summary_large_image'` com imagem (P70 = A ou C); `summary` sem imagem (P70 = B).
- `/sacola`, `/checkout` e a 404 **não** usam `metadadosDaPagina` e continuam com `robots: { index: false, follow: false }` (a 404 recebe `noindex` do Next).
- Descrições: conforme P72. `Artigo` ganha `descricao?: string` (escrita pelo dono) se P72(b) = A.

#### `app/sitemap.ts` e `app/robots.ts`

- `sitemap()` devolve `caminhosIndexaveis()` com URL absoluta de `urlDoSite()`. Sem `lastModified`, `changeFrequency` e `priority` (não há datas reais; os buscadores ignoram os dois últimos).
- `robots()`: com `VERCEL_ENV=production`, `Allow: /` e `Sitemap: <site>/sitemap.xml`, **sem** `Disallow` para `/sacola` e `/checkout` (o `noindex` delas precisa ser lido); fora de produção (prévias), `Disallow: /`.

#### `lib/dadosEstruturados.ts` (puro) e `components/DadosEstruturados.tsx` (Server)

```ts
type Json = string | number | boolean | null | readonly Json[] | { readonly [chave: string]: Json };
export type DadoEstruturado = { '@context': 'https://schema.org'; '@type': string; [chave: string]: Json };

export function organizacao(site: URL): DadoEstruturado;          // name, url (+ logo, se P70 criar o ícone)
export function siteWeb(site: URL): DadoEstruturado;              // name, url, inLanguage 'pt-BR'; sem SearchAction (D19)
export function produto(queijo: Cheese, site: URL): DadoEstruturado; // name, description (nota), url, offers[]
export function trilhaDeNavegacao(
  itens: readonly { href: string; texto: string }[],
  atual: { href: string; texto: string },
  site: URL,
): DadoEstruturado;                                               // BreadcrumbList, os mesmos itens da Trilha
export function artigo(artigo: Artigo, site: URL): DadoEstruturado | null; // null enquanto corpo === null

/** JSON.stringify com '<' trocado por < (nada fecha o <script>). */
export function serializar(dado: DadoEstruturado | readonly DadoEstruturado[]): string;

/** Server Component: <script type="application/ld+json">. Recebe só o que os construtores devolvem. */
export function DadosEstruturados(props: { dados: DadoEstruturado | readonly DadoEstruturado[] }): JSX.Element;
```

- **Regra única:** nenhum campo recebe texto com `[` (lacuna) nem valor de `data/ficticio.ts`; o construtor **omite** o campo em vez de publicá-lo. `Offer`: `price` como texto com ponto (`"136.00"`, a partir de `Centavos`), `priceCurrency: 'BRL'`, `availability` `InStock` ou `OutOfStock` conforme `estoque`, `url` do produto. Nunca `Offer` com preço nulo.
- Onde entra: Home (`organizacao` + `siteWeb`), produto (`produto` + `trilhaDeNavegacao`), artigo (`trilhaDeNavegacao` + `artigo` quando houver corpo). Kits e produtores conforme P71 (recomendação: nada até haver preço e dados reais).
- A `Trilha` não muda de visual; a página que a monta passa os mesmos itens aos dois componentes (o JSON-LD não fica dentro da `Trilha`, que segue só visual).

#### `lib/cabecalhos.ts` (puro; importado pelo `next.config.ts`)

```ts
export function politicaDeConteudo(opcoes: { desenvolvimento: boolean; producao: boolean }): string;
export function cabecalhosDeSeguranca(opcoes: { desenvolvimento: boolean; producao: boolean }):
  readonly { key: string; value: string }[];
```

- Valores do ADR-0015 (P68 = A). `desenvolvimento` = `NODE_ENV === 'development'` (acrescenta `'unsafe-eval'`); `producao` = `VERCEL_ENV === 'production'` (acrescenta `upgrade-insecure-requests`).
- `next.config.ts`: `poweredByHeader: false` e `headers()` com `source: '/:path*'`.

#### Travas de publicação (`lib/lacunas.ts` e `data/ficticio.ts`)

```ts
/** Percorre objetos, listas e textos e devolve o caminho de cada texto com "[A DEFINIR" (ex.: "TEXTOS_DO_ROTEIRO.saude"). */
export function encontrarLacunas(fontes: Readonly<Record<string, unknown>>): readonly string[];
/** Lança erro em português com a lista do que falta quando VERCEL_ENV === 'production' e houver lacuna. */
export function exigirSemLacunasEmProducao(vercelEnv: string | undefined, fontes: Readonly<Record<string, unknown>>): void;
```

- Fontes conforme P73 (recomendação B: `TEXTOS_DO_ROTEIRO`, `AVISO_DE_NOVA_ABA`, `QUEIJOS`, `ARTIGOS`, `CATEGORIAS`). Chamada no `next.config.ts`, ao lado de `exigirSemDadosFicticiosEmProducao`.
- Se P74 = B: `data/ficticio.ts` ganha `dadosFicticiosPermitidos(ambiente): boolean` (verdadeiro em `next dev` ou com `PERMITIR_DADOS_FICTICIOS=1`, **nunca** com `VERCEL_ENV=production`); `numeroDoWhatsApp()` e a trava passam a usá-la; `playwright.config.ts` (`webServer.env`), o `ci.yml` e o `.env.local` do dono definem a variável.
- `scripts/medir-pacote.mjs` ganha mais uma trava: **falha** se `NUMERO_WHATSAPP_FICTICIO` aparecer em qualquer arquivo de `.next/static`.

#### Apoio de acessibilidade dos e2e (`e2e/_apoio/acessibilidade.ts`)

```ts
export interface ExcecaoDoAxe { regra: string; seletor: string; motivo: string /* cita a decisão do dono, ex.: "D34" */ }
export const EXCECOES_DO_AXE: readonly ExcecaoDoAxe[];
/** Roda o axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) na página inteira e falha listando regra, seletor e ajuda. */
export async function conferirAcessibilidade(page: Page, opcoes?: { incluir?: string }): Promise<void>;
```

#### `scripts/medir-pacote.mjs` (orçamento)

- Passa a listar e limitar **todas** as rotas pré-renderizadas: `/presentes`, `/aprenda`, os três `/aprenda/<slug>`, `/produtores`, `/sacola`, `/checkout` e a 404 (`_not-found.html` sai de `IGNORADAS`). Limite de cada rota nova = valor medido + 3 kB gzip (método do ADR-0012). O *chunk* tardio do painel ganha limite = medido + 3 kB.
- `--web-vitals` passa a medir `/`, `/queijos/canastra-curado`, `/sacola` (com e sem itens) e `/presentes` em celular emulado, imprimindo LCP, CLS e o elemento de LCP.

### Fronteiras Server/Client

| Peça | Tipo | Motivo |
| --- | --- | --- |
| `lib/site.ts`, `lib/seo.ts`, `lib/dadosEstruturados.ts`, `lib/cabecalhos.ts`, `lib/lacunas.ts` | Módulos de servidor/build (nenhum arquivo `'use client'` os importa; teste confere) | Metadados, sitemap, robots, JSON-LD, cabeçalhos e travas existem só no HTML e no build |
| `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.*`, `app/icon.*` | Server, estáticos | Gerados no build |
| `components/DadosEstruturados.tsx` | Server | Só um `<script type="application/ld+json">` |
| `SupportFab` e gatilhos do painel (P80) | Client (já existem) | `aria-busy` durante o download do *chunk*; poucas linhas |
| Setas `→` com `aria-hidden` (`CabecalhoDeSecao`, `BrasilEMundo`, produtores) | Server (já são) | Só marcação |
| Zona de toque da `Trilha` (P82) | Server, só CSS | — |
| Campo de CEP (colar) | Client (já existe) | `onPaste` que normaliza |
| `useReportWebVitals` | **Não entra** (P77 = A) | — |

### Acessibilidade

- **Varredura com axe** (tarefa 10), no build de produção, a 1440 e a 390 px, depois do *gate* de hidratação: `/`; `/queijos` e `/queijos?origem=brasil`; `/queijos/canastra-curado` e `/queijos/brie-frances` (ficha em lacuna); `/sacola` vazia e com um item (com e sem embalagem para presente); `/checkout` na etapa 1 com o resumo de erros, na etapa 2, na confirmação e no erro de pagamento; `/presentes`; `/aprenda`; `/aprenda/queijo-e-vinho`; `/produtores`; `/nao-existe`; painel aberto na aba Assistente (início e estado do protótipo da §8.2), na aba Queijista dentro do horário e com a cave fechada (`page.clock`); menu do celular aberto; resultado do quiz da Home; aviso **Adicionado à sacola. Boa escolha.** visível.
- **Exceções** só em `EXCECOES_DO_AXE`, por regra e seletor, com o motivo: hoje, só `color-contrast` nos textos `[FOTO: …]` (`--placeholder`, D34). A borda dos campos (D2) não é conferida pelo axe (1.4.11 fica com a revisão manual e com o P81).
- **Teclado** (tarefa 12): Tab e Shift+Tab em `/presentes`, `/aprenda`, `/aprenda/<slug>`, `/produtores` e na 404, com a ordem esperada e foco visível dourado em cada parada; `#presentes-corporativos` a partir do rodapé **e** com a pessoa já em `/presentes` (`hashchange`); foco visível dos botões desabilitados e pendentes com `opacity: .65` (D3) medido ≥ 3:1.
- **Setas `→`**: o texto visível não muda; a seta vai para um `<span aria-hidden="true">`, e o nome acessível perde a seta (ex.: "Ver todos os queijos"). Os testes que buscam o nome com a seta são atualizados na mesma tarefa.
- **Trilha (WCAG 2.5.8)**: alvo de cada link ≥ 24 × 24 px conforme P82; `aria-current="page"` continua no item atual.
- **Painel**: indicador conforme P80; nenhum foco perdido se o *chunk* falhar (já coberto pela `BordaDoPainel`, ADR-0012).
- **Mudança visual**: nenhuma sem resposta do dono (P80 a P83). O `guardiao-do-design` confere as telas tocadas.

### Desempenho (orçamento)

Medido com `npm run medir:pacote` (método do ADR-0012: sem `<script noModule>`).

| Medida | Linha de base (2026-11-05) | Limite na etapa 8 |
| --- | --- | --- |
| *First Load JS* compartilhado | 140,88 kB gzip | 143,88 (sem mudança). Nada desta etapa vai ao pacote global além de `aria-busy` e `onPaste` (estimativa < 0,3 kB) |
| `/` | 145,34 | 148,34 (sem mudança) |
| `/queijos/canastra-curado` | 151,99 | 154,99 (sem mudança) |
| `/presentes`, `/aprenda`, `/aprenda/<slug>`, `/produtores`, 404 | A medir (tarefa 14) | Medido + 3 kB |
| `/sacola`, `/checkout` | 143,96 e 166,81 (informativos) | Passam a ter limite: medido + 3 kB |
| *Chunk* tardio do painel | ≈ 5,6 kB (sem limite) | Medido + 3 kB |
| *Chunk* do motor / do 3D | 12 kB / 350 kB | Sem mudança |

**Core Web Vitals de laboratório** (build de produção, celular emulado, mediana de 3 execuções): LCP ≤ 2,5 s, CLS ≤ 0,1 e TBT ≤ 200 ms em `/`, no produto, na `/sacola` e em `/presentes`. **Lighthouse** (P76 = A, celular): Desempenho ≥ 90, Acessibilidade 100, Boas práticas ≥ 95, SEO 100; desvios explicados no relatório. **LCP do hero:** hoje é o SVG A.3 ou o h1 (não há GLB); a tarefa 14 registra o elemento de LCP para que o bloco C da etapa 5 prove que o `<model-viewer>` nunca vira o elemento de LCP nem atrasa o SVG (§11: "lazy, depois que a ilustração SVG já estiver visível").

### Segurança e privacidade

- Cabeçalhos e CSP do ADR-0015, conferidos por e2e em `/` (estática), `/queijos` (dinâmica), `/checkout` (com uma Server Action executada sob a CSP) e na 404; nenhuma violação de CSP no console em nenhum e2e.
- Travas de publicação (P73, P74) testadas no Vitest com `VERCEL_ENV` simulado, mais a busca do número fictício em `.next/static`.
- `npm audit` (com e sem `--omit=dev`) e `npm audit signatures`: nenhuma vulnerabilidade alta ou crítica em dependência de produção; as de desenvolvimento com triagem registrada (atualizar, aceitar com motivo ou trocar).
- **Inventário LGPD** (para o rascunho da etapa 9, D33): que dado pessoal cada fluxo recebe (newsletter: nenhum enviado, D25; checkout: nome, e-mail, telefone, endereço e mensagem do presente, só em memória e na Server Action simulada; chat: texto livre só em memória; `localStorage`: só a sacola), e conferência de que nenhum deles vai para log (`console.*` no servidor), URL ou armazenamento.
- Server Actions: confirmar que continuam sem efeito colateral (nada gravado, enviado ou cobrado), base do P75.
- JSON-LD escapado; nenhum `dangerouslySetInnerHTML` fora de `components/DadosEstruturados.tsx` (busca no revisor).

### Testes

- **Unidade:** `urlDoSite` (produção sem variável, `http:` em produção, caminho ou *query* na URL, ausente fora de produção); `caminhosIndexaveis` (inclui os 10 queijos e os 3 artigos; não inclui `/sacola`, `/checkout`); `metadadosDaPagina` (canônica sem *query*, `og:title` com o sufixo, `og:url` igual à canônica); `descricaoCurta` (≤ 160, corte em palavra, não corta `[...]`); `sitemap()` e `robots()` (produção e prévia); construtores de JSON-LD (nenhum texto com `[`, nenhum valor de `data/ficticio.ts`, `Offer` só com preço, `price` com ponto e duas casas, `artigo()` nulo sem corpo, `serializar` escapa `</script>`); `politicaDeConteudo` e `cabecalhosDeSeguranca` (desenvolvimento, local e produção); `encontrarLacunas` e `exigirSemLacunasEmProducao`; `dadosFicticiosPermitidos` (se P74 = B); nenhum arquivo `'use client'` importa `lib/site`, `lib/seo`, `lib/dadosEstruturados`, `lib/cabecalhos` ou `lib/lacunas`.
- **E2E:** cada rota indexável tem `<link rel="canonical">` absoluto e `og:title`, `og:description`, `og:url` e `og:image` (se P70 ≠ B); `/queijos?origem=mundo` tem canônica `/queijos`; `/sitemap.xml` lista exatamente `caminhosIndexaveis()`; `/robots.txt` sem `Disallow: /sacola`; o JSON-LD de cada página é JSON válido, com os tipos esperados e sem `[`; cabeçalhos de segurança presentes e sem `X-Powered-By`; varredura do axe (lista acima); teclado nas páginas novas.
- **Estabilidade:** `npx playwright test e2e/checkout.spec.ts e2e/pagina-sacola.spec.ts --repeat-each=10 --workers=4` sem falha; regra de ESLint que proíbe importar `@playwright/test` direto em `e2e/*.spec.ts` (todo spec usa a *fixture* com o *gate* de `e2e/_apoio/teste.ts`).
- **Cobertura** (P78) e **regressão visual** (P79): tarefas 17 e 19.

### Tarefas

Cada tarefa termina com `lint`, `typecheck`, `format:check`, `test`, `modelos:validar`, `build`, `medir:pacote` e `test:e2e` passando. Estimativa de linhas entre parênteses.

**Bloco A — SEO de base (commit 1)** — depende de P69, P70 e P72

1. **[performance-e-seo] URL do site, canônicas, Open Graph e descrições** (~300 com testes)
   - `lib/site.ts`, `lib/seo.ts`; `metadataBase` no `app/layout.tsx`; `metadadosDaPagina` em `/`, `/queijos`, `/queijos/[slug]`, `/presentes`, `/aprenda`, `/aprenda/[slug]` e `/produtores`; descrições conforme P72; `urlDoSite()` chamada no `next.config.ts`; `.env.example` atualizado.
   - **Pronto quando:** os testes de unidade de `lib/site` e `lib/seo` passam; o HTML de cada rota indexável tem canônica absoluta e as tags `og:` da seção de testes; `/queijos?origem=brasil` tem canônica `/queijos`; build com `VERCEL_ENV=production` e sem `NEXT_PUBLIC_SITE_URL` falha com mensagem em português; nenhuma description passa de 160 caracteres.

2. **[performance-e-seo] Sitemap, robots, imagem de compartilhamento e ícone** (~200 com testes)
   - `app/sitemap.ts`, `app/robots.ts`; `app/opengraph-image.tsx` (ou `.png`) e `app/icon.svg` conforme P70.
   - **Pronto quando:** `/sitemap.xml` tem exatamente as 18 URLs de `caminhosIndexaveis()` (Home, catálogo, 10 queijos, presentes, aprenda, 3 artigos, produtores) e nenhuma de `/sacola` ou `/checkout`; `/robots.txt` segue o contrato em produção e em prévia; `og:image` responde 200 com 1200 × 630 (se P70 ≠ B); o `guardiao-do-design` confere que a imagem e o ícone só usam elementos do Apêndice A e cores da §3.1.

3. **Verificação do bloco A:** `testes-e-qualidade`, `guardiao-do-design` (imagem e ícone) → `revisor-de-codigo` → commit `feat(seo): adiciona url base, canônicas, open graph, sitemap e robots`.

**Bloco B — Segurança (commit 2)** — depende de P68, P73, P74 e P75; ADR-0015 aceito

4. **[devops-e-deploy] Cabeçalhos HTTP e CSP** (~250 com testes)
   - `lib/cabecalhos.ts`, `headers()` e `poweredByHeader: false` no `next.config.ts`; `e2e/cabecalhos.spec.ts`.
   - **Pronto quando:** os testes de unidade passam; o e2e confere os cabeçalhos em `/`, `/queijos`, `/checkout` e `/nao-existe` e a ausência de `X-Powered-By`; o checkout completo (frete e **Confirmar pedido**) passa sob a CSP; **todos** os e2e passam com o console limpo (nenhuma violação de CSP); `next dev` funciona (HMR) com a política de desenvolvimento.

5. **[devops-e-deploy] Travas de publicação** (~200 com testes)
   - `lib/lacunas.ts` e a chamada no `next.config.ts` (P73); `dadosFicticiosPermitidos` e `PERMITIR_DADOS_FICTICIOS` no Playwright, no CI e no `docs/ambiente.md` (se P74 = B); trava do número fictício em `.next/static` no `medir:pacote`.
   - **Pronto quando:** `VERCEL_ENV=production npm run build` falha listando as lacunas (hoje: os textos do P52, as fichas dos 9 queijos, os artigos e a categoria vazia) e os dados fictícios; o build local e o e2e continuam passando; `medir:pacote` falha se o número fictício for posto num arquivo client de teste e passa sem ele.

6. **[auditor-de-seguranca] Auditoria da etapa (somente leitura)** — correções pelo `devops-e-deploy` ou pelo `engenheiro-de-ecommerce`
   - `npm audit` (com e sem `--omit=dev`), `npm audit signatures`; revisão dos cabeçalhos e da CSP; inventário LGPD; Server Actions sem efeito colateral (base do P75); nenhum dado pessoal em log, URL ou armazenamento; achados registrados neste plano em "Verificação do bloco B (etapa 8)".
   - **Pronto quando:** nenhuma vulnerabilidade alta ou crítica em produção; cada achado tem correção aplicada ou decisão registrada; o inventário LGPD está neste plano para o rascunho da etapa 9.

7. **Verificação do bloco B:** `testes-e-qualidade`, `performance-e-seo` (nenhuma página deixou de ser estática no `next build`) → `revisor-de-codigo` → commit `feat(seguranca): adiciona cabeçalhos http, csp e travas de publicação`.

**Bloco C — Dados estruturados (commit 3)** — depende de P71

8. **[performance-e-seo] JSON-LD** (~350 com testes)
   - `lib/dadosEstruturados.ts`, `components/DadosEstruturados.tsx`; Home (`Organization` + `WebSite`), produto (`Product` + `BreadcrumbList`), artigo (`BreadcrumbList`; `Article` só com corpo); kits e produtores conforme P71.
   - **Pronto quando:** os testes de unidade passam; o e2e lê o JSON-LD de `/`, `/queijos/canastra-curado`, `/queijos/brie-frances` e `/aprenda/queijo-e-vinho`, faz `JSON.parse` e confere os tipos; nenhum valor contém `[` nem dado de `data/ficticio.ts`; o `Product` do Canastra tem os três `Offer` com os preços da §9; o Teste de Pesquisa Aprimorada do Google ou o validador do schema.org (colando o HTML gerado) não aponta erro (a falta de `image` fica registrada como aviso esperado).

9. **Verificação do bloco C:** `testes-e-qualidade`, `auditor-de-seguranca` (escape do `<script>`) → `revisor-de-codigo` → commit `feat(seo): adiciona dados estruturados json-ld`.

**Bloco D — Acessibilidade (commit 4)** — depende de P80 a P83; ADR-0014 aceito

10. **[testes-e-qualidade + especialista-em-acessibilidade] Varredura com axe** (~250)
    - Instalar `@axe-core/playwright` 4.14.0 (ADR-0014); `e2e/_apoio/acessibilidade.ts`; `e2e/acessibilidade.spec.ts` com a lista da seção de acessibilidade, a 1440 e a 390 px. Primeiro roda e **lista** os achados; as correções vêm na tarefa 11, e o commit só sai com tudo passando.
    - **Pronto quando:** a lista de achados está registrada neste plano; `EXCECOES_DO_AXE` só tem itens com decisão do dono citada.

11. **[frontend-nextjs] Correções de acessibilidade e interface herdadas** (~300 com testes)
    - Setas `→` com `aria-hidden`; zona de toque da `Trilha` (P82); indicador do painel (P80); borda do campo do chat (P81); aviso de nova aba (P83, se mudar); colar no campo de CEP (`onPaste` que tira tudo que não é dígito e aplica a máscara; vale para o produto e o checkout); os demais achados da tarefa 10.
    - **Pronto quando:** a varredura da tarefa 10 passa sem violação fora das exceções; colar "CEP 01310-100" resulta em `01310-100` nos dois campos; os testes que buscavam nomes com a seta foram atualizados; o `guardiao-do-design` confirma que nada mudou de visual além do que P80 a P83 aprovaram.

12. **[testes-e-qualidade] E2E de teclado** (~250)
    - Ordem de Tab e foco visível em `/presentes`, `/aprenda`, `/aprenda/<slug>`, `/produtores` e na 404; âncora `#presentes-corporativos` pelo rodapé e por `hashchange`; contraste do foco com `.65` (D3).
    - **Pronto quando:** os e2e passam; nenhum elemento focável fica sem contorno visível.

13. **Verificação do bloco D:** `especialista-em-acessibilidade` (revisão manual com leitor de tela do que o axe não cobre: anúncios do painel, região viva do checkout, foco após navegação), `guardiao-do-design` → `revisor-de-codigo` → commit `fix(acessibilidade): adiciona a varredura com axe e corrige os achados`.

**Bloco E — Desempenho (commit 5)** — depende de P76 e P77

14. **[performance-e-seo] Orçamento por rota e Core Web Vitals** (~200)
    - `medir:pacote` com todas as rotas e o *chunk* do painel (contrato acima); `--web-vitals` em `/`, produto, `/sacola` (vazia e com itens) e `/presentes`; Lighthouse conforme P76 nas mesmas rotas, mais `/aprenda` e o checkout; relatório resumido neste plano (números, elemento de LCP de cada rota, desvios).
    - **Pronto quando:** `medir:pacote` lista e limita todas as rotas; o relatório está neste plano; os limites de CWV da seção de desempenho são atendidos ou cada desvio tem causa e tarefa.

15. **[performance-e-seo + frontend-nextjs] Ajustes medidos** (~150)
    - Reserva da `/sacola` ajustada à altura real (CLS ≤ 0,1 com sacola vazia e com 1 e 3 itens); o que a tarefa 14 apontar, sem mudança visual.
    - **Pronto quando:** `--web-vitals` mostra CLS ≤ 0,1 na `/sacola` nos três casos; `medir:pacote` dentro do orçamento.

16. **Verificação do bloco E:** `testes-e-qualidade` → `revisor-de-codigo` → commit `perf: amplia o orçamento por rota e mede os core web vitals`.

**Bloco F — Testes e regressão (commit 6)** — depende de P78 e P79

17. **[testes-e-qualidade] Cobertura** (~100)
    - `@vitest/coverage-v8` na versão exata do `vitest` (ADR-0014); script `test:cobertura`; limites conforme P78; `coverage/` no `.gitignore`.
    - **Pronto quando:** `npm run test:cobertura` gera o relatório e passa nos limites; o `npm test` não fica mais lento.

18. **[testes-e-qualidade] Estabilidade dos e2e** (~100)
    - Repetição dos specs instáveis; regra de ESLint da *fixture*; revisão dos limites de tempo de `lib/pedido.test.ts`; registro do resultado neste plano.
    - **Pronto quando:** `--repeat-each=10 --workers=4` dos dois specs passa; nenhum spec importa `@playwright/test` direto; a nota do RETOMADA sobre instabilidade é fechada ou atualizada com a causa.

19. **[testes-e-qualidade] Regressão visual** (~250 + imagens)
    - Projeto `visual` no `playwright.config.ts` (fora do `test:e2e` padrão), script `test:visual`; telas: Home, catálogo, produto do Canastra, painel no estado do protótipo, `/sacola` com itens, checkout etapa 1, `/presentes`, `/aprenda`, artigo, `/produtores` e 404, a 1440 e a 390 px (22 capturas); animações desligadas, `prefers-reduced-motion`, relógio fixo, fontes carregadas; *baselines* conforme P79.
    - **Pronto quando:** `npm run test:visual` passa duas vezes seguidas no ambiente das *baselines*; uma mudança proposital de 1 px numa margem faz o teste falhar; o `guardiao-do-design` aprovou cada *baseline* contra a spec antes do commit.

20. **Verificação do bloco F:** `guardiao-do-design` (*baselines*) → `revisor-de-codigo` → commit `test: adiciona cobertura e regressão visual`.

**Fechamento**

21. **[documentador-tecnico] Fechamento da etapa 8**
    - `docs/ambiente.md` (`NEXT_PUBLIC_SITE_URL` obrigatória em produção, `PERMITIR_DADOS_FICTICIOS` se P74 = B, cabeçalhos e CSP: como liberar um domínio novo); `docs/conteudo.md` (o que aparece no JSON-LD quando o dono preencher preço, corpo, foto e produtor; descrição dos artigos; o que a trava de lacunas lista); README (scripts `test:cobertura`, `test:visual`, `medir:pacote`); CHANGELOG; neste plano, a situação da etapa e os desvios para o checklist da §14; status dos ADRs 0014 e 0015.
    - **Pronto quando:** commit `docs: fecha a etapa 8` publicado.

### Commits da etapa 8

| Bloco | Conteúdo | Mensagem | Situação |
| --- | --- | --- | --- |
| Docs | Este detalhamento e os ADRs 0014 e 0015 | `docs: detalha a etapa 8 e propõe os adrs 0014 e 0015` | A fazer (sessão principal) |
| A | Tarefas 1 a 3 | `feat(seo): adiciona url base, canônicas, open graph, sitemap e robots` | A fazer |
| B | Tarefas 4 a 7 | `feat(seguranca): adiciona cabeçalhos http, csp e travas de publicação` | A fazer |
| C | Tarefas 8 e 9 | `feat(seo): adiciona dados estruturados json-ld` | A fazer |
| D | Tarefas 10 a 13 | `fix(acessibilidade): adiciona a varredura com axe e corrige os achados` | A fazer |
| E | Tarefas 14 a 16 | `perf: amplia o orçamento por rota e mede os core web vitals` | A fazer |
| F | Tarefas 17 a 20 | `test: adiciona cobertura e regressão visual` | A fazer |
| Docs | Tarefa 21 | `docs: fecha a etapa 8` | A fazer |

Ordem: A antes de C (o JSON-LD usa `urlDoSite`); B cedo, para todos os e2e seguintes rodarem sob a CSP; D antes de F (as *baselines* visuais saem depois das correções visuais); E pode correr em paralelo a D.

### Critérios de pronto da etapa 8

- [ ] §13 SEO atendida: `<title>`, description, canônica, Open Graph e `Product` com preço em BRL em todas as páginas indexáveis; sitemap e robots conforme o contrato.
- [ ] Nenhum dado estruturado publica lacuna ou dado fictício.
- [ ] Cabeçalhos e CSP do ADR-0015 em todas as rotas; nenhuma violação no console; páginas continuam estáticas.
- [ ] Build com `VERCEL_ENV=production` falha com lacunas (P73) e com dados fictícios; o número fictício não aparece em `.next/static` (trava automática).
- [ ] `npm audit` sem alta ou crítica em produção; inventário LGPD registrado.
- [ ] Varredura do axe sem violação (WCAG 2.2 AA) em todas as rotas e estados listados, a 1440 e 390 px, com exceções só decididas pelo dono.
- [ ] §13 "Alvos de toque ≥ 44 px. Foco visível em dourado" reconferido nas páginas novas e na trilha (com as exceções já registradas).
- [ ] Orçamento de JS limitado em todas as rotas; CWV de laboratório e Lighthouse registrados.
- [ ] Cobertura e regressão visual conforme P78 e P79; os dois specs instáveis estáveis em 10 repetições.
- [ ] Nenhuma dependência de produção nova; nenhum texto, cor ou medida mudados sem resposta do dono.

### Riscos da etapa 8

- **CSP quebrando algo em silêncio** (Server Actions, estilos *inline*, *chunks* tardios, HMR) → política testada no build de produção pelos e2e, que falham com erro no console; variante de desenvolvimento com `'unsafe-eval'`; `upgrade-insecure-requests` só em produção.
- **Merge raso dos metadados** apagando o Open Graph do layout → toda página indexável usa `metadadosDaPagina`; teste e2e por rota.
- **JSON-LD com lacuna, dado fictício ou `</script>`** → construtores omitem o campo; testes que barram `[` e os valores de `data/ficticio.ts`; `serializar` escapa `<`.
- **`next.config.ts` importando `lib/roteiro` e `data/`** (aliases `@/`, custo do build) → conferir na documentação do Next 16.4.3 se o carregador do `next.config.ts` resolve os aliases; se não, as travas leem as fontes por caminhos relativos ou viram um script `prebuild`; o teste de unidade cobre a regra de qualquer forma.
- **Trava de lacunas bloqueando prévias** → só com `VERCEL_ENV=production`.
- **`PERMITIR_DADOS_FICTICIOS` esquecida** (se P74 = B) → mensagem de erro diz exatamente o que definir; Playwright e CI já a definem.
- **Falsos positivos do axe ou exceção larga demais** → exceção só por regra e seletor, com decisão do dono citada; nenhuma regra desligada para a página.
- **Varredura lenta ou instável** → roda depois do *gate* de hidratação, com `prefers-reduced-motion`; um spec por rota, em paralelo.
- **Regressão visual instável** (fontes, sistema operacional, 3D, relógio do horário, animações) → *baselines* num único ambiente (P79), animações desligadas, `page.clock` fixo, sem GLB; 22 capturas para limitar o peso no repositório (estimativa de 3 a 6 MB).
- **Folga de JS** → tudo desta etapa é servidor ou build; os poucos bytes de client (P80, CEP) são medidos no bloco D.
- **Números de Lighthouse variando** → mediana de 3 execuções no mesmo computador, build de produção, sem extensões.
- **Mudar nomes acessíveis** (setas) quebrar testes → atualizados na mesma tarefa; o texto visível não muda.
- **Limites de cobertura travando o trabalho** → catraca a partir do valor medido, só em `lib/` e `data/`.

### Perguntas ao dono (etapa 8)

Cada pergunta tem alternativas e uma recomendação. Responda com o número e a letra (ex.: "P68 A"). Sem resposta, a tarefa que depende dela não começa.

| # | Pergunta | Opções | Recomendação | Decisão do dono |
| --- | --- | --- | --- | --- |
| P68 | Como aplicar a política de conteúdo (CSP)? O Next só põe *nonce* em páginas dinâmicas, e quase todas as nossas são estáticas | **A)** CSP estática em `next.config.ts`, com `'unsafe-inline'` em scripts e estilos: as páginas continuam estáticas; bloqueia recursos de outros domínios, `<object>`, `<base>`, formulários para fora, molduras de outros sites e envio de dados para outro domínio, mas não bloqueia um script *inline* injetado (ADR-0015). **B)** *Nonce* por requisição com `proxy.ts`: política estrita, mas **todas** as páginas viram dinâmicas (sem pré-renderização nem cache de CDN, mais lentas e mais custo de servidor). **C)** SRI experimental do Next + CSP sem `'unsafe-inline'`: continua estático, mas é experimental e os scripts *inline* do App Router podem ser bloqueados; exige um teste prático antes | **A** agora: o site não reflete entrada de usuário no HTML e não tem dado de cartão. Reavaliar B ou C só nas rotas de pagamento, no ADR do gateway (etapa 9) | |
| P69 | `NEXT_PUBLIC_SITE_URL` (base das canônicas, do sitemap e do Open Graph) é obrigatória? | **A)** Obrigatória com `VERCEL_ENV=production` (o build falha se faltar, se não for `https` ou se tiver caminho); fora de produção vale `http://localhost:3000`. **B)** Em produção, se faltar, usar o domínio de produção que a Vercel informa (`VERCEL_PROJECT_PRODUCTION_URL`). **C)** Obrigatória sempre, também no computador local e no CI | **A**: erro de configuração não passa em silêncio, e o domínio final ainda não foi escolhido | |
| P70 | Imagem de compartilhamento (WhatsApp, redes) e ícone da aba do navegador. A spec não define nenhum dos dois | **A)** Gerar no build, sem dependência: imagem 1200 × 630 com fundo `--cave` e o bloco "símbolo sobre dourado" do Apêndice A.2 ao centro, **sem texto**; ícone = símbolo A.1. **B)** Igual a A, com o nome **Ateliê do Queijo** e a assinatura **Queijos de autor, escolhidos à mão.** em Cormorant (exige guardar o arquivo da fonte no repositório, licença OFL). **C)** O dono fornece imagem e ícone; até lá, nenhuma imagem (cartão pequeno nas redes) e nenhum ícone | **A**: usa só elementos e cores da spec, sem texto nem fonte nova; troca por foto quando o dono tiver | |
| P71 | Que dados estruturados publicar, se parte dos dados é lacuna ou fictícia? | **A)** Só dados verdadeiros e não fictícios: `Organization` com nome, URL (e o ícone do P70), **sem** CNPJ, endereço e telefone (fictícios, D26 e D27); `WebSite` sem busca (D19); `Product` com um `Offer` por formato (preços da §9), sem `brand` e sem `image`; `BreadcrumbList` no produto e no artigo; `Article` só quando houver corpo; **nada** para kits (sem preço) e produtores (fictício). **B)** A + `ItemList` dos kits com nome e descrição, sem preço (o Google aponta erro em `Product` sem `offers`). **C)** Incluir também os valores fictícios (CNPJ, endereço, produtor), para trocar na etapa 9 | **A**: nada inventado vai para os buscadores, e cada dado entra sozinho quando o dono preencher | |
| P72 | Descrições para os buscadores (até 160 caracteres). (a) `/produtores` usa hoje o texto da §12, com ≈ 230. (b) Artigos usam a descrição do layout até haver corpo | (a) **A)** Só a primeira frase literal da §12: **O Ateliê nasceu da vontade de levar até você queijos que só se encontravam na porta da fazenda ou nas melhores queijarias da Europa.** (≈ 132 caracteres). **B)** O dono escreve uma descrição nova. **C)** Manter as ≈ 230 (o buscador corta). (b) **A)** Campo opcional de descrição em cada artigo, escrito pelo dono; sem ele, o primeiro parágrafo do corpo, cortado em palavra inteira com "…". **B)** Só o corte automático do primeiro parágrafo | (a) **A**, texto da spec sem invenção. (b) **A** | |
| P73 | A trava que impede publicar com lacunas vale para quais textos? (só com `VERCEL_ENV=production`; prévias não são afetadas) | **A)** Só os textos do assistente: `TEXTOS_DO_ROTEIRO` e o aviso de nova aba (o que a etapa 6 pediu). **B)** Todo `[A DEFINIR` do assistente e dos dados: fichas dos 9 queijos, artigos, categoria vazia, queijos citados. **C)** B + toda lacuna entre colchetes (`[PREÇO]`, `[FOTO: …]`, `[n]`, `[TEXTO DO ARTIGO]`): nada vai ao ar com lacuna | **B**: impede publicar texto a definir; `[FOTO: …]` e `[PREÇO]` ficam para o checklist da etapa 9, porque o D34 admite publicar com placeholders de foto | |
| P74 | Hoje o número fictício do WhatsApp e a trava dos dados fictícios dependem de `VERCEL_ENV`. Fora da Vercel, um build de produção usaria os fictícios sem aviso | **A)** Manter: a hospedagem decidida é a Vercel (D31); só documentar. **B)** Inverter o padrão: fora do `next dev`, os fictícios só valem com `PERMITIR_DADOS_FICTICIOS=1` (no seu `.env.local`, no Playwright e no CI); sem ela, o número some e o build falha, em qualquer hospedagem. **C)** A + conferir no CI que `VERCEL_ENV` existe nos builds de produção | **B**: falha segura e barata; protege também contra um build manual feito por engano | |
| P75 | Limite de taxa nas duas Server Actions (frete e confirmar pedido). Hoje elas só simulam: nada é gravado, enviado ou cobrado | **A)** Continua adiado, como registrado na etapa 4: entra junto com o e-mail transacional ou o gateway (ADR do gateway, etapa 9); a etapa 8 só confirma que seguem sem efeito colateral. **B)** Limitador em memória por IP agora (simples, mas não vale entre instâncias da Vercel: dá falsa segurança). **C)** Regra de limite no firewall da Vercel ou serviço externo (Upstash): exige conta ou configuração do projeto e sua aprovação | **A**: sem custo nem dado em jogo hoje; a regra passa a ser obrigatória no ADR do gateway | |
| P76 | Como rodar o Lighthouse? | **A)** Manual, no Chrome (DevTools), sobre o build de produção local, em modo celular, mediana de 3 execuções; relatório resumido no plano; a regressão automática fica com o `medir:pacote --web-vitals` (sem dependência). **B)** Lighthouse CI (`@lhci/cli`) como dependência de desenvolvimento, com notas mínimas, local agora e no CI na etapa 9 (dependência grande). **C)** `npx lighthouse` sem instalar (versão não fixada; rejeitada por segurança) | **A** agora; B na etapa 9, se quiser a nota no CI | |
| P77 | Medir os Core Web Vitals dos visitantes reais (`useReportWebVitals`)? | **A)** Não agora: não há destino para os dados e a coleta precisa de aviso de privacidade; só medidas de laboratório. Reavaliar na etapa 9 (por exemplo, Vercel Speed Insights, com ADR). **B)** Componente mínimo que envia as medidas para uma rota do próprio site, que só registra no log da hospedagem (≈ 1 kB a mais em todas as páginas, dado de navegação, LGPD). **C)** Só imprimir no console fora de produção (pouco útil) | **A** | |
| P78 | Cobertura dos testes de unidade | **A)** `@vitest/coverage-v8` (ADR-0014), relatório e limites mínimos só em `lib/` e `data/`, fixados no valor medido arredondado para baixo (só podem subir). **B)** Só o relatório, sem limite. **C)** Sem ferramenta de cobertura | **A** | |
| P79 | Regressão visual: as capturas mudam entre Windows e Linux (fontes e suavização). Onde gerar as imagens de referência? | **A)** No Linux, dentro da imagem Docker oficial do Playwright (mesma versão, 1.64.1), igual ao CI; você roda pelo Docker Desktop no Windows; no CI na etapa 9. **B)** No seu Windows, rodando só no seu computador (não serve para o CI). **C)** Sem regressão visual automática; o `guardiao-do-design` continua comparando à mão. **D)** Geradas pelo próprio GitHub Actions (um *workflow* manual que gera e entrega as imagens para você revisar e commitar), sem Docker no seu computador | **A**, se puder instalar o Docker Desktop; senão **D** | |
| P80 | Ao clicar no botão de atendimento antes de o painel terminar de baixar, nada aparece até ele chegar (raro: o download começa sozinho logo após a página carregar) | **A)** Sem texto nem cor nova: o botão recebe `aria-busy` (o leitor de tela anuncia "ocupado") e o cursor de espera enquanto baixa. **B)** Texto curto visível perto do botão, só se a espera passar de 300 ms (texto novo, a escrever: até lá `[A DEFINIR: texto de carregamento do atendimento]`). **C)** Nada | **A** | |
| P81 | A borda do campo de mensagem do chat (`--pedra-clara` sobre `--cave`) tem contraste ≈ 1,9:1; a WCAG pede 3:1. O D2 manteve essa cor nos campos do checkout | **A)** O D2 vale também para o chat: manter e registrar como desvio da §14. **B)** Trocar a borda de **todos** os campos para `--placeholder` (#8C8070), cor que já está na paleta: ≈ 4,9:1 sobre `--cave` e 4,47:1 sobre `--carvao` (revoga o D2; o visual dos campos fica mais claro). **C)** Cor nova ≈ #7A6E60 só para campos (fora da paleta da §3.1) | **B**: atende a WCAG sem cor nova; **A** se preferir manter o visual da spec | |
| P82 | Links da trilha ("Início / Queijos / …"): o texto de 13 px dá um alvo menor que 24 × 24 px (WCAG 2.5.8) | **A)** Zona de toque invisível que leva cada link a pelo menos 24 × 24 px, sem mudança visual (mesma técnica do painel na etapa 6); links seguem sem sublinhado (a trilha é reconhecida pela estrutura e pelo item atual). **B)** A + sublinhar os links da trilha (muda o visual). **C)** Aumentar fonte ou espaçamento visível da trilha (muda medida da spec) | **A** | |
| P83 | O aviso "abre em nova aba" dos links do WhatsApp existe hoje só para leitor de tela (P49). Mostrar também para quem enxerga? | **A)** Não: o rótulo e o ícone já dizem que é o WhatsApp, e no celular o link abre o aplicativo. **B)** Ícone de "sai do site" ao lado do texto (ícone novo, fora da §4.10). **C)** Texto visível curto ao lado do botão (texto novo, a escrever) | **A** | |
| P84 | Textos que você ainda não escreveu, herdados da etapa 6: o que dizer depois que o assistente põe o queijo na sacola (`depoisDaAcao`), uma mensagem se o painel não carregar, e o texto da aba Queijista sem número | **A)** Seguem como estão: lacunas visíveis (`[A DEFINIR: …]`), erro do painel sem mensagem (o texto digitado fica e a próxima abertura tenta de novo), aba sem número só com o horário; a trava do P73 impede publicar com elas; você escreve quando quiser. **B)** Você escreve agora e a etapa 8 aplica (tarefa 11). **C)** Para o erro do painel, reaproveitar um texto que já existe na spec (nenhum se encaixa bem; não recomendado) | **A**: não bloqueia a etapa, e a trava garante que nada vai ao ar sem os textos | |

O `app/global-error.tsx` próprio **não** é pergunta: o dono já recusou (ADR-0012, atualização de 2026-11-05).

### Herança original da etapa 4 (cópia, para referência)

> Copiado de [Fica para depois (segurança e LGPD)](#fica-para-depois-segurança-e-lgpd), de [Fica para depois (blocos C e D)](#fica-para-depois-blocos-c-e-d) e de [Fica para depois (bloco E)](#fica-para-depois-bloco-e). As tabelas originais continuam onde estão; o destino de cada item está no [mapa da herança](#mapa-da-herança-da-etapa-8). Itens já resolvidos pelas decisões D2, D3, D5, D13 e D14 aparecem aqui só como histórico.

**Segurança**

| Item                                                                                                                                                                                                                                                                                                                                                             | Responsável                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ADR de CSP (nonce exige renderização dinâmica; avaliar o custo com o `performance-e-seo`)                                                                                                                                                                                                                                                                        | `arquiteto-de-software`, `auditor-de-seguranca`, `performance-e-seo`  |
| Cabeçalhos estáticos em `next.config` `headers()`: HSTS sem `preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` com `camera`, `microphone`, `geolocation` e `payment` vazios, `frame-ancestors 'none'`, `poweredByHeader: false`; teste de cabeçalhos no e2e                                       | `devops-e-deploy`, `testes-e-qualidade`                               |
| `/sacola` e `/checkout` fora do sitemap e **sem** `Disallow` no `robots` (o `noindex` precisa ser lido)                                                                                                                                                                                                                                                          | `performance-e-seo`                                                   |
| Limite de taxa nas duas Server Actions (`consultarFrete` e `confirmarPedido`); obrigatório antes de e-mail transacional ou de API paga, então vem antes se esses serviços chegarem primeiro                                                                                                                                                                      | `engenheiro-de-ecommerce`, `auditor-de-seguranca`                     |

**Desempenho, interface e acessibilidade**

| Item                                                                                                                                                                                                  | Responsável                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Colar "CEP 01310-100" no campo de CEP: o `maxLength=9` corta o texto antes da máscara (por exemplo, `onPaste` que normaliza)                                                                          | `frontend-nextjs`                                            |
| Reserva de 320 px da `/sacola` (`.reserva`): medir o CLS real antes de a sacola ser lida do `localStorage` e ajustar                                                                                  | `performance-e-seo`                                          |
| Contrastes que dependem de decisão do dono (borda dos campos 1,86:1; opacidade do botão desabilitado e pendente, com foco a 2,84:1; `--placeholder` 4,47:1): reconferir depois da decisão             | `especialista-em-acessibilidade`, `guardiao-do-design`       |
| Indicador de etapas a 360 px ("3. Confirmação" quebra de linha) e quebras "01310-/100" e "e-/mail": aplicar o que o dono decidir                                                                      | `frontend-nextjs`                                            |
| Medidas de tipografia do checkout fora da §3.2 (h2 de etapa 28 px, resumo de erros 18 px, **Resumo do pedido** 22 px, legenda 12 px com `0,14em`): registrar no checklist da §14 ou ajustar            | `guardiao-do-design`                                         |
| JSON-LD `Product` e sitemap (sacola e checkout fora do sitemap)                                                                                                                                       | `performance-e-seo`                                          |

## Etapa 9 — CI completo, ambientes e aceite (herança da etapa 4)

> **Herança da etapa 6 (bloco B):** publicar só na Vercel ou garantir `VERCEL_ENV`; conferir que `5520900000000` não aparece em `.next/static` após o build de produção ([detalhes](#verificação-do-bloco-b-etapa-6-correções-aplicadas-e-pendências)).

> **Herança da etapa 6:** trava de build ou teste de CI que falhe em produção com `[A DEFINIR` em `TEXTOS_DO_ROTEIRO` (**antecipada para a etapa 8, tarefa 5**); texto de saúde validado por profissional ([detalhes](#pendências-da-verificação-do-bloco-a-etapa-6)).

> A etapa 9 ainda será detalhada pelo `arquiteto-de-software`. Esta seção reúne o que a etapa 4 deixou para ela. As tabelas originais continuam em [Fica para depois (segurança e LGPD)](#fica-para-depois-segurança-e-lgpd) e [Fica para depois (bloco E)](#fica-para-depois-bloco-e).

**Segurança e hospedagem**

| Item                                                                                                                                                                                                                                                                       | Responsável                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Dependabot ou Renovate; `npm ci`, `npm audit` e `npm audit signatures` no CI                                                                                                                                                                                               | `devops-e-deploy`                                   |
| Conferir `Host`/`X-Forwarded-Host` na hospedagem (CSRF das Server Actions: definir a causa e os hosts permitidos antes de publicar), `serverActions.allowedOrigins` exatos e `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` estável entre instâncias                                   | `devops-e-deploy`, `auditor-de-seguranca`           |
| Logs da hospedagem sem corpo de POST                                                                                                                                                                                                                                       | `devops-e-deploy`                                   |

**Licenças de terceiros (ADR-0009)**

Gerar e publicar `public/licencas-de-terceiros.txt` com os avisos de `@google/model-viewer` (Apache-2.0), `three`, `lit` e demais dependências do 3D, e conferir se o build preserva os comentários `@license`. Responsável: `documentador-tecnico` e `devops-e-deploy`.

**LGPD (antes da publicação, com o dono; validar com profissional de direito)**

Aviso de privacidade com link antes de **Confirmar pedido**; base legal (art. 7º, V, e obrigação fiscal); justificar o telefone ou torná-lo opcional; prazo de retenção; canal do titular; `localStorage` declarado como estritamente necessário; dados do presenteado quando existirem (depende da pendência do dono sobre o destinatário do presente).

**ADR do gateway (quando o dono escolher o gateway)**

Tokenização (nenhum dado de cartão no nosso servidor); webhooks com assinatura, proteção contra *replay* e idempotência; segredos só em módulos `server-only`; identificador do pedido opaco de 128 bits com prova de posse; unicidade do número `AQ-` garantida no banco ou com 8 dígitos; recalcular e recusar total divergente; codificar a mensagem do presente conforme o contexto de saída; **remover o gatilho `recusa@exemplo.com` de `lib/pedido.server.ts`** (marcado com `// SIMULAÇÃO: remover com o gateway`; o teste de `lib/pedido.server.test.ts` confere os marcadores).

**Documentação (`documentador-tecnico`)**

- Ampliar `docs/conteudo.md` (guia do dono da loja) e `docs/ambiente.md` (variáveis de ambiente), criados no fechamento da etapa 5 com o que existia (queijos, modelos 3D, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (hoje `WHATSAPP_NUMBER`, ADR-0013) e a trava `VERCEL_ENV`). Faltam gateway, hospedagem, frete, Pix e horário.
- Atualizar o `CHANGELOG.md` e o README com hospedagem, gateway e ambientes.
- Checklist de aceite da §14 da spec, com os desvios aprovados (P21 e os textos novos da [lista do dono](#decisões-e-textos-que-aguardam-o-dono-fim-da-etapa-4)).

---

## Decisões do dono de 2026-11-03 (D1 a D34)

O dono aprovou **todas as opções recomendadas** da rodada de pendências (numeração D1 a D34, mesma ordem da conversa), com a exceção e os acréscimos abaixo. Esta seção **substitui** as listas "a confirmar pelo dono" e "Decisões e textos que aguardam o dono (fim da etapa 4)": o que está lá como sugestão passa a valer como decidido, conforme a tabela.

> **AVISO: DADOS FICTÍCIOS (D26 a D30).** O dono pediu que, por ora, sejam usadas informações **fictícias** no lugar das lacunas abaixo. **Nenhum desses valores é real e nenhum pode ir para produção.** Cada valor fictício deve ficar num único lugar (`data/ficticio.ts`, criado na tarefa de aplicação), marcado com `// FICTÍCIO: substituir antes da publicação`, para o dono trocar depois. A etapa 9 não fecha enquanto este aviso existir (item do checklist de aceite).

**Valores fictícios adotados** (todos em `data/ficticio.ts`, marcados `// FICTÍCIO: substituir antes da publicação`; o dono troca tudo antes da publicação):

| Dado | Valor fictício | Onde é usado |
| --- | --- | --- |
| WhatsApp (D26) | `5520900000000` (DDD 20 inexistente). `numeroDoWhatsApp()` usava `NEXT_PUBLIC_WHATSAPP_NUMBER` (hoje `WHATSAPP_NUMBER`, ADR-0013) se for `^55\d{10,11}$`; senão cai no fictício fora de produção e devolve `null` com `VERCEL_ENV=production` (a interface esconde os links) | Etapa 6: `app/layout.tsx` (servidor) → `AtendimentoProvider` → `LinkDoWhatsApp` (faixa, aba Queijista e produto) |
| CNPJ (D27) | `00.000.000/0001-00` | `components/Footer.tsx` |
| Endereço (D27) | `Rua Exemplo, 123, São Paulo, SP` | `components/Footer.tsx` |
| Frete e prazo (D28) | CEP 01000-000 a 19999-999: R$ 24,90, 3 dias úteis; 20000-000 a 39999-999: R$ 32,90, 4 dias úteis; 40000-000 a 99999-999: R$ 45,90, 5 dias úteis (grátis a partir de R$ 180; 00000-000 a 00999-999 segue fora de área) | `lib/pedido.server.ts` (`calcularFrete`) |
| Parcelas sem juros (D28) | 3 ("Cartão em até 3x sem juros") | `app/checkout/_checkout/EtapaDePagamento.tsx` |
| Produtor do Canastra (D29) | `Produtor Exemplo` ("Queijaria Produtor Exemplo") | `data/cheeses.ts` |
| Ano do produtor (D29) | `1985` | `data/cheeses.ts` |

**Trava automática:** `DADOS_FICTICIOS_ATIVOS = true` em `data/ficticio.ts` faz o `next.config.ts` lançar erro no build quando `VERCEL_ENV === 'production'`. O dono remove a trava ao trocar os dados.

Continuam como lacuna, por decisão do dono: dados dos 9 queijos sem ficha (`[A DEFINIR]`), preços dos kits (`R$ [PREÇO]`), `[N]` dias de "Como guardar", `[SELO E NÚMERO]`, `[DATA]`, sugestões de vinho e cerveja e o `[n]` de estoque.

### Decisões

| # | Decisão |
| --- | --- |
| D1 | Commits **sem** `Co-Authored-By` e sem menção ao Claude (vale o `CLAUDE.md`). Só o dono como autor. |
| D2 | Borda dos campos: **manter** `--pedra-clara` (cor da spec); desvio registrado no checklist da §14 (P18). |
| D3 | Botão desabilitado e pendente: subir a opacidade de `.5` para **`.65`** (revoga o `.5` do P19). Reconferir o contraste do foco. |
| D4 | Confirmação do pedido mostra **Pedido nº AQ-…** acima do título (revoga o P36; desvio da §10.2 registrado no checklist). |
| D5 | Tipografia do checkout (h2 28 px, resumo de erros 18 px, **Resumo do pedido** 22 px, legenda 12 px com `0,14em`): **aprovada**; registrar no checklist. |
| D6 | P21 confirmado como desvio no checklist da §14. |
| D7 | Textos visíveis novos do checkout (lista A): **aprovados**. |
| D8 | Textos só para leitor de tela: **aprovados**. |
| D9 | Nota fiscal do presente: **Nota fiscal sem valor visível ao presenteado.** aprovada. |
| D10 | Decisões técnicas aprovadas: `autocomplete="tel-national"`; mesmo erro de pagamento para qualquer motivo; **Desconto no Pix** só com Pix escolhido. |
| D11 | P6: **modelo de texto aprovado** ("Você prefere sabores {sabor}, vai servir {uso} e acompanhar com {acompanhamento}. O {nome} foi o que mais combinou com as três respostas."); a lacuna sai. |
| D12 | P2: formato só com peso vira **"Meia peça"** (~500 g) e **"Fração"** (~250 g). |
| D13 | Indicador de etapas: `gap` de 16 px abaixo de 400 px. |
| D14 | Hífen e espaço sem quebra em "01310-100" e "e-mail" nas mensagens do frete. |
| D15 | Item esgotado dentro do envio: **manter** `sacola-invalida` + **Voltar para a sacola**. |
| D16 | Seletor de quantidade no celular: **manter** oculto (a barra fixa adiciona 1). |
| D17 | **Adicionar** do cartão esgotado: definir só quando houver estoque real. |
| D18 | Rodapé (Entregas refrigeradas, Trocas e devoluções, Perguntas frequentes): **texto sem link**. |
| D19 | **Buscar** e **Minha conta**: **remover** do cabeçalho até existirem as funções. |
| D20 | Presente: **um endereço só** no checkout. |
| D21 | GLB: implementar a etapa 5 com fallback SVG e deixar o carregamento pronto para os GLB futuros. |
| D22 | `@google/model-viewer`: o `arquiteto-de-software` escreve o ADR e o dono aprova antes de instalar. |
| D23 | **Ver na mesa** (AR): oculto até haver GLB real (P11 mantido). |
| D24 | Assistente: roteiro determinístico na etapa 6; IA real depois, com ADR. |
| D25 | Newsletter e **Avise-me**: continuam sem gravar nada até a etapa 9 (P9/P15). |
| D26 | **WhatsApp:** número **fictício** (ver aviso). |
| D27 | **CNPJ e endereço do rodapé:** valores **fictícios**. |
| D28 | **Frete:** tabela, prazo `[N]` e parcelas `[n]` **fictícios**, só enquanto a loja for simulada. |
| D29 | **`[NOME DO PRODUTOR]` e `[ANO]`** do Canastra: **fictícios**. |
| D30 | Os 9 queijos sem ficha: ver restrição abaixo. |
| D31 | Hospedagem: **Vercel**, com ADR na etapa 9. Nada é publicado sem aprovação explícita. |
| D32 | Gateway: **Mercado Pago** (com Pix). ADR do gateway na etapa 9 (tokenização, webhooks assinados, idempotência, segredos `server-only`, remover o gatilho `recusa@exemplo.com`; validar no servidor o número de parcelas contra a regra real, nunca aceitar do cliente). Sem conta nem cobrança real sem aprovação. |
| D33 | LGPD: o agente redige um **rascunho** do aviso de privacidade; o dono valida com profissional de direito antes de publicar. |
| D34 | `--placeholder` (4,47:1): manter e rever antes de publicar, se ainda houver `[FOTO: …]`. |

**Restrição ao D30 (aguarda confirmação do dono).** A spec (§9) proíbe inventar características dos queijos sem ficha, e o `CLAUDE.md` manda manter as lacunas visíveis. Por isso, **só os dados de negócio** (D26 a D29) recebem valores fictícios. Selos, descrição e perfil sensorial dos 9 queijos continuam **`[A DEFINIR]`** até o dono confirmar que quer texto fictício também nesses campos.

### Tarefas geradas por estas decisões

| Tarefa | Responsável | Quando |
| --- | --- | --- |
| Aplicar D3, D4, D5 (registro), D11, D12, D13, D14, D18, D19 no código, nos testes e nos textos | `frontend-nextjs` (+ `guardiao-do-design`, `especialista-em-acessibilidade`) | Antes da etapa 5 (bloco único, um commit) — **Concluída em 2026-11-03.** Texto final do quiz: "Você prefere sabores {sabor}, vai servir {uso}, e acompanhar com {acompanhamento}. {nome} foi o que mais combinou com as três respostas." (uso: "para você mesmo, com calma"; sem artigo antes do nome, aprovado pelo dono). D14 feito com `white-space: nowrap` (`SemQuebra`), não com U+2011. |
| Criar `data/ficticio.ts` e aplicar D26 a D29 (WhatsApp, CNPJ, endereço, frete, prazo, parcelas, produtor, ano); trocar as lacunas visíveis por esses valores | `engenheiro-de-ecommerce` + `frontend-nextjs` | Antes da etapa 6 (o WhatsApp é necessário nela) — **Concluída em 2026-11-03.** |
| ADR do `@google/model-viewer` | `arquiteto-de-software` | Início da etapa 5 — **Escrito e aceito em 2026-11-03** ([ADR-0009](adr/0009-visualizador-3d-com-model-viewer.md), Aceito) |
| ADR da hospedagem (Vercel) e ADR do gateway (Mercado Pago) | `arquiteto-de-software`, `auditor-de-seguranca` | Etapa 9 |
| Rascunho do aviso de privacidade | `auditor-de-seguranca` + `documentador-tecnico` | Etapa 9 |
| Checklist da §14 com os desvios D2, D4, D5, D6 e o item "trocar dados fictícios": remover `DADOS_FICTICIOS_ATIVOS` e a trava do `next.config.ts` ao trocar os dados, e atualizar junto os testes unitários e e2e que citam os valores fictícios (CNPJ, endereço, frete, parcelas, produtor, ano) | `documentador-tecnico` | Etapa 9 |

---

## Pendências e decisões em aberto

| Item | Situação | Quem decide |
| --- | --- | --- |
| Hospedagem (ex.: Vercel ou outra) | **Não decidida.** Nada de publicar em produção sem aprovação. Será tratada na etapa 9 com ADR próprio. | Dono do projeto |
| Gateway de pagamento (Shopify Storefront, Mercado Pago ou Pagar.me, com Pix) | **Não decidido.** Até lá, só funções simuladas em `lib/commerce.ts` (spec §2), atrás dos Server Actions da etapa 4 (ADR-0008). A integração real exige ADR, chaves em variável de ambiente e aprovação do dono. | Dono do projeto |
| Pendências P24 a P38 da etapa 4 | **Decididas pelo dono em 2026-10-27 e implementadas** (ver [Decisões do dono para a etapa 4](#decisões-do-dono-para-a-etapa-4) e a [situação](#situação-das-decisões-p24-a-p38-ao-fim-da-etapa-4)). ADR-0007 aceito na mesma data. | Dono do projeto |
| Aviso de privacidade (LGPD) e termos de compra | O checkout simulado coleta dados pessoais só em memória. Antes da publicação (etapa 9), é preciso ter um texto de privacidade e definir a base legal, junto com o P9 (newsletter). Itens detalhados pelo `auditor-de-seguranca` em [Fica para depois](#fica-para-depois-segurança-e-lgpd). | Dono do projeto + `auditor-de-seguranca` |
| Destinatário do presente (nome e endereço do presenteado) | **Em aberto.** Hoje o checkout tem um endereço só. Se o presenteado tiver dados próprios, entram na LGPD (ver [Fica para depois](#fica-para-depois-segurança-e-lgpd)). Não bloqueia a etapa 4. | Dono do projeto |
| Segurança herdada da etapa 4 (CSP, cabeçalhos, limite de taxa, CI, hospedagem, ADR do gateway) | Registrada em [Fica para depois](#fica-para-depois-segurança-e-lgpd); copiar para as etapas 8 e 9 e para o ADR do gateway. | `arquiteto-de-software` + `auditor-de-seguranca` |
| Tabela de frete, prazos e área atendida | Simulados na etapa 4 (P27, P28). Os valores reais dependem da transportadora. | Dono do projeto |
| Número do WhatsApp, CNPJ, endereço, `[PREÇO]` e demais lacunas | Ficam visíveis entre colchetes até o dono preencher. | Dono do projeto |
| Provedor de IA para o assistente | A etapa 6 (concluída) usa roteiro determinístico atrás da interface `Assistente` de `lib/assistant.ts` ([ADR-0010](adr/0010-assistente-deterministico-e-whatsapp.md)); a IA real troca só `carregarAssistente()` e exigirá ADR próprio (provedor, custo, Route Handler, limite de taxa, LGPD). | Dono do projeto + `especialista-em-ia-conversacional` |
| Destino de "Entregas refrigeradas", "Trocas e devoluções" e "Perguntas frequentes" (rodapé) | A spec não define rotas. Ficam como texto não interativo até existir página. | Dono do projeto |
| Contraste de `--placeholder` sobre `--carvao` (4,47:1, abaixo de 4,5:1) | **Aceito como provisório** pelo dono (2026-10-26): só aparece nos textos `[FOTO: …]`. Rever antes da publicação se ainda houver placeholders. | Dono do projeto |
| Teste e2e do foco após navegar pelo menu mobile (`test.fixme` em `e2e/layout-global.spec.ts`) | **Resolvido na etapa 3** (tarefa 12): não há mais `test.fixme` em `e2e/`. | `testes-e-qualidade` |
| Pendências P1 a P16 da etapa 3 | Ver [Decisões do dono para a etapa 3](#decisões-do-dono-para-a-etapa-3). Cada uma tem um padrão provisório. | Dono do projeto |
| Controles sem ação (Buscar, Minha conta, "Fale conosco", botão flutuante) | "Fale conosco" e o botão flutuante são ligados ao painel no fim da etapa 3; Buscar e Minha conta precisam de destino antes da publicação. | `frontend-nextjs` + dono do projeto |
| Painel de atendimento: rolar a conversa até a última mensagem | **Resolvido:** ao abrir, só o log rola até o fim (suave; instantâneo com `prefers-reduced-motion`). Testes unitário e e2e. | Dono do projeto |
| Painel de atendimento: fechar ao mudar de rota | **Resolvido:** `Atendimento.tsx` fecha o painel (sem devolver o foco) quando o `usePathname()` muda; mudança só de searchParams não fecha. Testes unitário e e2e (`goBack`). | Dono do projeto |
| Etapa 8 (`performance-e-seo`): enxugar o pacote global do painel | **Resolvido:** o cartão do chat usa `lib/cartaoDoChat.ts` (módulo estático, conferido por teste contra `dadosDoCartao`); o painel não importa mais `lib/catalogo` nem `data/cheeses`. | `performance-e-seo` |
| Busca e conta no celular | O cabeçalho compacto (§7.6) não tem Buscar nem Minha conta. Definir outro caminho quando essas funções existirem. | Dono do projeto |

### Decisões e textos que aguardam o dono (fim da etapa 4)

Lista única das pendências abertas ao fechar a etapa 4. **Nada aqui foi alterado no código**: textos, cores, medidas e preços seguem a spec e as decisões já aprovadas. As tabelas de origem continuam mais abaixo: [blocos C e D](#textos-novos-dos-blocos-c-e-d-a-confirmar-pelo-dono), [tarefa 14](#textos-novos-da-tarefa-14-a-confirmar-pelo-dono), [tarefa 15](#textos-novos-da-tarefa-15-a-confirmar-pelo-dono), [tarefa 14/15](#textos-novos-da-tarefa-1415-a-confirmar-pelo-dono) e [bloco E](#fica-para-depois-bloco-e).

#### A. Textos novos das tarefas 9 a 15 (lista única, sem repetição)

Textos que a spec e o P25 não definem. Seguem o padrão do projeto e aguardam confirmação.

| Texto | Onde | Visível? | Tarefa |
| --- | --- | --- | --- |
| **Entrega** (h2 da etapa 1) e **Pagamento** (h2 da etapa 2) | Títulos das etapas do checkout | Sim | 14, 15 |
| **Seus dados** e **Endereço de entrega** | Legendas dos grupos de campos | Sim | 14 |
| **Nome completo**, **E-mail**, **Telefone**, **CEP**, **Rua ou avenida**, **Número**, **Complemento (opcional)**, **Bairro**, **Cidade**, **Estado** | Rótulos dos campos (também nomes no resumo de erros) | Sim | 14 |
| **Selecione** | Primeira opção da lista de estados | Sim | 14 |
| **(11) 91234-5678** | Placeholder do telefone | Sim | 14 |
| **Revise os campos abaixo** | Título do resumo de erros (`h3` que recebe o foco ao enviar com falha) | Sim | 14 |
| **Nota fiscal sem valor visível ao presenteado.** | Nota do bloco do presente (a spec traz só o fragmento; foi capitalizado e recebeu ponto final) | Sim | 14 |
| **Forma de pagamento** | Legenda do grupo de rádios | Sim | 15 |
| **Resumo do pedido** | Título (h3) do resumo da etapa 2 e `aria-label` da região do resumo da `/sacola` | Sim (etapa 2); leitor de tela (`/sacola`) | 11, 15 |
| **{n} × {nome}, {formato}** | Linha de cada item no resumo da etapa 2 | Sim | 15 |
| **Voltar para a sacola** | Link ao lado do erro quando a sacola não vale mais | Sim | 15 |
| **dd/mm/aaaa** | Formato da data de entrega no resumo | Sim | 15 |
| **−R$ x,xx** (sinal de menos U+2212) | Desconto do Pix no resumo | Sim | 15 |
| **Tirar** | Botão da linha "Embalagem para presente" no resumo da `/sacola` | Sim | 11 |
| **Tirar a embalagem para presente** | `aria-label` do botão acima | Leitor de tela | 11 |
| **Itens da sacola** | `aria-label` da lista de linhas da `/sacola` | Leitor de tela | 11 |
| **Quantidade de {nome}, {formato}** | Rótulo do seletor de quantidade de cada linha | Leitor de tela | 11 |
| **Máximo de 10 por item** | Descrição do seletor de quantidade no limite | Leitor de tela | 7, 11 |
| **Calculando…** | Região viva da consulta de frete (produto e checkout) | Leitor de tela | 9, 14 |
| **Etapas do pedido** | `aria-label` do indicador de etapas | Leitor de tela | 14 |
| **(etapa atual)** | Dentro do item atual do indicador de etapas | Leitor de tela | 14 |
| **Até 200 caracteres e 6 linhas.** | Dica do cartão do presente (`aria-describedby`) | Leitor de tela | 14 |
| **160 caracteres ou mais, de 200.**, **190 caracteres ou mais, de 200.** e **Limite excedido: no máximo 200 caracteres e 6 linhas.** | Região viva do contador (só nos marcos 160, 190 e ao exceder) | Leitor de tela | 14 |
| **Confirmando o pedido…** | Região viva enquanto **Confirmar pedido** está pendente | Leitor de tela | 15 |
| **Pix escolhido. Desconto de R$ x,xx. Total R$ y,yy.** e **Cartão escolhido. Sem desconto. Total R$ y,yy.** | Região viva ao trocar Pix e cartão (com frete em lacuna, o total anunciado é **R$ [PREÇO]**) | Leitor de tela | 15 |

Decisões técnicas a confirmar junto com os textos:

1. O telefone usa `autocomplete="tel-national"` (e não `tel`), porque o esquema aceita só DDD + número, sem `+55`.
2. O erro de pagamento mostra o **mesmo** texto aprovado para qualquer motivo (recusa, indisponível, sacola inválida, falha de rede). Só `dados-invalidos` e `fora-de-area` voltam à etapa 1.
3. A linha **Desconto no Pix** só existe com Pix escolhido; sem escolha, o resumo mostra o valor sem desconto.
4. A confirmação não repete o aviso de envio e não mostra o número do pedido (ver P36, abaixo).

#### B. Decisões de cor, medida e comportamento

| Assunto | Situação hoje | Sugestão registrada | Quem decide |
| --- | --- | --- | --- |
| Borda dos campos | `--pedra-clara` dá 1,86:1 sobre `--cave` (WCAG 1.4.11 pede 3:1). É cor da spec e vale para todos os campos; desvio aceito no P18 | Cor próxima de `#7A6E60` (≥ 3:1) | Dono |
| Opacidade do botão desabilitado e pendente | `opacity: .5` (P19) é herdada pelo contorno de foco, que fica em 2,84:1 | `.65` ou mais, ou desenhar o contorno fora da opacidade | Dono |
| Indicador de etapas a 360 px | "3. Confirmação" quebra de linha | `gap` de 16 px abaixo de 400 px | Dono |
| Medidas de tipografia fora da §3.2 | h2 de etapa 28 px, resumo de erros 18 px, **Resumo do pedido** 22 px, legenda 12 px com `0,14em` (o sobretítulo usa `0,18em`) | Aprovar os valores ou indicar os da spec | Dono |
| Nota fiscal do presente | Capitalizada e com ponto final (ver lista A) | Aprovar o texto | Dono |
| Quebra de "01310-/100" e "e-/mail" em telas estreitas | Pode ocorrer nas mensagens do frete | Hífen e espaço sem quebra nesses trechos (mexe em texto aprovado, por isso não aplicado) | Dono |
| Lacunas `[PREÇO]`, `[N]` e `[n]` | Visíveis de propósito: frete abaixo de R$ 180 (e o total junto), prazo de entrega e parcelas do cartão | Fornecer a tabela de frete, o prazo e o número de parcelas | Dono |
| Contraste de `--placeholder` | 4,47:1 sobre `--carvao`; aceito como provisório; só aparece nos `[FOTO: …]` | Rever antes da publicação | Dono |
| **Adicionar** do cartão de queijo esgotado | A spec (§7.5) só define o estado na página de produto. Hoje `ESGOTADOS` está vazio; o reducer já ignora a adição de formato esgotado, sem aviso | Definir o cartão quando houver estoque real | Dono |
| Item esgotado fora do resumo, mas dentro do envio | O servidor responde `sacola-invalida` e a tela mostra **Voltar para a sacola** | Manter ou mudar o comportamento | Dono |
| Número do pedido na confirmação (P36) | Não aparece, para seguir o texto literal da §10.2 | **Pedido nº AQ-123456** acima do título | Dono |
| Destinatário do presente | O checkout tem um endereço só; se o presenteado tiver dados próprios, entram na LGPD | Decidir se haverá endereço e nome do presenteado | Dono |
| Destino de **Buscar** e **Minha conta** | Controles sem ação; o cabeçalho do celular (§7.6) nem os tem | Definir as funções e o caminho no celular antes da publicação | Dono |
| Seletor de quantidade no celular (P12) | A página de produto esconde a quantidade no celular; a barra fixa adiciona 1 unidade. O seletor continua na `/sacola` | Manter ou mostrar o seletor na página de produto | Dono |

#### C. Pontos técnicos pequenos, sem decisão do dono

- Pausar o prazo do aviso em hover ou foco não foi feito: o aviso tem `pointer-events: none` e nenhum conteúdo focável, então não recebe hover nem foco (duração mantida em 4 s).
- O filtro de 404 de prefetch (`_rsc=`) em `e2e/_apoio/console.ts` foi removido na etapa 7, quando as três rotas passaram a existir.
- Colar "CEP 01310-100" e a reserva de 320 px da `/sacola`: ver [Etapa 8](#etapa-8--rodada-de-qualidade-testes-acessibilidade-desempenho-seo-e-segurança) (tarefas 11 e 15).

### Textos novos dos blocos C e D (a confirmar pelo dono)

Textos que a spec e o P25 não definem e que entraram nos blocos C e D. Seguem o padrão do projeto e aguardam confirmação.

| Texto | Onde | Visível? |
| --- | --- | --- |
| **Tirar** | Botão da linha "Embalagem para presente" no resumo da `/sacola` | Sim |
| **Tirar a embalagem para presente** | `aria-label` do botão acima | Só leitor de tela |
| **Itens da sacola** | `aria-label` da lista de linhas | Só leitor de tela |
| **Resumo do pedido** | `aria-label` da região do resumo | Só leitor de tela |
| **Quantidade de {nome}, {formato}** | Rótulo do seletor de quantidade de cada linha | Só leitor de tela |
| **Calculando…** | Região viva da calculadora de frete durante a consulta (WCAG 4.1.3) | Só leitor de tela |
| **Máximo de 10 por item** | Descrição do seletor de quantidade no limite | Só leitor de tela |

Sugestão ao dono (não aplicada, porque mexe em texto aprovado): em telas estreitas, "01310-100" e "e-mail" podem quebrar de linha em "01310-/100" e "e-/mail" nas mensagens do frete; um espaço sem quebra e um hífen sem quebra evitariam isso.

### Textos novos da tarefa 14 (a confirmar pelo dono)

Textos do `/checkout` (etapa 1) que a spec §10.2 e o P25 não definem. Seguem o padrão do projeto e aguardam confirmação. Os literais da spec (indicador de etapas, aviso de envio), os de P25 (**Finalizar compra**, **Continuar para o pagamento**, **Voltar para a entrega**, **Mensagem do cartão**, **Data de entrega**, **Embalar para presente**, contador **N de 200 caracteres**) e os `MENSAGENS_DE_ERRO` aprovados foram usados como estão.

| Texto | Onde | Visível? |
| --- | --- | --- |
| **Entrega** | Título (h2) da etapa 1; **Pagamento** no esqueleto da etapa 2 | Sim |
| **Etapas do pedido** | `aria-label` do indicador `<ol>` | Só leitor de tela |
| **Seus dados** | Legenda do grupo nome, e-mail e telefone | Sim |
| **Endereço de entrega** | Legenda do grupo do endereço | Sim |
| **Nome completo**, **E-mail**, **Telefone**, **CEP**, **Rua ou avenida**, **Número**, **Complemento (opcional)**, **Bairro**, **Cidade**, **Estado** | Rótulos dos campos (também nomes no resumo de erros) | Sim |
| **Selecione** | Primeira opção da lista de estados | Sim |
| **(11) 91234-5678** | Placeholder do telefone (mesmo exemplo do erro aprovado) | Sim |
| **Revise os campos abaixo** | Título do resumo de erros (foca ao enviar com falha); cada item é "Rótulo: mensagem aprovada" | Sim |
| **Nota fiscal sem valor visível ao presenteado.** | Nota do bloco do presente. A spec traz só o fragmento "nota fiscal sem valor visível ao presenteado"; foi capitalizado e recebeu ponto final | Sim |
| **Calculando…** | Região viva do CEP durante a consulta de frete (mesmo texto da calculadora do produto) | Só leitor de tela |

Decisão técnica a confirmar: o telefone usa `autocomplete="tel-national"` (e não `tel`), porque o esquema só aceita DDD + número, sem `+55`.

### Textos novos da tarefa 15 (a confirmar pelo dono)

Textos da etapa 2, do erro e da etapa 3 que a spec §10.2 e o P25 não definem. Os literais da spec (**Pix (5% de desconto)**, **Cartão em até [n]x sem juros** (revogado por D28: 3x fictício), a mensagem de erro, o título e o texto da confirmação) e os de P25 (**Subtotal**, **Frete**, **Desconto no Pix**, **Total**, **Grátis**, **Confirmar pedido**, **Voltar para a entrega**, **Embalar para presente**, **Mensagem do cartão**, **Data de entrega**, **Escolha Pix ou cartão.**) foram usados como estão.

| Texto | Onde | Visível? |
| --- | --- | --- |
| **Pagamento** | Título (h2) da etapa 2 | Sim |
| **Forma de pagamento** | Legenda do grupo de rádios | Sim |
| **Resumo do pedido** | Título (h3) do resumo da etapa 2 (mesmo texto do `aria-label` da `/sacola`) | Sim |
| **{n} × {nome}, {formato}** | Linha de cada item no resumo da etapa 2 (ex.: 1 × Brie francês, 500 g) | Sim |
| **Voltar para a sacola** | Link que acompanha o erro quando a sacola não vale mais (`sacola-invalida`) | Sim |
| **Explorar a cave** | Botão da confirmação (texto já existente na spec, usado também aqui; leva a `/queijos`) | Sim |
| **dd/mm/aaaa** | Formato da data de entrega no resumo | Sim |
| **−R$ x,xx** | O desconto do Pix aparece com o sinal de menos (U+2212) | Sim |

Decisões técnicas a confirmar: (1) o erro mostra o MESMO texto aprovado para qualquer motivo (recusa, indisponível, sacola inválida, falha de rede); só `dados-invalidos` com erros por campo e `fora-de-area` voltam à etapa 1; (2) a linha **Desconto no Pix** só existe com Pix escolhido; sem escolha ainda, o resumo mostra o valor sem desconto; (3) a confirmação não repete o aviso de envio nem mostra o número do pedido (P36).

### Textos novos da tarefa 14/15 (a confirmar pelo dono)

Textos que a rodada final de acessibilidade do checkout acrescentou. Todos só para leitor de tela, exceto o título do resumo de erros, que já era visível e agora recebe o foco como `h3`.

| Texto | Onde | Visível? |
| --- | --- | --- |
| **Até 200 caracteres e 6 linhas.** | Dica estável ligada ao cartão do presente por `aria-describedby` | Só leitor de tela |
| **160 caracteres ou mais, de 200.**, **190 caracteres ou mais, de 200.** e **Limite excedido: no máximo 200 caracteres e 6 linhas.** | Região viva do contador, anunciada só nos marcos 160, 190 e ao exceder (não a cada tecla) | Só leitor de tela |
| **(etapa atual)** | Dentro do item atual do indicador de etapas | Só leitor de tela |
| **Confirmando o pedido…** | Região viva enquanto o botão **Confirmar pedido** está pendente | Só leitor de tela |
| **Pix escolhido. Desconto de R$ x,xx. Total R$ y,yy.** e **Cartão escolhido. Sem desconto. Total R$ y,yy.** | Região viva ao trocar Pix e cartão (com o frete em lacuna, o total anunciado é **R$ [PREÇO]**) | Só leitor de tela |
| **Revise os campos abaixo** | Já visível; agora é o `h3` que recebe o foco programático (o contorno dourado continua no cartão inteiro) | Sim |

### Fica para depois (blocos C e D)

- **Colar "CEP 01310-100"** no campo de CEP: o `maxLength=9` corta o texto antes da máscara. Tratar na etapa 8 (por exemplo, `onPaste` que normaliza).
- **Reserva de 320 px da `/sacola`** (`.reserva`, CLS antes de a sacola ser lida do `localStorage`): medir o CLS real na etapa 8 e ajustar.
- **Contraste do `--placeholder`** (4,47:1): já aceito como provisório pelo dono (ver Pendências).

### Fica para depois (bloco E)

Pontos que dependem de decisão do dono (nada disto foi alterado):

- **Borda dos campos:** `--pedra-clara` sobre `--cave` dá contraste 1,86:1 (WCAG 1.4.11 pede 3:1). É cor da spec e o problema é sistêmico (todos os campos). Sugestão: ≈ `#7A6E60` (≥ 3:1).
- **Botão desabilitado e pendente:** `opacity: .5` é herdada pelo contorno de foco (2,84:1). Sugestão: `.65` ou mais, ou desenhar o contorno fora da opacidade.
- **Indicador de etapas a 360 px:** "3. Confirmação" quebra de linha. Sugestão: `gap` de 16 px abaixo de 400 px.
- **Tipografia sem correspondência na spec §3.2:** `h2` de etapa 28 px, resumo de erros 18 px, **Resumo do pedido** 22 px e legenda 12 px com `0,14em` (o sobretítulo usa `0,18em`).
- **Nota fiscal** do presente: capitalizada e com ponto final (a spec traz só o fragmento).
- **`[PREÇO]` no total** enquanto o frete for lacuna (comportamento intencional, sem inventar valor).
- **Item esgotado fora do resumo, mas dentro do envio:** o servidor responde `sacola-invalida` e a tela mostra o link **Voltar para a sacola**. Comportamento mantido.
- **CSRF e `X-Forwarded-Host`** (etapa 9): definir a causa e os hosts permitidos antes de publicar.
- **LGPD** (etapa 9): aviso de privacidade, base legal, retenção e destinatário do presente. Validar com profissional de direito.
- **Número do pedido** (`Pedido nº AQ-…`) acima do título da confirmação: sugestão ao dono (P36 hoje proíbe mostrar).

## Decisões de interpretação da spec (etapa 2)

Registradas para não serem rediscutidas. Todas seguem "o padrão mais próximo já definido" (spec §0) ou foram aprovadas pelo dono.

- **h1 de páginas ≤ 768 px: 38 px** (≈ 60% de 64 px, §3.4; igual ao h1 de produto).
- **SupportFab no celular fora do produto:** `right: 16px; bottom: 16px`, círculo de 54 px. Na página de produto, `bottom: 100px` (§7.6), na etapa 3.
- **Cabeçalho:** sem borda só na Home (desktop e celular); com borda em todas as outras rotas (§4.3).
- **Links do rodapé:** `--creme`, hover `--ouro` (padrão do menu, §4.3/§4.4). Com **44 px de altura só em ≤ 768 px**, aprovado pelo dono; o desktop segue a §4.9.
- **Painel do menu mobile** (não descrito na spec): fundo `--cave`, borda inferior `--pedra`, links de 16 px em `--creme` com 44 px de altura. **Aprovado pelo dono** (2026-10-26).
- **Client Components da etapa 2:** `HeaderFrame` (borda por rota), `HeaderNav`, `MobileMenu`, `SupportFab` e o componente que move o foco para `#conteudo` ao trocar de rota.
