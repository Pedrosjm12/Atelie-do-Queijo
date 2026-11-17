# ADR-0016 — CI completo: auditoria, atualização de dependências, regressão visual e Lighthouse CI

- **Status:** Aceito (2026-11-17), conforme o P96 = A do `docs/PLANO.md`. Repositório público (P85); P86 a P91 = A, A, A, A, B, B.
- **Data:** 2026-11-17
- **Contexto da etapa:** 9 (CI completo, ambientes e checklist de aceite)

## Contexto

O `.github/workflows/ci.yml` roda hoje, em todo *push* e *pull request* para a `main`, dois jobs no `ubuntu-latest`: `verificar` (lint, typecheck, Prettier, Vitest, `modelos:validar`, build) e `e2e` (Playwright, 338 testes no projeto `chromium`). As ações estão fixadas por *tag* (`@v7`), não por *commit*.

A etapa 8 deixou para a etapa 9 (mapa da herança e "Fica para depois"):

- `npm audit` e `npm audit signatures` no CI e um robô de atualização de dependências (Dependabot ou Renovate). A etapa 4 já pedia isso. A etapa 5 pediu `@google/model-viewer` e `three` agrupados. O ADR-0014 pediu `vitest` e `@vitest/coverage-v8` agrupados.
- Cobertura no CI. Hoje o `npm run test:cobertura` (catraca em `lib/` e `data/`) só roda à mão.
- Regressão visual no CI. As 22 capturas de `e2e/visual/capturas-linux/` são geradas por `npm run test:visual:docker` na imagem oficial `mcr.microsoft.com/playwright:v<versão>-noble`. O ADR-0014 já previa que o CI usaria a mesma imagem.
- Lighthouse automático. Na etapa 8 ele rodou à mão (`npx lighthouse@13.6.0`, perfil celular, mediana de 3). O ADR-0014 adiou o `@lhci/cli` para cá, "se o dono quiser a nota no CI".
- Avisos de licença de terceiros (`public/licencas-de-terceiros.txt`, ADR-0009).

Restrições que pesam na escolha:

- **Node 24** (`engines: 24.x`, `.nvmrc`). Não ampliar o `engines`, porque a Vercel publicaria com o Node 26 (decisão do dono de 2026-11-17).
- **Máquina do dono com 7,3 GB de RAM.** Tudo o que puder rodar no CI em vez do computador do dono é ganho.
- **Minutos do GitHub Actions.** São grátis nos *runners* padrão de repositório público. Em repositório privado no plano Free, a cota é de 2.000 minutos por mês (documentação do GitHub, "About billing for GitHub Actions"). A visibilidade do repositório é a P85.
- **Os agentes dão *push* direto na `main`** (fluxo do `CLAUDE.md`). Pull requests aparecem quase só com o robô de dependências.

Versões conferidas no registro do npm em 2026-11-17:

- `@lhci/cli` 0.16.1 (Apache-2.0, Node ≥ 22.19) depende de `lighthouse` **13.6.0** fixo, a mesma versão das medições da etapa 8.
- `lighthouse` 13.6.0 (Apache-2.0, Node ≥ 22.19).

## Decisão

1. **`ci.yml` ampliado, sem mudar o que já roda:**
   - ações fixadas por SHA do *commit*, com a versão em comentário (o Dependabot atualiza os dois);
   - `permissions: contents: read` em todos os jobs;
   - no job `verificar`, `npm run test:cobertura` substitui o `npm test`: roda os mesmos testes e acrescenta a catraca;
   - cache dos navegadores do Playwright, com a chave na versão instalada;
   - `timeout-minutes` recalculado a partir das durações medidas;
   - job novo `auditoria`, em paralelo ao `verificar`, com `npm audit signatures`, `npm audit --omit=dev` (falha com qualquer vulnerabilidade em dependência de produção) e a regra do P88 para as de desenvolvimento;
   - gatilhos novos: `workflow_dispatch` (botão manual) e `schedule` semanal na `main`, que pega aviso de segurança novo mesmo sem *commit*.
2. **Dependabot** (`.github/dependabot.yml`), se o P86 = A:
   - ecossistemas `npm` e `github-actions`, rodada semanal;
   - grupos: `next` + `eslint-config-next`; `react` + `react-dom` + `@types/react*`; `vitest` + `@vitest/coverage-v8`; `@google/model-viewer` + `three`; `@playwright/test` sozinho (troca a imagem da regressão visual); demais dependências de desenvolvimento, só *minor* e *patch*;
   - ignorados: *major* de `@types/node` (o projeto fica no Node 24) e *minor* de `three` (o `model-viewer` 4.4.0 aceita só 0.183.x, ADR-0009);
   - limite de PRs abertos e prefixo de commit `build(deps)` (npm) e `ci(deps)` (ações).
3. **`@playwright/test` com versão exata** (hoje `^1.64.1` → `1.64.1`). A imagem Docker da regressão visual é escolhida pela versão instalada (`scripts/visual-docker.mjs`), e a versão exata deixa explícito que trocar o Playwright é trocar o ambiente das capturas.
4. **Regressão visual em *workflow* próprio** (`.github/workflows/visual.yml`):
   - roda o mesmo `npm run test:visual:docker` no `ubuntu-latest`, que já traz o Docker, com a mesma imagem e o mesmo script do computador do dono. Não há uma segunda definição do ambiente;
   - nunca usa `--update-snapshots` no CI;
   - em caso de falha, publica as diferenças como artefato por 7 dias;
   - gatilho conforme o P90.
5. **Lighthouse CI com `@lhci/cli` 0.16.1** como dependência de desenvolvimento (P89 = A):
   - configuração em `lighthouserc.json`: build de produção com `PERMITIR_DADOS_FICTICIOS=1`, rotas `/`, `/queijos/canastra-curado`, `/presentes`, `/aprenda`, `/sacola` e `/checkout`, 3 execuções por rota, perfil celular padrão e mediana;
   - metas da etapa 8: Desempenho ≥ 90; Boas práticas ≥ 95; Acessibilidade ≥ 96, abaixo de 100 só pela exceção D34 dos `[FOTO: …]`; SEO com todas as auditorias aprovadas, **exceto `is-crawlable`**, que falha de propósito fora de produção;
   - relatórios **só** como artefato do GitHub (`upload.target: filesystem`), **nunca** no `temporary-public-storage`, que publica o relatório num endereço público do Google;
   - script `npm run lighthouse` para rodar o mesmo no computador do dono;
   - *workflow* próprio (`.github/workflows/lighthouse.yml`), com gatilho e modo (aviso ou reprova) conforme o P91.
6. **Licenças de terceiros sem dependência nova:**
   - um script do projeto (`scripts/licencas.mjs`) lê o `package-lock.json`, percorre só os pacotes de produção (sem `dev: true`) e junta o campo `license` e os arquivos `LICENSE`/`NOTICE` de cada um em `public/licencas-de-terceiros.txt`;
   - um passo do CI falha se o arquivo commitado estiver desatualizado.
7. **Nada novo vai para o navegador.** Tudo acima é ferramenta de desenvolvimento ou de CI. O orçamento de JavaScript (ADR-0012) não muda.

## Alternativas consideradas

- **Renovate em vez de Dependabot:** agrupa e agenda com mais recursos (painel de dependências, *automerge* fino), mas exige instalar um aplicativo de terceiros no GitHub (ação do dono, permissões de escrita no repositório) e um arquivo de configuração maior. O Dependabot é nativo, gratuito em repositório público e privado e já cobre grupos e ignorados. Rejeitada, salvo resposta B no P86.
- **`lighthouse` 13.6.0 com script próprio (sem `@lhci/cli`):** menos pacotes (sem `express` e `inquirer`), mas exige escrever e manter as execuções repetidas, a mediana, as metas e o relatório (~150 linhas). Fica como plano B (P89 = B).
- **`npx --yes @lhci/cli@0.16.1` só no job:** versão fixa, mas fora do *lockfile*, sem verificação de integridade nem auditoria. O ADR-0014 já rejeitou esse padrão. Rejeitada.
- **Ação de terceiros `treosh/lighthouse-ci-action`:** encapsula o mesmo `@lhci/cli` e acrescenta mais uma ação de terceiros com acesso ao *workflow*. Rejeitada.
- **Job visual com `container:` do GitHub Actions apontando para a imagem do Playwright:** funciona, mas duplica a definição do ambiente (versão da imagem no YAML e no script), e as duas podem divergir. Rejeitada em favor de rodar o próprio script.
- **Serviço externo de regressão visual (Percy, Chromatic, Argos):** pago ou com conta, e envia capturas a terceiros. Já rejeitado no ADR-0014.
- **CodeQL ou Semgrep:** a varredura de código do GitHub é grátis em repositório público, mas as *skills* e ferramentas de análise estática da Trail of Bits ficaram fora da lista aprovada (etapa 8). Fora deste ADR. Pode voltar com pedido do dono.

## Consequências

- **Tempo e minutos** (estimativa, a medir na tarefa 3 da etapa 9):
  - `verificar` + `e2e` + `auditoria`: ~15 a 20 min por *push*, os três em paralelo onde possível;
  - visual: ~6 a 10 min (o *download* da imagem é a maior parte);
  - Lighthouse: ~6 a 10 min.
  - Com os gatilhos recomendados (P90 e P91), o total fica bem abaixo da cota de 2.000 min de um repositório privado Free. Em repositório público, não custa nada.
- **Pacotes de desenvolvimento a mais:** `@lhci/cli` traz dezenas de pacotes (Lighthouse, Puppeteer Core, Express e outros). Isso aumenta o `npm ci` (alguns segundos) e a superfície do `npm audit` completo, mas não muda nada no site. Exige Node ≥ 22.19, atendido pelo 24.
- **Atualizar o Playwright** deixa de ser trivial. O PR do Dependabot falha no *workflow* visual até as capturas serem regeneradas no Linux (`npm run test:visual:docker -- --update-snapshots`) e aprovadas pelo `guardiao-do-design`.
- **Notas do Lighthouse variam entre máquinas.** O *runner* do GitHub é compartilhado e costuma dar Desempenho menor que o computador do dono. Por isso o P91 recomenda começar só avisando e calibrar as metas depois de algumas execuções.
- **Aviso de segurança novo em dependência de produção** deixa o CI vermelho mesmo sem mudança de código. É de propósito: o `schedule` semanal existe para isso.
- As ações por SHA ficam ilegíveis sem o comentário da versão. O Dependabot atualiza os dois.
