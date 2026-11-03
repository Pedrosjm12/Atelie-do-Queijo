import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // O eslint-config-next já registra o plugin jsx-a11y; aqui só ativamos as regras recomendadas.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
  // ADR-0009: a biblioteca 3D só entra em components/ModeloDoQueijo.tsx (chunk tardio). Os tipos
  // (`import type`) podem ser usados em qualquer lugar; o valor, estático ou dinâmico, não.
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    ignores: ['components/ModeloDoQueijo.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: ['@google/model-viewer', 'three'].map((name) => ({
            name,
            allowTypeImports: true,
            message: 'Só components/ModeloDoQueijo.tsx pode importar o 3D (ADR-0009).',
          })),
          patterns: [{ group: ['@google/model-viewer/*', 'three/*'], message: 'Ver ADR-0009.' }],
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...['@google/model-viewer', 'three'].map((pacote) => ({
          selector: `ImportExpression[source.value='${pacote}']`,
          message: 'Só components/ModeloDoQueijo.tsx pode importar o 3D (ADR-0009).',
        })),
      ],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.claude/**',
  ]),
]);

export default eslintConfig;
