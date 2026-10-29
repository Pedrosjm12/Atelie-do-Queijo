import { describe, expect, it } from 'vitest';
import { ehSlugDoQueijo, listarQueijos } from './catalogo';
import {
  PERGUNTAS,
  maiorFormatoEmGramas,
  pesoEmGramas,
  recomendarQueijo,
  respostasCompletas,
  type Acompanhamento,
  type QueijoDoQuiz,
  type RespostasDoQuiz,
  type Sabor,
  type Uso,
} from './quiz';

const QUEIJOS_DO_QUIZ: readonly QueijoDoQuiz[] = listarQueijos().map((q) => ({
  slug: q.slug,
  maiorFormatoEmGramas: maiorFormatoEmGramas(q.formatos),
}));

const recomendar = (r: RespostasDoQuiz) => recomendarQueijo(r, QUEIJOS_DO_QUIZ);

const SABORES: readonly Sabor[] = ['suaves', 'equilibrados', 'intensos'];
const USOS: readonly Uso[] = ['tabua', 'presente', 'para-mim'];
const ACOMPANHAMENTOS: readonly Acompanhamento[] = [
  'tinto',
  'branco-espumante',
  'cerveja',
  'cafe-mel',
];

describe('PERGUNTAS', () => {
  it('traz os textos literais da spec §5.6', () => {
    expect(PERGUNTAS.map((p) => p.titulo)).toEqual([
      'Você prefere sabores…',
      'Vai servir como…',
      'Vai acompanhar com…',
    ]);
    expect(PERGUNTAS.map((p) => p.opcoes.map((o) => o.rotulo))).toEqual([
      ['Suaves e amanteigados', 'Equilibrados', 'Intensos e marcantes'],
      ['Tábua para receber', 'Presente', 'Para mim, com calma'],
      ['Vinho tinto', 'Vinho branco ou espumante', 'Cerveja', 'Café ou mel'],
    ]);
  });

  it('usa valores que o motor reconhece', () => {
    expect(PERGUNTAS.map((p) => p.opcoes.map((o) => o.valor))).toEqual([
      SABORES,
      USOS,
      ACOMPANHAMENTOS,
    ]);
  });
});

describe('pesoEmGramas', () => {
  it('converte os textos da §9', () => {
    expect(pesoEmGramas('~1 kg')).toBe(1000);
    expect(pesoEmGramas('~500 g')).toBe(500);
    expect(pesoEmGramas('200 g')).toBe(200);
    expect(pesoEmGramas('~420 g')).toBe(420);
    expect(pesoEmGramas('[A DEFINIR]')).toBe(0);
  });

  it('aceita vírgula decimal e ponto de milhar', () => {
    expect(pesoEmGramas('~1,5 kg')).toBe(1500);
    expect(pesoEmGramas('1.000 g')).toBe(1000);
    expect(pesoEmGramas('1.5 kg')).toBe(1500);
  });

  it('o maior formato vence', () => {
    expect(maiorFormatoEmGramas([{ peso: '~250 g' }, { peso: '~1 kg' }, { peso: '~500 g' }])).toBe(
      1000,
    );
    expect(maiorFormatoEmGramas([])).toBe(0);
  });
});

describe('recomendarQueijo', () => {
  it('desempata pela ordem do catálogo: intensos, para mim, tinto → Canastra curado', () => {
    // Canastra curado, Parmigiano e Manchego fazem 2 pontos; o Canastra vem primeiro.
    expect(recomendar({ sabor: 'intensos', uso: 'para-mim', acompanhamento: 'tinto' })).toBe(
      'canastra-curado',
    );
  });

  it('suaves, presente, branco/espumante → Brie francês (3 pontos)', () => {
    expect(
      recomendar({ sabor: 'suaves', uso: 'presente', acompanhamento: 'branco-espumante' }),
    ).toBe('brie-frances');
  });

  it('"para mim" não pontua: só sabor e acompanhamento decidem', () => {
    expect(recomendar({ sabor: 'equilibrados', uso: 'para-mim', acompanhamento: 'cafe-mel' })).toBe(
      'canastra-meia-cura-premiado',
    );
    expect(recomendar({ sabor: 'equilibrados', uso: 'para-mim', acompanhamento: 'cerveja' })).toBe(
      'gorgonzola-dolce',
    );
  });

  it('"tábua" vale para os dois Canastras (P7)', () => {
    // Sem tábua o empate cairia no Canastra curado (1º do catálogo) por 1 ponto de sabor.
    // Com equilibrados + tábua + café/mel, o meia cura soma 3 (sabor, tábua, café/mel).
    expect(recomendar({ sabor: 'equilibrados', uso: 'tabua', acompanhamento: 'cafe-mel' })).toBe(
      'canastra-meia-cura-premiado',
    );
  });

  it('"presente" dá +1 a quem tem formato de ~500 g ou mais (P7)', () => {
    // Suaves + presente + cerveja: Creme e Penadinho (420 g não conta) fazem 1; Brie faz 2
    // (sabor + 500 g); Gruyère faz 2 (cerveja + 500 g). No empate vence o 7º do catálogo.
    expect(recomendar({ sabor: 'suaves', uso: 'presente', acompanhamento: 'cerveja' })).toBe(
      'tipo-gruyere',
    );
  });

  it('o resultado é sempre um queijo do catálogo, nas 36 combinações', () => {
    for (const sabor of SABORES) {
      for (const uso of USOS) {
        for (const acompanhamento of ACOMPANHAMENTOS) {
          const slug = recomendar({ sabor, uso, acompanhamento });
          expect(ehSlugDoQueijo(slug)).toBe(true);
        }
      }
    }
  });

  it('é determinística', () => {
    const r: RespostasDoQuiz = { sabor: 'intensos', uso: 'presente', acompanhamento: 'tinto' };
    expect(recomendar(r)).toBe(recomendar(r));
  });
});

describe('respostasCompletas', () => {
  it('aceita três respostas válidas', () => {
    expect(
      respostasCompletas({ sabor: 'suaves', uso: 'tabua', acompanhamento: 'cerveja' }),
    ).toEqual({ sabor: 'suaves', uso: 'tabua', acompanhamento: 'cerveja' });
  });

  it('recusa resposta faltando ou inválida', () => {
    expect(respostasCompletas({ sabor: 'suaves', uso: 'tabua' })).toBeNull();
    expect(
      respostasCompletas({ sabor: 'doces', uso: 'tabua', acompanhamento: 'cerveja' }),
    ).toBeNull();
  });
});
