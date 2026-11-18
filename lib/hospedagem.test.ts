import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

// ADR-0017, decisão 6: na Vercel o Next compara `Origin` com `Host`/`X-Forwarded-Host` e os dois
// coincidem, então `serverActions.allowedOrigins` fica ausente. Abrir a lista (ainda mais com `*`)
// enfraquece a proteção contra CSRF das Server Actions. Mudar isto exige atualizar o ADR-0017.
describe('configuração das Server Actions (ADR-0017)', () => {
  const acoes = nextConfig('phase-development-server').experimental?.serverActions;

  it('não define allowedOrigins', () => {
    expect(acoes).toBeDefined();
    expect(acoes).not.toHaveProperty('allowedOrigins');
  });

  it('mantém o limite de corpo em 32 KB', () => {
    expect(acoes?.bodySizeLimit).toBe('32kb');
  });
});
