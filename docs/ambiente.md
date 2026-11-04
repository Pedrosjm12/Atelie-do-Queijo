# Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. **Nunca** coloque valores reais no `.env.example` nem versione o `.env.local`. Hoje existem apenas variáveis **públicas** (prefixo `NEXT_PUBLIC_`): o valor vai para o navegador e qualquer pessoa pode lê-lo. **Não coloque segredos nelas.** Não há variável secreta ainda; elas chegam com o gateway de pagamento (etapa 9).

| Variável                       | Para que serve                                                       | Onde obter                                    | Pública ou secreta | Situação                                                                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | URL pública do site (metadados e sitemap). Ex.: `http://localhost:3000` | É o endereço onde o site é publicado          | Pública            | Declarada no `.env.example`, **ainda não lida pelo código** (etapa 8)   |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`  | Número do WhatsApp da loja: `55` + DDD + número, só dígitos (ex.: `5511988887777`) | O dono da loja (número real do atendimento)   | Pública            | Comentada no `.env.example`; os links entram na etapa 6                 |

## Regra do WhatsApp

A leitura é feita por `numeroDoWhatsApp()` em `data/ficticio.ts`:

- Se a variável estiver no formato `^55\d{10,11}$`, vale o número informado.
- Se estiver vazia ou inválida **fora de produção**, vale o número **fictício** `5520900000000`.
- Se estiver vazia ou inválida **em produção** (`VERCEL_ENV=production`), o resultado é `null` e a interface deve **esconder** os links do WhatsApp.

`numeroDoWhatsApp()` roda **só no servidor** (`app/layout.tsx`) e entrega o número ao navegador por prop, porque `VERCEL_ENV` não existe no navegador. Consequência: **publique somente na Vercel** ou garanta que `VERCEL_ENV=production` esteja definida no ambiente de produção; sem ela, o site publicaria o número fictício. Depois do build de produção, confira que `5520900000000` não aparece em `.next/static` (`grep -r 5520900000000 .next/static` não deve achar nada). Sem número em produção, a faixa "Prefere falar com uma pessoa?" do painel e os botões do WhatsApp somem.

## Trava de produção (`VERCEL_ENV`)

`VERCEL_ENV` é definida pela Vercel, não por nós. Com `VERCEL_ENV=production` e `DADOS_FICTICIOS_ATIVOS = true` em `data/ficticio.ts`, o `next.config.ts` **faz o build falhar** com a mensagem "Build de produção bloqueado". Isso impede publicar dados fictícios por engano. O build local não é afetado (a trava não usa `NODE_ENV`).

Para liberar a publicação: troque todos os dados de `data/ficticio.ts` pelos reais, remova `DADOS_FICTICIOS_ATIVOS` e a chamada de `exigirSemDadosFicticiosEmProducao` no `next.config.ts`, e atualize os testes que citam os valores fictícios. Este passo é item do checklist de aceite da etapa 9 em [`docs/PLANO.md`](PLANO.md).

## Fora do escopo por enquanto

Chaves do gateway (Mercado Pago), segredos de webhook, chave de criptografia das Server Actions e demais variáveis de hospedagem serão documentadas na etapa 9, com os ADRs de hospedagem e gateway.
