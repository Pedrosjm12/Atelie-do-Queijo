# ADR-0002 — Ferramentas de qualidade e gerenciador de pacotes

- **Status:** Aceito
- **Data:** 2026-10-26

## Contexto

O `CLAUDE.md` exige lint, typecheck, testes e build passando antes de qualquer commit, e o projeto precisa de verificação automática de acessibilidade, testes de unidade, testes ponta a ponta (sem rolagem horizontal a 360 px, `lang="pt-BR"`) e um gancho de pré-commit. Toda dependência precisa de justificativa registrada (peso, manutenção, licença). Nenhuma destas ferramentas vai para o bundle do navegador: são todas `devDependencies`.

## Decisão

| Ferramenta | Papel | Justificativa |
| --- | --- | --- |
| **npm** (com `package-lock.json`) | Gerenciador de pacotes | Já vem com o Node; o pnpm não está disponível no ambiente do dono. Um gerenciador único evita lockfiles concorrentes. CI usa `npm ci`. |
| **Node 24** (`.nvmrc` + `engines`) | Runtime | Versão LTS atual; o mesmo número alimenta o CI via `node-version-file`. |
| **ESLint** (flat config, `eslint.config.mjs`) | Lint | Formato de configuração atual do ESLint. O script `lint` chama `eslint .` diretamente, sem depender de `next lint`. |
| **eslint-config-next** | Regras do Next.js e Core Web Vitals | Mantido pela Vercel junto com o Next; pega erros específicos do framework (imagens, links, fontes, hooks). |
| **eslint-plugin-jsx-a11y** | Regras de acessibilidade estáticas | A spec §13 e o alvo WCAG 2.2 AA pedem `<button>`/`<a>` reais, `aria-label` em ícones e rótulos em campos; o plugin detecta boa parte disso antes da revisão. Usar o conjunto recomendado. |
| **Prettier** | Formatação | Elimina discussões de estilo em revisões entre vários agentes. `eslint-config-prettier` só será adicionado se surgir conflito real de regras. |
| **TypeScript (`tsc --noEmit`)** | Typecheck | Já é dependência do projeto; o build do Next não substitui um typecheck explícito e rápido no CI e no pré-commit. |
| **Vitest** | Testes de unidade e de componentes | Rápido, configuração mínima, compatível com ESM e TypeScript sem transpilador extra. |
| **jsdom** | DOM simulado para o Vitest | Ambiente padrão para Testing Library; mais completo que o happy-dom para APIs de acessibilidade. |
| **@testing-library/react** (+ `@testing-library/jest-dom`, `@testing-library/user-event`) | Testes orientados ao usuário | Consultas por papel e nome acessível reforçam a acessibilidade; `jest-dom` dá asserções legíveis; `user-event` simula teclado e clique de forma realista. |
| **@vitejs/plugin-react** e **vite-tsconfig-paths** (se necessários) | Integração do Vitest com JSX e alias `@/*` | Só instalar se a configuração nativa do Vitest não resolver; registrar aqui se forem adicionados. |
| **Playwright** (apenas Chromium) | Testes ponta a ponta | Testa viewports reais (360, 390, 1440 px), teclado e, mais tarde, regressão visual (§14). Só Chromium por ora para manter o CI rápido; Firefox e WebKit podem entrar na etapa 9. |
| **lefthook** | Gancho de pré-commit | Binário único (Go), sem dependências de runtime, executa comandos em paralelo e filtra arquivos *staged* nativamente. Substitui a dupla husky + lint-staged com menos pacotes e configuração em um só arquivo (`lefthook.yml`). |

Licenças: todas MIT ou Apache-2.0, compatíveis com o projeto.

## Alternativas consideradas

- **pnpm ou Yarn:** mais rápidos e econômicos em disco, mas o pnpm não está disponível no ambiente do dono; manter um único gerenciador padrão do Node é mais simples. Rejeitadas.
- **Biome** (lint + formatação em uma ferramenta): rápido, porém sem paridade com `eslint-config-next` e `eslint-plugin-jsx-a11y`, que são essenciais para este projeto. Rejeitado.
- **Jest:** maduro, mas exige mais configuração para TypeScript/ESM e é mais lento. Rejeitado em favor do Vitest.
- **happy-dom:** mais rápido que o jsdom, porém com lacunas em APIs usadas pela Testing Library e por testes de acessibilidade. Rejeitado.
- **Cypress:** bom para e2e, mas mais pesado no CI e com suporte a múltiplas abas/viewports menos direto que o Playwright. Rejeitado.
- **husky + lint-staged:** padrão comum, porém são dois pacotes Node e duas configurações. Rejeitados em favor do lefthook.

## Consequências

- Um clone limpo precisa só de Node 24 e `npm ci`; o lefthook instala o gancho automaticamente.
- O pré-commit roda Prettier, ESLint e typecheck; testes unitários e e2e rodam no CI (e manualmente antes do commit, conforme o `CLAUDE.md`) para não deixar o commit lento.
- Navegadores do Playwright precisam ser instalados à parte (`npx playwright install chromium`), localmente e no CI.
- O caminho do repositório no Windows tem espaço e acento (`ateliê do queijo`); hooks e scripts devem usar caminhos entre aspas e ser testados localmente.
