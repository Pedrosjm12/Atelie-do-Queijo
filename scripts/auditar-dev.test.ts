import { describe, expect, it } from 'vitest';
import { EXCECOES, avisosGraves, excecaoVencida } from './auditar-dev.mjs';

const via = (ghsa: string, severity: string) => ({
  severity,
  title: 't',
  url: `https://github.com/advisories/${ghsa}`,
});

describe('auditar-dev', () => {
  it('ignora o aviso da exceção e os pacotes que só apontam para ele', () => {
    const r = {
      vulnerabilities: {
        picomatch: { via: [via('GHSA-fc5q-39xc-vjpf', 'high')] },
        vitest: { via: ['picomatch'] },
      },
    };
    expect(avisosGraves(r)).toEqual([]);
  });

  it('reprova outro aviso high ou critical', () => {
    const r = { vulnerabilities: { x: { via: [via('GHSA-novo', 'critical')] } } };
    expect(avisosGraves(r)).toHaveLength(1);
  });

  it('reprova outro aviso alto no mesmo pacote da exceção', () => {
    const r = {
      vulnerabilities: {
        picomatch: { via: [via('GHSA-fc5q-39xc-vjpf', 'high'), via('GHSA-outro', 'high')] },
      },
    };
    expect(avisosGraves(r)).toHaveLength(1);
  });

  it('reprova aviso grave sem url', () => {
    const r = { vulnerabilities: { y: { via: [{ severity: 'high', title: 't' }] } } };
    expect(avisosGraves(r)).toHaveLength(1);
  });

  it('aceita moderados', () => {
    const r = { vulnerabilities: { m: { via: [via('GHSA-g3hv-75wg-m249', 'moderate')] } } };
    expect(avisosGraves(r)).toEqual([]);
  });

  it('a exceção aponta o GHSA do picomatch', () => {
    expect(EXCECOES.map((e: { ghsa: string }) => e.ghsa)).toEqual(['GHSA-fc5q-39xc-vjpf']);
  });

  it('a exceção vence depois da data de revisão', () => {
    const e = { ghsa: 'x', revisarAte: '2027-01-31' };
    expect(excecaoVencida(e, new Date('2027-01-31T12:00:00Z'))).toBe(false);
    expect(excecaoVencida(e, new Date('2027-02-01T00:00:00Z'))).toBe(true);
  });

  it('relatório sem vulnerabilities não reprova', () => {
    expect(avisosGraves({})).toEqual([]);
  });
});
