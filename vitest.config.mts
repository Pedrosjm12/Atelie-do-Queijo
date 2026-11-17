import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // O Next trata `import 'server-only'` sozinho (o pacote npm é opcional); no Vitest vira vazio.
      'server-only': fileURLToPath(new URL('./vitest.server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude, '.next/**', 'e2e/**', '.claude/**'],
    // Cobertura (ADR-0014, P78 = A): só com `npm run test:cobertura`; o `npm test` e o pré-commit
    // não pagam o custo. Mede e limita só `lib/` e `data/` (regras e dados, não a interface).
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.{ts,tsx}', 'data/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      reporter: ['text-summary', 'text', 'html'],
      reportsDirectory: './coverage',
      // Catraca (P78 = A): medido em 2026-11-12 e arredondado para baixo (instruções 98,41%, ramos
      // 95,49%, funções 99,48%, linhas 99,55%; 31 arquivos). Só sobem; baixar exige justificativa
      // registrada no docs/PLANO.md (ADR-0014).
      thresholds: {
        statements: 98,
        branches: 95,
        functions: 99,
        lines: 99,
      },
    },
  },
});
