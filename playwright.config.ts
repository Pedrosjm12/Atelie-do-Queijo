import { defineConfig, devices } from '@playwright/test';

const emCI = !!process.env.CI;

// Regressão visual: imagens de referência do Linux, geradas na imagem Docker oficial
// (npm run test:visual:docker). O projeto só existe dentro do contêiner (ATELIE_VISUAL=1): fora
// dele, `playwright test` não o roda e `--update-snapshots` no Windows não sobrescreve as capturas.
const projetoVisual = {
  name: 'visual',
  testMatch: '**/visual/**/*.spec.ts',
  snapshotPathTemplate: '{testDir}/visual/capturas-linux/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled' as const,
      caret: 'hide' as const,
      maxDiffPixelRatio: 0,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    reducedMotion: 'reduce' as const,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Sem hinting: evita o espaço entre palavras colapsado em textos pequenos no Linux.
    launchOptions: { args: ['--font-render-hinting=none'] },
  },
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: emCI,
  retries: emCI ? 1 : 0,
  reporter: emCI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // A regressão visual tem projeto próprio (npm run test:visual) e não entra no test:e2e.
      testIgnore: '**/visual/**',
    },
    ...(process.env.ATELIE_VISUAL === '1' ? [projetoVisual] : []),
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !emCI,
    timeout: 180_000,
    // P74: o build local e o da CI usam dados fictícios e precisam desta permissão.
    env: { PERMITIR_DADOS_FICTICIOS: '1' },
  },
});
