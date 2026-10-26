# ADR-0004: Ajustes de ferramentas da etapa 1

- **Status:** Aceito
- **Data:** 2026-10-26
- **Complementa:** [ADR-0002](0002-ferramentas-de-qualidade.md)

## Contexto

O ADR-0002 deixou duas dependências condicionadas ("só se necessário") e não tratou das opções experimentais do Next.js. Na configuração da etapa 1, os dois pacotes se mostraram necessários e a configuração inicial veio com `cacheComponents` e `partialPrefetching` ligados.

## Decisão

| Dependência | Motivo | Peso | Licença |
| --- | --- | --- | --- |
| **@vitejs/plugin-react** | Configura o JSX automático do React nos testes de componente; é o plugin indicado no guia oficial do Next.js para Vitest. | Só desenvolvimento | MIT |
| **eslint-config-prettier** | O `eslint-config-next` (com as regras de TypeScript) traz regras de estilo que conflitam com a formatação do Prettier. A config desliga essas regras, sem adicionar nenhuma. | Só desenvolvimento, sem código em tempo de execução | MIT |

- `vite-tsconfig-paths` **não** foi instalado: o alias `@/*` é resolvido com `resolve.alias` em `vitest.config.mts`.
- `cacheComponents` e `partialPrefetching` foram **removidos** do `next.config.ts`. Eles mudam o modelo de renderização do app inteiro: acesso a dados dinâmicos passa a exigir `<Suspense>` ou `"use cache"`. Isso afeta sacola, checkout e `/queijos/[slug]`. Se valer a pena adotar, será com ADR próprio na etapa 3 ou 8.
- O pré-commit (lefthook) roda ESLint e Prettier em sequência nos arquivos em stage, com correção automática, e o typecheck em paralelo.

## Alternativas consideradas

- **Não usar `eslint-config-prettier` e desligar as regras manualmente**: lista frágil, que precisa de manutenção a cada atualização do `eslint-config-next`.
- **Manter `cacheComponents` desde já**: decisão de arquitetura cedo demais, sem caso de uso no projeto ainda.

## Consequências

- Duas `devDependencies` a mais, sem impacto no bundle do navegador.
- O app usa o modelo de renderização padrão do App Router até um novo ADR.
