# ADR-0017 — Hospedagem na Vercel e ambientes (local, CI, Preview e Production)

- **Status:** Aceito (2026-11-17), conforme o P96 = A do `docs/PLANO.md`. Registra decisões já tomadas pelo dono (D31; 2026-11-11; 2026-11-17); as conferências que faltam seguem na tarefa 11.
- **Data:** 2026-11-17
- **Contexto da etapa:** 9 (CI completo, ambientes e checklist de aceite)

## Contexto

A D31 (2026-11-03) escolheu a **Vercel** e pediu um ADR na etapa 9. Desde então, o dono decidiu e configurou o seguinte:

- **Projeto na Vercel** (2026-11-11), criado pelo dono a partir do GitHub.
- **Branch de produção:** `producao`. Já existe e ainda não teve deploy. Só recebe *push* com conteúdo real e aprovação explícita do dono.
- **Preview:** a `main` gera Preview, com os dados fictícios e com `Disallow: /`.
- **Variáveis:**
  - `NEXT_PUBLIC_SITE_URL=https://atelie-do-queijo.vercel.app` em Production e Preview;
  - `PERMITIR_DADOS_FICTICIOS=1` só em Preview;
  - `WHATSAPP_NUMBER` só quando houver o número real.
- **Node 24** (2026-11-17): `engines: 24.x` e `.nvmrc` 24. Uma faixa como `>=24 <27` faria a Vercel publicar com o 26.x (documentação "Supported Node.js versions").

Já implementado nas etapas 6 e 8 e documentado em `docs/ambiente.md`:

- travas de build contra dados fictícios (P74) e contra `[A DEFINIR` em produção (P73);
- `postbuild` que procura o número fictício em `.next/static`;
- `urlDoSite()` obrigatória e `https` em produção (P69);
- `robots.txt` que só libera a indexação com `VERCEL_ENV=production`;
- cabeçalhos e CSP (ADR-0015);
- número do WhatsApp só no servidor (ADR-0013).

A herança da etapa 4 deixou três conferências de hospedagem: `Host`/`X-Forwarded-Host` e `serverActions.allowedOrigins`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` estável entre instâncias, e logs sem corpo de POST.

## Decisão

1. **Quatro ambientes, com a mesma regra de dados:**

   | Ambiente | Onde | `VERCEL_ENV` | Dados fictícios | Indexação | Quem publica |
   | --- | --- | --- | --- | --- | --- |
   | Local | Computador do dono | — | Permitidos com `PERMITIR_DADOS_FICTICIOS=1` no `.env.local` | — | — |
   | CI | GitHub Actions | — | Permitidos (`env` do *workflow*) | — | — |
   | Preview | Vercel, a partir da `main` e de PRs | `preview` | Permitidos (variável só em Preview) | `Disallow: /` | Automático a cada *push* |
   | Production | Vercel, a partir da `producao` | `production` | **Proibidos**: o build falha | Liberada | Só o dono, por PR `main` → `producao`, depois do checklist de publicação |

2. **Promoção para produção só por PR da `main` para a `producao`**, aberto e aprovado pelo dono. Os agentes nunca dão *push* na `producao` (regra do `CLAUDE.md`). O *ruleset* do P93 transforma essa regra em barreira técnica, porque os agentes usam as credenciais do próprio dono e uma regra do tipo "só o dono pode publicar" não os distinguiria.
3. **Preview continua protegido** (Deployment Protection da Vercel), porque publica dados fictícios. Conferências que precisam de página pública (validador do Google) usam o modo "código" da ferramenta, com o HTML do build colado, sem abrir o Preview.
4. **Vercel Toolbar desligada em Preview** (ou `VERCEL_PREVIEW_FEEDBACK_ENABLED=0`), porque a CSP do ADR-0015 bloqueia `vercel.live` (ação do dono registrada na etapa 8).
5. **Node 24 na Vercel**, lido do `engines`. A migração para o 26 fica para um ADR próprio, quando houver motivo.
6. **Server Actions, origem e logs:** a tarefa de conferência da etapa 9 confirma, **na documentação do Next 16.4.6 e da Vercel**, que:
   - a Vercel serve a página e a Server Action na mesma origem e repassa `Host` e `X-Forwarded-Host` coerentes, então `serverActions.allowedOrigins` fica vazio (sem a lista só passa a mesma origem, mas requisições sem cabeçalho `Origin`, de clientes fora do navegador, passam com aviso, conforme a documentação do Next 16.4.6 instalada; por isso a validação Zod e o limite de taxa das ações continuam necessários);
   - a chave de criptografia das Server Actions é estável dentro de um mesmo deploy, então `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` não é necessária na Vercel. Seria necessária num servidor próprio com várias instâncias;
   - os logs de execução da Vercel não registram o corpo das requisições POST;
   - o código não registra nada (conferido na etapa 8: nenhum `console.*` no servidor).

   Se a documentação disser outra coisa, o item vira tarefa com correção, e este ADR é atualizado antes do aceite.

   **Conferido em 2026-11-18 (tarefa 11):** os quatro pontos se confirmam, sem mudança de código. Fontes, URLs e datas em [`docs/ambiente.md`](../ambiente.md#server-actions-origem-e-logs-na-vercel-conferido-em-2026-11-18). Nuances: a Vercel não documenta `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (a conclusão vem do guia de _self-hosting_ do Next, que a exige só com várias instâncias), e a ausência do corpo de POST nos logs vem da lista completa de campos dos _runtime logs_, não de uma frase explícita. O teste `lib/hospedagem.test.ts` protege a ausência de `allowedOrigins`. A conferência reabre se houver _proxy_/CDN na frente da Vercel ou se o site sair dela.
7. **Plano da Vercel:** a documentação da Vercel ("Fair use guidelines" e "Hobby plan") restringe o plano Hobby a uso pessoal **não comercial**. Uma loja que vende exige o plano Pro (pago) ou Enterprise. Enquanto a loja for simulada e só houver Preview, nada muda. A troca de plano é decisão e custo do dono, **antes** da publicação real.
8. **Domínio próprio:** fica para a publicação real. Ao trocar, basta mudar `NEXT_PUBLIC_SITE_URL` e publicar de novo (canônicas, sitemap e Open Graph mudam no build).

## Alternativas consideradas

- **Outra hospedagem (servidor próprio, Netlify, Cloudflare):** fora da D31. Num servidor próprio, `VERCEL_ENV` não existiria e as travas de produção teriam de ser religadas por outra variável (risco anotado no ADR-0013 e em `docs/ambiente.md`). Rejeitada.
- **Production a partir da `main`:** cada *push* dos agentes iria ao ar. Rejeitada pelo dono em 2026-11-11.
- **Preview público:** expõe dados fictícios (CNPJ, endereço, frete) num endereço da Vercel. Rejeitada.

## Consequências

- O fluxo de publicação ganha um passo explícito do dono (PR `main` → `producao`). Nenhum *push* acidental chega à produção, e as travas de build continuam como segunda barreira.
- O plano Pro da Vercel entra na lista de custos da publicação real.
- O checklist de publicação (etapa 9, fase 2) cita este ADR: remover as travas de dados fictícios, conferir `VERCEL_ENV=production` no primeiro deploy, Lighthouse SEO 100 nas páginas públicas em produção e validador do Google no endereço público.
- Se um dia o site sair da Vercel, este ADR é substituído, e as travas que dependem de `VERCEL_ENV` precisam de revisão antes.
