# ADR-0014 — Dependências da rodada de qualidade: `@axe-core/playwright` e cobertura do Vitest

- **Status:** Aceito (aprovado pelo dono em 2026-11-05, com P76 = A, P78 = A e P79 = A do `docs/PLANO.md`)
- **Data:** 2026-11-05 (proposto e aceito)
- **Contexto da etapa:** 8 (rodada de qualidade; ver `docs/PLANO.md`)

## Contexto

A etapa 8 precisa de evidência automática de acessibilidade (WCAG 2.2 AA) em todas as rotas e estados interativos, de medida de cobertura dos testes de unidade e de regressão visual. Hoje o projeto tem `eslint-plugin-jsx-a11y` (análise estática do JSX), Testing Library, Vitest 5.0.5 e Playwright 1.64.1 (`package.json`). Nenhum deles confere contraste, nomes acessíveis calculados com CSS real, ordem de títulos na página montada ou regras ARIA no DOM final.

Regra do projeto: toda dependência nova precisa de ADR com motivo, peso e licença (`docs/adr/README.md`). Versões conferidas no registro do npm em 2026-11-05.

## Decisão

1. **`@axe-core/playwright` 4.14.0** (devDependency, MPL-2.0; traz `axe-core` ~4.14.0, MPL-2.0; *peer* `playwright-core` ≥ 1.0, já presente). Usado só nos testes e2e, por um apoio único (`e2e/_apoio/acessibilidade.ts`) que roda o axe com as marcas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `wcag22aa` e falha com qualquer violação. Exceções só por regra **e** seletor, cada uma com o motivo e a decisão do dono que a justifica (ex.: D34, `--placeholder` nos `[FOTO: …]`); nenhuma regra é desligada para a página inteira.
2. **`@vitest/coverage-v8`** (devDependency, MIT), **na mesma versão exata do `vitest` instalado** (hoje 5.0.5; o *peer* exige versão igual). Entra (P78 = A): relatório e limites mínimos **só em `lib/` e `data/`**, fixados no valor medido arredondado para baixo, como catraca (só podem subir). Script `test:cobertura`, separado do `test`, para não deixar o *hook* de pré-commit mais lento.
3. **Nada novo para Lighthouse, regressão visual, dados estruturados ou imagem Open Graph:** Lighthouse manual pelo Chrome DevTools, no build de produção local, em modo celular, mediana de 3 execuções (P76 = A); capturas com `toHaveScreenshot` do próprio Playwright; tipos de JSON-LD escritos no projeto (sem `schema-dts`) e imagem Open Graph com `next/og`, que já vem no `next` (P70 = A).
4. **Regressão visual no Linux, dentro da imagem Docker oficial do Playwright** (P79 = A), na mesma versão do `@playwright/test` instalado (hoje 1.64.1; nome exato da imagem conferido na documentação oficial ao implementar). As *baselines* são geradas e conferidas só nesse ambiente, que é o mesmo que o CI usará na etapa 9. O Docker Desktop é uma ferramenta do computador do dono, **não** uma dependência do projeto: nada entra no `package.json`. **Pré-requisito do dono:** instalar o Docker Desktop antes da tarefa de regressão visual. **Plano B** (se não puder): um *workflow* manual (`workflow_dispatch`) no GitHub Actions roda o projeto `visual` na mesma imagem e entrega as capturas como artefato para o dono revisar e commitar (opção D do P79), sem mudar o `ci.yml`.
5. **Peso no navegador: zero.** As duas dependências são só de desenvolvimento e não entram em nenhum pacote do site.

## Alternativas consideradas

- **`vitest-axe` ou `jest-axe` nos testes de componente:** o jsdom não calcula layout nem cascata de CSS, então a regra de contraste não funciona e o resultado diverge do navegador. Rejeitada; o axe roda no Chromium do Playwright, sobre o build de produção.
- **`pa11y` ou `pa11y-ci`:** traz Puppeteer e outro navegador, duplicando o que o Playwright já faz. Rejeitada.
- **`@lhci/cli` (Lighthouse CI):** dependência grande (dezenas de pacotes) para uma medida que varia entre execuções. Fica para a etapa 9, se o dono quiser a nota no CI (P76 = B).
- **`npx lighthouse` sem instalar:** baixa uma versão não fixada a cada uso, fora do *lockfile*. Rejeitada por segurança da cadeia de dependências.
- **Provedor de cobertura `istanbul`:** instrumenta o código e é mais lento; o `v8` usa a cobertura nativa do Node 24. Rejeitada.
- **Ferramenta externa de regressão visual (Percy, Chromatic, Argos):** serviço pago ou com conta, envia capturas para terceiros. Rejeitada.
- **Baselines geradas no Windows do dono (P79 = B):** as capturas mudam entre Windows e Linux (fontes e suavização) e não serviriam para o CI. Rejeitada.
- **Sem regressão visual automática (P79 = C):** rejeitada pelo dono.

## Consequências

- `npm run test:e2e` fica mais longo (estimativa de 1 a 2 minutos a mais com a varredura de todas as rotas e estados em duas larguras).
- MPL-2.0 é *copyleft* por arquivo e só obriga quem **distribui** arquivos alterados do axe. Como a dependência não vai para o site nem é alterada, não há obrigação nova; não entra em `public/licencas-de-terceiros.txt` (que lista o que é distribuído aos visitantes).
- O `@vitest/coverage-v8` precisa ser atualizado junto com o `vitest` (mesma versão). Registrar no agrupamento do Dependabot ou Renovate da etapa 9.
- As exceções do axe ficam num único arquivo, revisável, e cada uma cai quando a decisão do dono que a justifica mudar.
- Com o P81 = B (2026-11-05), a borda dos campos passa a `--placeholder` e deixa de ser desvio de WCAG 1.4.11; não há exceção do axe para ela (a regra de contraste do axe não confere bordas, então a conferência continua manual e por e2e da cor).
- A catraca de cobertura pode exigir subir os limites ao fim de cada etapa; baixá-los exige justificativa registrada no `docs/PLANO.md`.
- Gerar ou atualizar *baselines* passa a depender do Docker Desktop no computador do dono (ou do *workflow* manual, no plano B); sem um dos dois, `test:visual` não roda no Windows de forma confiável.
