# Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. **Nunca** coloque valores reais no `.env.example` nem versione o `.env.local`. Variáveis com prefixo `NEXT_PUBLIC_` são **públicas**: o valor vai para o navegador e qualquer pessoa pode lê-lo. **Não coloque segredos nelas.** Variáveis **sem** o prefixo ficam só no servidor. Segredos de verdade (gateway de pagamento) chegam na etapa 9.

> **AÇÃO DO DONO (renomeação de 2026-11-05).** A variável `NEXT_PUBLIC_WHATSAPP_NUMBER` passou a se chamar **`WHATSAPP_NUMBER`**. Quem já a tinha definida deve **criar `WHATSAPP_NUMBER`** no `.env.local` **e** nas variáveis do projeto na **Vercel** (Production e Preview), com o mesmo valor, e apagar a antiga. Sem isso, o código ignora o valor: fora de produção vale o número fictício; em produção (`VERCEL_ENV=production`) os links do WhatsApp somem.

| Variável                       | Para que serve                                                       | Onde obter                                    | Pública ou secreta | Situação                                                                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | Endereço público do site: base das canônicas, do sitemap, do `robots.txt`, do Open Graph e do JSON-LD. Só o endereço, sem caminho, `?` ou `#`. Ex.: `https://www.seudominio.com.br` | É o endereço onde o site é publicado | Pública | **Em uso** (etapa 8, `lib/site.ts`). **Obrigatória e `https` em produção** (`VERCEL_ENV=production`): o build falha sem ela. Fora de produção, vazia vale `http://localhost:3000` |
| `WHATSAPP_NUMBER`              | Número do WhatsApp da loja: `55` + DDD + número, só dígitos (ex.: `5511988887777`) | O dono da loja (número real do atendimento)   | Só servidor (sem `NEXT_PUBLIC_`; o número chega ao navegador apenas dentro dos links `wa.me` já prontos) | **Em uso** desde a etapa 6 (links `wa.me`); renomeada em 2026-11-05 (ADR-0013); comentada no `.env.example` |
| `PERMITIR_DADOS_FICTICIOS` | `1` permite `next build`/`next start` com os dados fictícios de `data/ficticio.ts` (P74) | Você mesmo define | Só servidor | **Em uso** (etapa 8). Já no Playwright (`webServer.env`) e no `ci.yml`; no `.env.local` é ação do dono |

## Permissão para dados fictícios (`PERMITIR_DADOS_FICTICIOS`)

Enquanto `DADOS_FICTICIOS_ATIVOS = true`, **qualquer `next build`** (local, CI ou Vercel) falha com a mensagem "Build bloqueado" se `PERMITIR_DADOS_FICTICIOS=1` não estiver definida; `next dev` não precisa dela. Sem a permissão, `numeroDoWhatsApp()` devolve `null` (nenhum número fictício é usado). `npm run typecheck` (o `next typegen` carrega o `next.config.ts` na fase de build) e o hook de pre-commit do lefthook também exigem a variável. Defina `PERMITIR_DADOS_FICTICIOS=1` no `.env.local`, no Playwright e na CI (já feito nos dois últimos; na CI vai no `env` do workflow, valendo para todos os passos).

**Na Vercel, a variável vai só no ambiente Preview, nunca em Production.** Com `VERCEL_ENV=production` ela é ignorada: o build falha enquanto houver dados fictícios ou textos `[A DEFINIR`. Ao trocar os dados reais (etapa 9), a variável deixa de ser necessária.

## Endereço do site (`NEXT_PUBLIC_SITE_URL`)

Em produção (`VERCEL_ENV=production`) a variável é **obrigatória** e precisa começar com `https://`. O build falha se ela faltar, se for `http://` ou se tiver caminho, `?` ou `#` (por exemplo `https://www.seudominio.com.br/loja` é recusada). Fora de produção, vazia vale `http://localhost:3000`, e `http://` é aceito. Na Vercel, defina-a em Production e Preview. Se o domínio mudar, troque o valor e publique de novo: canônicas, sitemap e Open Graph só mudam no próximo build. A regra está em `urlDoSite()` (`lib/site.ts`).

## Permissão obrigatória em todo build de produção (`PERMITIR_DADOS_FICTICIOS=1`)

Enquanto existirem dados fictícios (`DADOS_FICTICIOS_ATIVOS = true` em `data/ficticio.ts`), **todo** `next build` precisa de `PERMITIR_DADOS_FICTICIOS=1`, em qualquer computador ou servidor, mesmo que o ambiente se declare `test` ou `development`. Sem ela o build falha com "Build bloqueado". Só o `next dev` dispensa. Resumo:

| Onde o build roda | O que fazer |
| --- | --- |
| Seu computador | `PERMITIR_DADOS_FICTICIOS=1` no `.env.local` |
| GitHub Actions (CI) e Playwright | Já definida no `ci.yml` e no `playwright.config.ts` |
| Vercel, Preview | Definir `PERMITIR_DADOS_FICTICIOS=1` |
| Vercel, Production | **Nunca definir.** Com `VERCEL_ENV=production` ela é ignorada e o build falha enquanto houver dado fictício ou `[A DEFINIR` |

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

## Cabeçalhos de segurança e CSP: como liberar um domínio novo

Todas as páginas saem com cabeçalhos de segurança e uma política de conteúdo (CSP), decididos no [ADR-0015](adr/0015-cabecalhos-http-e-csp.md) e montados em `lib/cabecalhos.ts` (usado pelo `next.config.ts`). Por padrão **nada de outro domínio é permitido**: imagens, fontes, scripts e conexões só do próprio site. Se um recurso de outro endereço for bloqueado, o navegador mostra um erro de CSP no console e o recurso não carrega.

Para liberar um domínio novo (uma ferramenta de análise, um vídeo, o gateway de pagamento):

1. Descubra qual tipo de recurso é e escolha a diretiva em `politicaDeConteudo()` (`lib/cabecalhos.ts`): `script-src` (scripts), `img-src` (imagens), `font-src` (fontes), `connect-src` (requisições do site para fora), `frame-src` (molduras de outros sites; hoje não existe, cai em `default-src 'self'`).
2. Acrescente **só o domínio necessário** a essa diretiva, por exemplo `"img-src 'self' data: blob: https://images.exemplo.com"`. Nunca use `*` nem `https:` solto.
3. Atualize o teste de `lib/cabecalhos.test.ts` e o `e2e/cabecalhos.spec.ts`, e registre o motivo no ADR-0015 (ou num ADR novo, se for o gateway).
4. Peça a revisão do `auditor-de-seguranca` antes de publicar: abrir um domínio é abrir uma porta.

Já previstos no ADR, para quando houver o primeiro modelo 3D comprimido: `worker-src 'self' blob:` e `'wasm-unsafe-eval'`. O checkout real (Mercado Pago, etapa 9) vai pedir domínios próprios. A CSP vale para páginas abertas no navegador; buscadores e redes sociais que leem a imagem de compartilhamento não são afetados. Em `next dev` a CSP ganha `'unsafe-eval'` (o React precisa). Para quem não é técnico: **não edite `lib/cabecalhos.ts` por conta própria**; peça a quem mantém o código.

## Docker Desktop para a regressão visual

A regressão visual compara capturas de tela das páginas com imagens de referência (`e2e/visual/capturas-linux/`, 22 arquivos). As referências são feitas no **Linux**, porque fontes e suavização mudam de um sistema para outro. Para rodar o Linux no seu Windows usamos o **Docker Desktop**. **Nada precisa ser configurado**, e o login na conta Docker é dispensável.

**Para rodar a conferência**

1. Abra o Docker Desktop e espere aparecer **Engine running** (embaixo, à esquerda).
2. No terminal, na pasta do projeto, rode `npm run test:visual:docker`.
3. Se alguma tela mudou sem querer, o teste falha e mostra a diferença. Para **gerar ou atualizar** as imagens de referência de propósito (depois de uma mudança de visual aprovada): `npm run test:visual:docker -- --update-snapshots`. Peça ao `guardiao-do-design` para conferir as imagens novas antes do commit.

**O que o script faz sozinho** (`scripts/visual-docker.mjs`): baixa a imagem oficial `mcr.microsoft.com/playwright:v<versão>-noble` (a versão é a do `@playwright/test` instalado; o primeiro download é grande e demora), guarda as dependências e o build nos volumes `atelie-visual-node-modules` e `atelie-visual-next` (não mistura com as pastas do Windows) e só roda `npm ci` quando o `package-lock.json` muda. A primeira execução é a mais lenta; as seguintes levam cerca de 1 minuto mais o build. Sem o Docker aberto, o script avisa "O Docker Desktop está aberto?".

**Cuidado com a memória (computador com 7,3 GB de RAM).** O Docker Desktop ocupa memória mesmo parado. **Antes de rodar `npm run test:e2e`, feche o Docker Desktop** (ícone da baleia na bandeja do Windows, botão direito, **Quit**); uma execução completa já foi interrompida por falta de memória com ele aberto. Dicas opcionais:

- Para o Docker não abrir sozinho: Docker Desktop, Settings, General, desmarque **Start Docker Desktop when you sign in**.
- Para limitar a memória do Docker: crie o arquivo `%USERPROFILE%\.wslconfig` com o texto abaixo e depois rode `wsl --shutdown` no terminal (o Docker reinicia com o novo limite):

```ini
[wsl2]
memory=3GB
```

- Se o `npm run test:e2e` ainda ficar pesado: `npx playwright test --workers=2`.

**Node dentro do contêiner:** a imagem do Playwright traz Node 26, enquanto o projeto pede `24.x` (`engines` e `.nvmrc`). Isso não afeta as capturas, que dependem do Chromium da imagem. Por decisão do dono (2026-11-17), o `npm ci` do contêiner roda com `--loglevel=error`, o que esconde o aviso `EBADENGINE`. **Não amplie o `engines`** (por exemplo, para `>=24 <27`): a Vercel lê esse campo e publicaria com o Node 26. Produção, CI e a máquina local continuam no Node 24.

## Robots e `VERCEL_ENV` no build

`app/robots.ts` usa `ehProducao()` (`lib/site.ts`), que lê `VERCEL_ENV`. O `robots.txt` é gerado no build, então o valor vale o do ambiente **do build**: só com `VERCEL_ENV=production` ele libera tudo e aponta para o sitemap; em prévia e local é `Disallow: /`. Um build de produção feito fora da Vercel (sem `VERCEL_ENV`) bloqueia a indexação.

## Os quatro ambientes

Decisão no [ADR-0017](adr/0017-hospedagem-na-vercel-e-ambientes.md). A regra de dados é a mesma em todos: dado fictício só onde há `PERMITIR_DADOS_FICTICIOS=1`, nunca em Production.

| Ambiente   | Onde                                | `VERCEL_ENV` | Dados fictícios                                   | Indexação (`robots.txt`) | Quem publica                                                |
| ---------- | ----------------------------------- | ------------ | ------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| Local      | Computador do dono                  | (nenhum)     | Permitidos com `PERMITIR_DADOS_FICTICIOS=1` no `.env.local` | `Disallow: /`            | Ninguém (só você vê)                                        |
| CI         | GitHub Actions                      | (nenhum)     | Permitidos (`env` do `ci.yml`)                    | `Disallow: /`            | Automático a cada PR e a cada _push_                        |
| Preview    | Vercel, a partir da `main` e de PRs | `preview`    | Permitidos (variável só em Preview)               | `Disallow: /`            | Automático a cada _push_; acesso protegido pela Vercel      |
| Production | Vercel, a partir da `producao`      | `production` | **Proibidos**: o build falha                      | Liberada                 | Só o dono, por PR `main` → `producao`, após o checklist     |

## Server Actions, origem e logs na Vercel (conferido em 2026-11-18)

Conferência da decisão 6 do ADR-0017, feita na documentação instalada do Next 16.4.6 (`node_modules/next/dist/docs`, igual à de nextjs.org/docs) e na documentação da Vercel. **Resultado: nenhuma mudança de código é necessária.** O `next.config.ts` não define `serverActions.allowedOrigins`, e o teste `lib/hospedagem.test.ts` impede que alguém abra essa lista sem atualizar o ADR.

| Ponto | Conclusão | Fonte (consultada em 2026-11-18) |
| --- | --- | --- |
| `serverActions.allowedOrigins` | **Desnecessário.** O Next compara o `Origin` com o `x-forwarded-host` (ou `host`) e recusa se forem diferentes; sem a lista, só a mesma origem passa, mas requisições sem cabeçalho `Origin` (clientes fora do navegador, como `curl`) passam com um aviso (documentação do Next 16.4.6 instalada). Por isso a validação Zod e o limite de taxa das ações continuam necessários: `allowedOrigins` não é a defesa contra abuso. Atrás de um _proxy_ nenhuma entrada é necessária desde que ele repasse o host público em `x-forwarded-host`. Na Vercel, `host` é "o nome de domínio como o cliente o acessou" (com domínio próprio, o domínio, não a URL `*.vercel.app`) e `x-forwarded-host` é "idêntico ao `host`". Páginas e Server Actions saem da mesma origem. | Next: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md` (versão 16.4.6) e `.../02-guides/data-security.md` (seção "Allowed origins"), equivalentes a https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions. Vercel: https://vercel.com/docs/headers/request-headers (atualizada em 2025-12-13) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Desnecessária.** O Next gera uma chave por _build_, embutida na saída do _build_, e ela só protege as variáveis capturadas em _closures_ de Server Actions. O guia de _self-hosting_ exige chave fixa só quando há **várias instâncias** de servidor (por exemplo, contêineres atrás de um balanceador), para evitar "Failed to find Server Action". Na Vercel cada _deploy_ é um _build_ único, com uma só chave. Com o plano Pro, o _Skew Protection_ (ativo por padrão em projetos criados após 2024-11-19) ainda fixa as Server Actions do navegador ao _deploy_ que serviu a página; no Hobby ele não existe, e uma página aberta de um _deploy_ antigo pode falhar ao enviar uma Server Action para o _deploy_ novo até recarregar (comportamento normal, sem relação com a chave). O projeto também só tem Server Actions de **módulo** (`app/_acoes/frete.ts` e `pedido.ts`), sem variáveis capturadas. A Vercel não documenta essa variável para Next.js. | Next: `.../02-guides/self-hosting.md` (seção "Server Functions encryption key") e `.../02-guides/data-security.md` (seção "Overwriting encryption keys (advanced)"), equivalentes a https://nextjs.org/docs/app/guides/self-hosting. Vercel: https://vercel.com/docs/skew-protection (atualizada em 2026-09-16) |
| Logs sem corpo de POST | **Confirmado pelos campos documentados.** Os _runtime logs_ da Vercel mostram método, caminho, _status_, host, ID da requisição, _user agent_, parâmetros de busca, região, _cache_, metadados da função e as mensagens que o próprio código escreve (`console.*`). Não há corpo nem cabeçalhos da requisição. A Vercel não traz uma frase "não gravamos o corpo": a conclusão vem da lista completa de campos. O código do servidor não escreve nada (nenhum `console.*` em `app/`, `lib/` ou `components/` além de um `console.error` do navegador, só fora de produção). | https://vercel.com/docs/logs/runtime (atualizada em 2026-08-28) e https://vercel.com/docs/functions/logs (atualizada em 2026-08-11) |

**Quando reabrir esta conferência:**

- se o site passar a ficar atrás de outro _proxy_ ou CDN (Cloudflare, por exemplo) na frente da Vercel: aí o `host` pode mudar, e a origem do navegador precisa estar em `allowedOrigins` (só o domínio exato, sem `*`);
- se o site sair da Vercel para um servidor próprio com mais de uma instância: definir `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (base64 de 16, 24 ou 32 bytes, por exemplo `openssl rand -base64 32`) como segredo, e rever as travas que dependem de `VERCEL_ENV`;
- se um dia um _Log Drain_ (Pro) for criado: ele envia os mesmos campos; não inclua nele corpos de requisição nem escreva dados de cliente no código com `console.*`.

## O que conferir no painel da Vercel (ação do dono, ~5 min)

Estes quatro itens só existem no painel e não podem ser conferidos pelo código. Faça-os com o projeto aberto em vercel.com e **me avise o resultado de cada um** (OK ou o que apareceu). Não altere mais nada.

1. **Deployment Protection ligada em Preview.** Projeto, **Settings**, **Deployment Protection**. Em **Vercel Authentication** deve estar ligada, com o escopo **Standard Protection** (protege tudo, exceto os domínios de produção). Esperado: abrir uma URL de Preview numa janela anônima pede _login_ na Vercel. Em qualquer plano a Vercel Authentication é gratuita. Fonte: https://vercel.com/docs/deployment-protection (atualizada em 2026-09-15).
2. **Toolbar desligada em Preview.** Projeto, **Settings**, **General**, bloco **Vercel Toolbar**, em **Pre-Production Deployments**: escolha **Off**. Alternativa: variável `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` no ambiente Preview. Motivo: a CSP do ADR-0015 bloqueia `vercel.live`. Esperado: nenhum círculo com o logotipo da Vercel no canto da página do Preview e nenhum erro de CSP no console. Fonte: https://vercel.com/docs/vercel-toolbar/managing-toolbar (atualizada em 2026-08-11).
3. **`PERMITIR_DADOS_FICTICIOS` só em Preview.** Projeto, **Settings**, **Environment Variables**. Na linha dessa variável, a coluna de ambientes deve mostrar **só Preview** (valor `1`), sem Production e sem Development. Confira também que `NEXT_PUBLIC_SITE_URL` está em Production e Preview e que `WHATSAPP_NUMBER` não tem o número fictício. Esperado: um _deploy_ de Production com essa variável marcada falharia no _build_ de qualquer forma (trava P74), mas ela não deve estar lá.
4. **Node 24 no _log_ de build do Preview.** Projeto, **Deployments**, abra o último _deploy_ de Preview (`main`), botão **Build Logs**. Procure a linha de versão do Node (algo como `Node.js version 24.x`). O _log_ mostra "a versão das ferramentas de build", mas a Vercel não promete essa linha com esse texto. Se não a encontrar, confira **Settings**, **Build and Deployment**, **Node.js Version**: o `engines` `24.x` do `package.json` prevalece sobre esse campo, e a Vercel documenta que `24.x` implanta "a última 24.x". Se mesmo assim houver dúvida, avise: a prova certa é um `node -v` no comando de _build_, tarefa do `devops-e-deploy`. Fonte: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (atualizada em 2026-02-27).

## Plano da Vercel: Hobby × uso comercial

O plano **Hobby** (gratuito) vale só para uso **pessoal ou não comercial**. Os termos da Vercel dizem: "You shall only use the Services under a Hobby plan for your personal or non-commercial use" (https://vercel.com/legal/terms, atualizados em 2026-10-19; a página de uso justo, https://vercel.com/docs/limits/fair-use-guidelines, atualizada em 2026-11-12, remete a esses termos). Uma loja que vende queijo é uso comercial. A Vercel não escreve "comercial exige Pro" na página do Hobby, mas o plano acima do Hobby é o **Pro** (pago; comparação em https://vercel.com/docs/plans/hobby, atualizada em 2026-11-12).

- **Hoje** o site é simulado e só existe como Preview protegido: nada muda.
- **Antes da publicação real** (primeiro _push_ na `producao`), trocar para o Pro é **decisão e custo do dono**. Confira o preço atual em https://vercel.com/pricing e leia os termos antes de decidir. Em caso de dúvida jurídica sobre o que conta como "comercial", consulte um profissional.
- Efeitos práticos do Pro que importam aqui: _runtime logs_ de 1 dia (no Hobby, 1 hora), _Skew Protection_ (só Pro e Enterprise) e _Password Protection_ opcional.

## Fora do escopo por enquanto

Chaves do gateway (Mercado Pago) e segredos de webhook serão documentados na etapa 9, com os ADRs de hospedagem e gateway.
