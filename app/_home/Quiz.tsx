'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { Shape, SlugDoQueijo } from '@/data/cheeses';
import { BotaoAdicionar } from '@/components/BotaoAdicionar';
import { Button } from '@/components/Button';
import { CheeseIllustration } from '@/components/CheeseIllustration';
import { MINIATURAS_DA_CAVE } from '@/components/ilustracoes/MiniaturasDaCave';
import { Overline } from '@/components/Overline';
import {
  PERGUNTAS,
  recomendarQueijo,
  respostasCompletas,
  type QueijoDoQuiz,
  type RespostasDoQuiz,
} from '@/lib/quiz';
import estilos from './Quiz.module.css';

/** O que o quiz precisa saber de cada queijo (o servidor passa só isto). */
export interface ResumoDoQueijo extends QueijoDoQuiz {
  slug: SlugDoQueijo;
  nome: string;
  /** Formato que o Adicionar põe na sacola: o do menor preço, igual ao cartão (P24). */
  formatoIdDeVitrine: string;
  ilustracao: { shape: Shape; side: string; top: string };
}

type QuizProps = { queijos: readonly ResumoDoQueijo[] };

type Respostas = Partial<Record<keyof RespostasDoQuiz, string>>;

/** Lacuna da spec §5.6 ("gerado das respostas", sem modelo de texto): visível até o dono aprovar (P6). */
const POR_QUE_COMBINA = '[POR QUE COMBINA COM VOCÊ]';

const PADDING_DO_BOTAO = { '--botao-padding-x': '32px' } as CSSProperties;

/**
 * Quiz "Encontre seu queijo" (spec §5.6 e §10.4). Começa sem nada marcado (P8). A cada passo,
 * o foco vai para a pergunta (ou para o resultado) para o leitor de tela anunciar a mudança.
 */
export function Quiz({ queijos }: QuizProps) {
  const idDoTitulo = useId();
  const idDaPergunta = useId();
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [concluido, setConcluido] = useState(false);
  const alvoDoFoco = useRef<HTMLHeadingElement>(null);
  // Não rouba o foco na primeira renderização da página.
  const moveuFoco = useRef(false);

  useEffect(() => {
    if (!moveuFoco.current) return;
    alvoDoFoco.current?.focus();
  }, [passo, concluido]);

  const pergunta = PERGUNTAS[passo];
  const ultima = passo === PERGUNTAS.length - 1;
  const escolha = pergunta ? respostas[pergunta.chave] : undefined;
  const completas = respostasCompletas(respostas);

  function escolher(valor: string) {
    if (!pergunta) return;
    setRespostas((atuais) => ({ ...atuais, [pergunta.chave]: valor }));
  }

  function avancar() {
    moveuFoco.current = true;
    if (ultima) {
      if (completas) setConcluido(true);
    } else {
      setPasso(passo + 1);
    }
  }

  function refazer() {
    moveuFoco.current = true;
    setRespostas({});
    setPasso(0);
    setConcluido(false);
  }

  if (concluido && completas) {
    // Nunca renderiza (nem focaliza) um título vazio: sem correspondência, cai no primeiro.
    const slug = recomendarQueijo(completas, queijos);
    const recomendado = queijos.find((q) => q.slug === slug) ?? queijos[0];
    if (!recomendado) return null;
    const Miniatura = MINIATURAS_DA_CAVE[recomendado.slug];
    return (
      <section id="quiz" className={`conteudo ${estilos.secao}`} aria-labelledby={idDoTitulo}>
        <div className={estilos.caixa}>
          <Overline>SEU QUEIJO É</Overline>
          <h2 id={idDoTitulo} ref={alvoDoFoco} tabIndex={-1} className={estilos.tituloDoResultado}>
            {recomendado.nome}
          </h2>
          <div className={estilos.ilustracao}>
            {Miniatura ? (
              <Miniatura />
            ) : (
              <CheeseIllustration {...recomendado.ilustracao} label={recomendado.nome} />
            )}
          </div>
          <p className={estilos.porQue}>{POR_QUE_COMBINA}</p>
          <div className={estilos.acoesDoResultado}>
            <BotaoAdicionar
              slug={recomendado.slug}
              formatoId={recomendado.formatoIdDeVitrine}
              style={PADDING_DO_BOTAO}
            >
              Adicionar à sacola
            </BotaoAdicionar>
            <Button variante="link" onClick={refazer}>
              Refazer o teste
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!pergunta) return null;

  return (
    <section id="quiz" className={`conteudo ${estilos.secao}`} aria-labelledby={idDoTitulo}>
      <div className={estilos.caixa}>
        <Overline>{`ENCONTRE SEU QUEIJO · PERGUNTA ${passo + 1} DE ${PERGUNTAS.length}`}</Overline>
        <h2 id={idDoTitulo} className={estilos.titulo}>
          Não sabe por onde começar?
        </h2>
        <p className={estilos.paragrafo}>
          Responda três perguntas e o Ateliê indica o queijo certo para você.
        </p>
        <h3 id={idDaPergunta} ref={alvoDoFoco} tabIndex={-1} className={estilos.pergunta}>
          <span className="sr-only">{`Pergunta ${passo + 1} de ${PERGUNTAS.length}: `}</span>
          {pergunta.titulo}
        </h3>
        <div className={estilos.opcoes} role="group" aria-labelledby={idDaPergunta}>
          {pergunta.opcoes.map((opcao) => (
            <Button
              key={`${pergunta.chave}-${opcao.valor}`}
              variante="opcao"
              selecionado={escolha === opcao.valor}
              className={estilos.opcao}
              onClick={() => escolher(opcao.valor)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </div>
        <Button
          className={estilos.proxima}
          style={PADDING_DO_BOTAO}
          disabled={escolha === undefined}
          onClick={avancar}
        >
          {ultima ? 'Ver meu queijo' : 'Próxima pergunta'}
        </Button>
      </div>
    </section>
  );
}
