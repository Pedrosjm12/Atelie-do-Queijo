# Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. **Nunca** coloque valores reais no `.env.example` nem versione o `.env.local`. Variáveis com prefixo `NEXT_PUBLIC_` são **públicas**: o valor vai para o navegador e qualquer pessoa pode lê-lo. **Não coloque segredos nelas.** Variáveis **sem** o prefixo ficam só no servidor. Segredos de verdade (gateway de pagamento) chegam na etapa 9.

> **AÇÃO DO DONO (renomeação de 2026-11-05).** A variável `NEXT_PUBLIC_WHATSAPP_NUMBER` passou a se chamar **`WHATSAPP_NUMBER`**. Quem já a tinha definida deve **criar `WHATSAPP_NUMBER`** no `.env.local` **e** nas variáveis do projeto na **Vercel** (Production e Preview), com o mesmo valor, e apagar a antiga. Sem isso, o código ignora o valor: fora de produção vale o número fictício; em produção (`VERCEL_ENV=production`) os links do WhatsApp somem.

| Variável                       | Para que serve                                                       | Onde obter                                    | Pública ou secreta | Situação                                                                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | URL pública do site (metadados e sitemap). Ex.: `http://localhost:3000` | É o endereço onde o site é publicado          | Pública            | Declarada no `.env.example`, **ainda não lida pelo código** (etapa 8)   |
| `WHATSAPP_NUMBER`              | Número do WhatsApp da loja: `55` + DDD + número, só dígitos (ex.: `5511988887777`) | O dono da loja (número real do atendimento)   | Só servidor (sem `NEXT_PUBLIC_`; o número chega ao navegador apenas dentro dos links `wa.me` já prontos) | **Em uso** desde a etapa 6 (links `wa.me`); renomeada em 2026-11-05 (ADR-0013); comentada no `.env.example` |
| `PERMITIR_DADOS_FICTICIOS` | `1` permite `next build`/`next start` com os dados fictícios de `data/ficticio.ts` (P74) | Você mesmo define | Só servidor | **Em uso** (etapa 8). Já no Playwright (`webServer.env`) e no `ci.yml`; no `.env.local` é ação do dono |

## Permissão para dados fictícios (`PERMITIR_DADOS_FICTICIOS`)

Enquanto `DADOS_FICTICIOS_ATIVOS = true`, **qualquer `next build`** (local, CI ou Vercel) falha com a mensagem "Build bloqueado" se `PERMITIR_DADOS_FICTICIOS=1` não estiver definida; `next dev` não precisa dela. Sem a permissão, `numeroDoWhatsApp()` devolve `null` (nenhum número fictício é usado). `npm run typecheck` (o `next typegen` carrega o `next.config.ts` na fase de build) e o hook de pre-commit do lefthook também exigem a variável. Defina `PERMITIR_DADOS_FICTICIOS=1` no `.env.local`, no Playwright e na CI (já feito nos dois últimos; na CI vai no `env` do workflow, valendo para todos os passos).

**Na Vercel, a variável vai só no ambiente Preview, nunca em Production.** Com `VERCEL_ENV=production` ela é ignorada: o build falha enquanto houver dados fictícios ou textos `[A DEFINIR`. Ao trocar os dados reais (etapa 9), a variável deixa de ser necessária.

## Trava de lacunas (`[A DEFINIR`)

Com `VERCEL_ENV=production`, o `next.config.ts` também falha se restar qualquer `[A DEFINIR` nos textos do assistente (`TEXTOS_DO_ROTEIRO`, `AVISO_DE_NOVA_ABA`) ou em `data/` (queijos, artigos, categorias, kits, produtores). A mensagem lista cada caminho. `[FOTO: …]`, `[PREÇO]`, `[n]` e `[TEXTO DO ARTIGO]` não travam. Se mais de uma trava falhar (URL do site, lacunas, dados fictícios), todas aparecem numa só mensagem. `npm run medir:pacote` também falha se o número fictício do WhatsApp aparecer em `.next/static`.

## Regra do WhatsApp

A leitura é feita por `numeroDoWhatsApp()` em `lib/whatsapp.server.ts` (módulo com `import 'server-only'`: o build falha se um Client Component o importar). O número fictício (`NUMERO_WHATSAPP_FICTICIO`) continua em `data/ficticio.ts`:

- Se a variável estiver no formato `^55\d{10,11}$`, vale o número informado.
- Se estiver vazia ou inválida onde dados fictícios são permitidos (`next dev`, testes ou `PERMITIR_DADOS_FICTICIOS=1`), vale o número **fictício** `5520900000000`; sem essa permissão, `null`.
- Se estiver vazia ou inválida **em produção** (`VERCEL_ENV=production`) ou sem permissão, o resultado é `null` e a interface deve **esconder** os links do WhatsApp.

`numeroDoWhatsApp()` roda **só no servidor** (`app/layout.tsx`) e entrega o número ao navegador por prop, porque `VERCEL_ENV` não existe no navegador. Como a leitura acontece na pré-renderização, trocar `WHATSAPP_NUMBER` na Vercel só vale depois de um novo deploy. Consequência: **publique somente na Vercel** ou garanta que `VERCEL_ENV=production` esteja definida no ambiente de produção; sem ela, em `next start` sem `PERMITIR_DADOS_FICTICIOS` o número é `null` (nunca o fictício), mas o `VERCEL_ENV` ausente desliga as travas de produção. O `postbuild` (abaixo) confere que o número fictício `5520900000000` não aparece em `.next/static`. Sem número em produção, **nenhum link `wa.me` é renderizado**: somem a faixa "Prefere falar com uma pessoa?" do painel, o botão verde da aba Queijista e a linha "Dúvidas sobre este queijo? Fale com um queijista" do produto. A aba Queijista mantém só o texto do horário.

Quem usa o número: `app/layout.tsx` (servidor) chama `numeroDoWhatsApp()` e passa o resultado ao `AtendimentoProvider`; `components/LinkDoWhatsApp.tsx` monta o link com `linkDoWhatsApp` (`lib/whatsapp.ts`). Um teste barra qualquer arquivo `'use client'` que importe `numeroDoWhatsApp`. A mensagem do link é sempre um texto fixo da spec (§8.3); nada digitado no chat entra na URL.

## Trava de produção (`VERCEL_ENV`)

`VERCEL_ENV` é definida pela Vercel, não por nós. Com `VERCEL_ENV=production` e `DADOS_FICTICIOS_ATIVOS = true` em `data/ficticio.ts`, o `next.config.ts` **faz o build falhar** com a mensagem "Build de produção bloqueado". Isso impede publicar dados fictícios por engano. O build local não é afetado (a trava não usa `NODE_ENV`).

Para liberar a publicação: troque todos os dados de `data/ficticio.ts` pelos reais, remova `DADOS_FICTICIOS_ATIVOS` e as chamadas de `exigirDadosFicticiosPermitidos` e `exigirSemDadosFicticiosEmProducao` no `next.config.ts`, ajuste ou remova `conferirNumeroFicticio` (`scripts/conferir-build.mjs` e `scripts/medir-pacote.mjs`), tire `PERMITIR_DADOS_FICTICIOS` da Vercel (Preview), da CI e do Playwright, e atualize os testes que citam os valores fictícios. Este passo é item do checklist de aceite da etapa 9 em [`docs/PLANO.md`](PLANO.md).

## Conferência pós-build (`postbuild`) e Vercel Toolbar

O `npm run build` roda `scripts/conferir-build.mjs` em seguida (`postbuild`, sem dependências). Ele **sempre** falha se o número fictício do WhatsApp (`NUMERO_WHATSAPP_FICTICIO`) aparecer em `.next/static`, e, **com `VERCEL_ENV=production`**, falha se `[A DEFINIR` aparecer em `.next/server/app/**/*.html` ou `*.rsc`, listando arquivo e trecho (pega lacunas fixas no JSX, que a trava P73 sobre `data/` não vê). Para simular localmente contra o build atual: `VERCEL_ENV=production node scripts/conferir-build.mjs` (no PowerShell: `$env:VERCEL_ENV='production'; node scripts/conferir-build.mjs`).

A trava do `next build` (P74) exige `PERMITIR_DADOS_FICTICIOS=1` **mesmo com `NODE_ENV=test` ou `development`**, e a CSP de desenvolvimento (`'unsafe-eval'`) só vale em `next dev` (fase `phase-development-server`).

**Ação do dono:** a CSP bloqueia `vercel.live`, então desligue o Vercel Toolbar em pré-produção (Settings → General → Vercel Toolbar) ou defina `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` no ambiente Preview.

## Robots e `VERCEL_ENV` no build

`app/robots.ts` usa `ehProducao()` (`lib/site.ts`), que lê `VERCEL_ENV`. O `robots.txt` é gerado no build, então o valor vale o do ambiente **do build**: só com `VERCEL_ENV=production` ele libera tudo e aponta para o sitemap; em prévia e local é `Disallow: /`. Um build de produção feito fora da Vercel (sem `VERCEL_ENV`) bloqueia a indexação.

## Fora do escopo por enquanto

Chaves do gateway (Mercado Pago), segredos de webhook, chave de criptografia das Server Actions e demais variáveis de hospedagem serão documentadas na etapa 9, com os ADRs de hospedagem e gateway.
