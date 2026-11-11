import { describe, expect, it } from 'vitest';
import { ehViolacaoDeCsp } from '../e2e/_apoio/csp';

describe('ehViolacaoDeCsp', () => {
  it('casa com a mensagem real do Chrome', () => {
    expect(
      ehViolacaoDeCsp(
        "Refused to connect to 'https://exemplo.invalid/' because it violates the following Content Security Policy directive: \"connect-src 'self'\".",
      ),
    ).toBe(true);
    expect(ehViolacaoDeCsp("Refused to load the script 'https://x.invalid/a.js'")).toBe(true);
  });

  it('não casa com mensagens comuns do console', () => {
    for (const texto of [
      'Download the React DevTools for a better development experience',
      'Failed to load resource: the server responded with a status of 404 (Not Found)',
      '[Fast Refresh] done in 120ms',
      'Uncaught TypeError: x is not a function',
    ]) {
      expect(ehViolacaoDeCsp(texto)).toBe(false);
    }
  });
});
