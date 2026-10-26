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
