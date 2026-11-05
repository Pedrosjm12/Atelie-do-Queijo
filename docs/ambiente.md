# Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. **Nunca** coloque valores reais no `.env.example` nem versione o `.env.local`. Variáveis com prefixo `NEXT_PUBLIC_` são **públicas**: o valor vai para o navegador e qualquer pessoa pode lê-lo. **Não coloque segredos nelas.** Variáveis **sem** o prefixo ficam só no servidor. Segredos de verdade (gateway de pagamento) chegam na etapa 9.

> **AÇÃO DO DONO (renomeação de 2026-11-05).** A variável `NEXT_PUBLIC_WHATSAPP_NUMBER` passou a se chamar **`WHATSAPP_NUMBER`**. Quem já a tinha definida deve **criar `WHATSAPP_NUMBER`** no `.env.local` **e** nas variáveis do projeto na **Vercel** (Production e Preview), com o mesmo valor, e apagar a antiga. Sem isso, o código ignora o valor: fora de produção vale o número fictício; em produção (`VERCEL_ENV=production`) os links do WhatsApp somem.

| Variável                       | Para que serve                                                       | Onde obter                                    | Pública ou secreta | Situação                                                                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | URL pública do site (metadados e sitemap). Ex.: `http://localhost:3000` | É o endereço onde o site é publicado          | Pública            | Declarada no `.env.example`, **ainda não lida pelo código** (etapa 8)   |
| `WHATSAPP_NUMBER`              | Número do WhatsApp da loja: `55` + DDD + número, só dígitos (ex.: `5511988887777`) | O dono da loja (número real do atendimento)   | Só servidor (sem `NEXT_PUBLIC_`; o número chega ao navegador apenas dentro dos links `wa.me` já prontos) | **Em uso** desde a etapa 6 (links `wa.me`); renomeada em 2026-11-05 (ADR-0013); comentada no `.env.example` |

## Regra do WhatsApp

A leitura é feita por `numeroDoWhatsApp()` em `lib/whatsapp.server.ts` (módulo com `import 'server-only'`: o build falha se um Client Component o importar). O número fictício (`NUMERO_WHATSAPP_FICTICIO`) continua em `data/ficticio.ts`:

- Se a variável estiver no formato `^55\d{10,11}$`, vale o número informado.
- Se estiver vazia ou inválida **fora de produção**, vale o número **fictício** `5520900000000`.
- Se estiver vazia ou inválida **em produção** (`VERCEL_ENV=production`), o resultado é `null` e a interface deve **esconder** os links do WhatsApp.

`numeroDoWhatsApp()` roda **só no servidor** (`app/layout.tsx`) e entrega o número ao navegador por prop, porque `VERCEL_ENV` não existe no navegador. Como a leitura acontece na pré-renderização, trocar `WHATSAPP_NUMBER` na Vercel só vale depois de um novo deploy. Consequência: **publique somente na Vercel** ou garanta que `VERCEL_ENV=production` esteja definida no ambiente de produção; sem ela, o site publicaria o número fictício. Depois do build de produção, confira que o número fictício `5520900000000` (e, com o número real configurado, o real) não aparece em `.next/static` (`grep -r 5520900000000 .next/static` não deve achar nada). Sem número em produção, **nenhum link `wa.me` é renderizado**: somem a faixa "Prefere falar com uma pessoa?" do painel, o botão verde da aba Queijista e a linha "Dúvidas sobre este queijo? Fale com um queijista" do produto. A aba Queijista mantém só o texto do horário.

Quem usa o número: `app/layout.tsx` (servidor) chama `numeroDoWhatsApp()` e passa o resultado ao `AtendimentoProvider`; `components/LinkDoWhatsApp.tsx` monta o link com `linkDoWhatsApp` (`lib/whatsapp.ts`). Um teste barra qualquer arquivo `'use client'` que importe `numeroDoWhatsApp`. A mensagem do link é sempre um texto fixo da spec (§8.3); nada digitado no chat entra na URL.

## Trava de produção (`VERCEL_ENV`)

`VERCEL_ENV` é definida pela Vercel, não por nós. Com `VERCEL_ENV=production` e `DADOS_FICTICIOS_ATIVOS = true` em `data/ficticio.ts`, o `next.config.ts` **faz o build falhar** com a mensagem "Build de produção bloqueado". Isso impede publicar dados fictícios por engano. O build local não é afetado (a trava não usa `NODE_ENV`).

Para liberar a publicação: troque todos os dados de `data/ficticio.ts` pelos reais, remova `DADOS_FICTICIOS_ATIVOS` e a chamada de `exigirSemDadosFicticiosEmProducao` no `next.config.ts`, e atualize os testes que citam os valores fictícios. Este passo é item do checklist de aceite da etapa 9 em [`docs/PLANO.md`](PLANO.md).

## Fora do escopo por enquanto

Chaves do gateway (Mercado Pago), segredos de webhook, chave de criptografia das Server Actions e demais variáveis de hospedagem serão documentadas na etapa 9, com os ADRs de hospedagem e gateway.
