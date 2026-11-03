import { describe, expect, it } from 'vitest';
import {
  proximaSituacao,
  TEMPO_LIMITE_DO_GLB_MS,
  type EventoDo3d,
  type Situacao3d,
} from './estadoDo3d';

const TODAS: Situacao3d[] = ['so-svg', 'aguardando', 'preparando', 'pronto', 'sem-webgl', 'erro'];

const iniciar = (o: Partial<Extract<EventoDo3d, { tipo: 'iniciar' }>> = {}): EventoDo3d => ({
  tipo: 'iniciar',
  temGlb: true,
  temWebGL: true,
  economizarDados: false,
  ...o,
});

const trocar = (o: Partial<Extract<EventoDo3d, { tipo: 'trocou-variante' }>> = {}): EventoDo3d => ({
  tipo: 'trocou-variante',
  temGlb: true,
  temWebGL: true,
  economizarDados: false,
  ...o,
});

describe('proximaSituacao', () => {
  it('o tempo-limite do GLB é de 20 s', () => {
    expect(TEMPO_LIMITE_DO_GLB_MS).toBe(20_000);
  });

  describe('iniciar', () => {
    it('sem GLB: só SVG, mesmo sem WebGL e com economia de dados', () => {
      for (const atual of TODAS) {
        expect(proximaSituacao(atual, iniciar({ temGlb: false }))).toBe('so-svg');
        expect(proximaSituacao(atual, iniciar({ temGlb: false, temWebGL: false }))).toBe('so-svg');
      }
    });
    it('com GLB e sem WebGL: sem-webgl (mensagem da §7.5)', () => {
      expect(proximaSituacao('so-svg', iniciar({ temWebGL: false }))).toBe('sem-webgl');
    });
    it('com GLB, WebGL e economia de dados: continua só SVG', () => {
      expect(proximaSituacao('so-svg', iniciar({ economizarDados: true }))).toBe('so-svg');
    });
    it('com GLB e WebGL: aguardando o palco ficar visível', () => {
      expect(proximaSituacao('so-svg', iniciar())).toBe('aguardando');
    });
  });

  it('iniciar: falta de WebGL vence a economia de dados (a mensagem da §7.5 aparece)', () => {
    expect(proximaSituacao('so-svg', iniciar({ temWebGL: false, economizarDados: true }))).toBe(
      'sem-webgl',
    );
  });

  it('percurso de falha: erro ignora "carregou" e a troca de variante recomeça o download', () => {
    let s: Situacao3d = proximaSituacao('so-svg', iniciar());
    s = proximaSituacao(s, { tipo: 'visivel' });
    s = proximaSituacao(s, { tipo: 'falhou' });
    expect(s).toBe('erro');
    expect(proximaSituacao(s, { tipo: 'carregou' })).toBe('erro');
    expect(proximaSituacao(s, trocar())).toBe('preparando');
  });

  describe('visivel', () => {
    it('só tira aguardando do lugar', () => {
      expect(proximaSituacao('aguardando', { tipo: 'visivel' })).toBe('preparando');
      for (const atual of TODAS.filter((s) => s !== 'aguardando')) {
        expect(proximaSituacao(atual, { tipo: 'visivel' })).toBe(atual);
      }
    });
  });

  describe('carregou', () => {
    it('preparando vira pronto; as demais ficam como estão', () => {
      expect(proximaSituacao('preparando', { tipo: 'carregou' })).toBe('pronto');
      for (const atual of TODAS.filter((s) => s !== 'preparando')) {
        expect(proximaSituacao(atual, { tipo: 'carregou' })).toBe(atual);
      }
    });
  });

  describe('falhou', () => {
    it('aguardando, preparando e pronto viram erro (volta ao SVG, sem texto)', () => {
      for (const atual of ['aguardando', 'preparando', 'pronto'] as const) {
        expect(proximaSituacao(atual, { tipo: 'falhou' })).toBe('erro');
      }
    });
    it('so-svg, sem-webgl e erro não mudam', () => {
      for (const atual of ['so-svg', 'sem-webgl', 'erro'] as const) {
        expect(proximaSituacao(atual, { tipo: 'falhou' })).toBe(atual);
      }
    });
  });

  describe('trocou-variante', () => {
    it('variante sem GLB: volta ao SVG', () => {
      for (const atual of TODAS) {
        expect(proximaSituacao(atual, trocar({ temGlb: false }))).toBe('so-svg');
      }
    });
    it('variante com GLB: pronto e erro baixam o novo; so-svg espera o gatilho', () => {
      const evento = trocar();
      expect(proximaSituacao('pronto', evento)).toBe('preparando');
      expect(proximaSituacao('erro', evento)).toBe('preparando');
      expect(proximaSituacao('so-svg', evento)).toBe('aguardando');
    });
    it('variante com GLB: aguardando, preparando e sem-webgl não mudam', () => {
      const evento = trocar();
      for (const atual of ['aguardando', 'preparando'] as const) {
        expect(proximaSituacao(atual, evento)).toBe(atual);
      }
    });
    it('variante com GLB e sem WebGL: sem-webgl (mensagem da §7.5), venha de onde vier', () => {
      for (const atual of TODAS) {
        expect(proximaSituacao(atual, trocar({ temWebGL: false }))).toBe('sem-webgl');
      }
    });
    it('economia de dados: so-svg continua so-svg depois da troca', () => {
      expect(proximaSituacao('so-svg', trocar({ economizarDados: true }))).toBe('so-svg');
      expect(proximaSituacao('pronto', trocar({ economizarDados: true }))).toBe('preparando');
    });
  });

  it('percurso feliz: iniciar → visivel → carregou', () => {
    let s: Situacao3d = 'so-svg';
    s = proximaSituacao(s, iniciar());
    s = proximaSituacao(s, { tipo: 'visivel' });
    s = proximaSituacao(s, { tipo: 'carregou' });
    expect(s).toBe('pronto');
  });
});
