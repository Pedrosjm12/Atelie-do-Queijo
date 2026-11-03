'use client';

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { Cheese } from '@/data/cheeses';
import { caminhoDoModelo, temModelo } from '@/data/modelos3d';
import { proximaSituacao, TEMPO_LIMITE_DO_GLB_MS, type Situacao3d } from '@/lib/estadoDo3d';
import {
  assinarMovimentoReduzido,
  prefereMovimentoReduzido,
  querEconomizarDados,
  quandoOcioso,
  quandoVisivel,
  temWebGL,
} from '@/lib/suporte3d';
import { CheeseIllustration } from './CheeseIllustration';
import { Icone } from './icons';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { FronteiraDoModelo } from './FronteiraDoModelo';
import { ILUSTRACOES_DE_PRODUTO } from './ilustracoes/CanastraProduto';
import type { ControleDoModelo } from './ModeloDoQueijo';
import { useTelaCheia } from './useTelaCheia';
import estilos from './CheeseViewer.module.css';

// Chunk tardio (ADR-0009): o modelo e a biblioteca só são pedidos quando o gatilho dispara.
const CamadaDoModelo = lazy(() => import('./CamadaDoModelo'));

type CheeseViewerProps = {
  queijo: Cheese;
};

type EstadoDoVisualizador = {
  cortado: boolean;
  /** `null` = a pessoa ainda não mexeu: vale o padrão (gira, salvo sem GLB ou movimento reduzido). */
  girando: boolean | null;
  zoom: boolean;
};

/** Dois toques no palco, com no máximo esta pausa e esta distância, contam como "toque duas vezes". */
const PAUSA_DO_DUPLO_TOQUE_MS = 300;
const DISTANCIA_DO_DUPLO_TOQUE_PX = 30;
/** Depois de um duplo toque, o `dblclick` que alguns navegadores ainda disparam é ignorado por este tempo. */
const JANELA_DO_DBLCLICK_FANTASMA_MS = 700;

/** Passo dos botões "Girar à esquerda/direita" (WCAG 2.5.7). */
const PASSO_DO_GIRO_GRAUS = 30;

const TEXTO_PREPARANDO = 'Preparando a peça…';
const TEXTO_PRONTO = 'Peça pronta. Use Girar à esquerda ou à direita.'; // só leitor de tela
const TEXTO_SEM_WEBGL = 'Seu navegador não exibe o 3D. Veja as fotos abaixo.';

const FOTOS = ['na tábua', 'produtor', 'fazenda'] as const;

/** Botões que o leitor de tela e o teclado alcançam: ignora os ocultos por CSS (display: none). */
function botoesVisiveis(barra: HTMLElement | null): HTMLButtonElement[] {
  if (!barra) return [];
  return Array.from(barra.querySelectorAll<HTMLButtonElement>('button')).filter(
    (botao) => getComputedStyle(botao).display !== 'none',
  );
}

/**
 * Palco do queijo (spec §7.2, §7.5, §7.6 e §10.3). Mostra primeiro a ilustração SVG; o
 * `model-viewer` entra por cima, tarde, só para queijos com GLB no manifesto (ADR-0009), e o SVG
 * volta sempre que o 3D não puder ser exibido. Tela cheia e Aproximar (inclusive por duplo
 * toque) valem sobre o SVG e sobre o modelo.
 */
export function CheeseViewer({ queijo }: CheeseViewerProps) {
  const ilustracoes = ILUSTRACOES_DE_PRODUTO[queijo.slug];
  // Só os queijos com arte A.5 têm corte (P3).
  const temCorte = ilustracoes !== undefined;

  const [estado, setEstado] = useState<EstadoDoVisualizador>({
    cortado: true,
    girando: null,
    zoom: false,
  });
  const [interagiu, setInteragiu] = useState(false);

  const cortado = temCorte && estado.cortado;
  const marcarInteracao = () => setInteragiu(true);

  const palcoRef = useRef<HTMLDivElement>(null);
  const variante = cortado ? 'cortado' : 'inteiro';
  // Os textos do 3D (§7.5) só existem para queijos que têm algum GLB.
  const temAlgumGlb = temModelo(queijo.slug, 'inteiro') || temModelo(queijo.slug, 'cortado');
  const temGlb = temModelo(queijo.slug, variante);

  // Situação do 3D (lib/estadoDo3d). Começa igual no servidor e no cliente (sem saber de WebGL).
  const situacaoInicial: Situacao3d = temGlb ? 'aguardando' : 'so-svg';
  const [situacao, enviar] = useReducer(proximaSituacao, situacaoInicial);
  const primeiraSituacao = useRef(true);
  const [controleDoModelo, setControleDoModelo] = useState<ControleDoModelo | null>(null);

  // Início e troca de variante. Sem GLB, nada além do `so-svg`: nenhuma API do navegador é tocada.
  useEffect(() => {
    const ambiente = {
      temGlb,
      temWebGL: temGlb ? temWebGL() : false,
      economizarDados: temGlb ? querEconomizarDados() : false,
    };
    enviar({ tipo: primeiraSituacao.current ? 'iniciar' : 'trocou-variante', ...ambiente });
    primeiraSituacao.current = false;
  }, [temGlb, variante]);

  // Gatilho: palco visível E navegador ocioso. O SVG já foi pintado, então o LCP não espera o 3D.
  useEffect(() => {
    if (situacao !== 'aguardando') return;
    let cancelarOcioso = () => {};
    const palco = palcoRef.current;
    if (!palco) return;
    const cancelarVisivel = quandoVisivel(palco, () => {
      cancelarOcioso = quandoOcioso(() => enviar({ tipo: 'visivel' }));
    });
    return () => {
      cancelarVisivel();
      cancelarOcioso();
    };
  }, [situacao]);

  // Tempo-limite: sem `load` em 20 s (biblioteca + GLB), volta ao SVG. Reinicia a cada troca de
  // variante, porque o novo GLB começa a baixar de novo.
  useEffect(() => {
    if (situacao !== 'preparando') return;
    const id = setTimeout(() => enviar({ tipo: 'falhou' }), TEMPO_LIMITE_DO_GLB_MS);
    return () => clearTimeout(id);
  }, [situacao, variante]);

  // `enviar` é estável e o ModeloDoQueijo lê os callbacks por ref: funções inline bastam.
  const aoCarregarModelo = () => enviar({ tipo: 'carregou' });
  const aoFalharModelo = () => enviar({ tipo: 'falhou' });
  // Primeira interação com o modelo: para o giro automático (WCAG 2.2.2) e some com a dica.
  const aoInteragirComModelo = () => {
    setInteragiu(true);
    setEstado((e) => ({ ...e, girando: false }));
  };

  const mostrarModelo = situacao === 'preparando' || situacao === 'pronto';
  const modeloPronto = situacao === 'pronto';

  // Girar (P39 = C): sem GLB o SVG não gira; o botão fica desabilitado e com aria-pressed="false".
  // Também fica assim quando o 3D não vai aparecer (sem WebGL, erro, economia de dados).
  // Com movimento reduzido (§10.3), o giro só liga se a pessoa pedir.
  const giroDisponivel =
    temGlb && situacao !== 'sem-webgl' && situacao !== 'erro' && situacao !== 'so-svg';
  const movimentoReduzido = useSyncExternalStore(
    assinarMovimentoReduzido,
    prefereMovimentoReduzido,
    () => false,
  );
  const girando = giroDisponivel && (estado.girando ?? !movimentoReduzido);

  const telaCheia = useTelaCheia(palcoRef);
  // `alt` do 3D = o rótulo do SVG da variante (§13), desktop.
  const rotulo = ilustracoes
    ? ilustracoes.rotulos[variante]
    : `${queijo.nome}, ilustração do queijo`;
  const idDoAvisoTelaCheia = useId();
  const idDoAvisoGiro = useId();
  const idDoAvisoPronto = useId();

  // Aproximar por "toque duas vezes" (§7.2). O mouse usa `dblclick`; toque e caneta usam dois
  // `pointerup` próximos, porque nem todo navegador de celular dispara `dblclick`.
  const ultimoToque = useRef<{ instante: number; x: number; y: number } | null>(null);
  const instanteDoUltimoDuploToque = useRef(-Infinity);

  const alternarZoom = () => {
    marcarInteracao();
    setEstado((e) => ({ ...e, zoom: !e.zoom }));
  };

  const aoSoltarPonteiro = (evento: PointerEvent<HTMLDivElement>) => {
    if (evento.pointerType === 'mouse') return;
    const agora = performance.now();
    const anterior = ultimoToque.current;
    const duplo =
      anterior !== null &&
      agora - anterior.instante <= PAUSA_DO_DUPLO_TOQUE_MS &&
      Math.hypot(evento.clientX - anterior.x, evento.clientY - anterior.y) <=
        DISTANCIA_DO_DUPLO_TOQUE_PX;
    if (duplo) {
      ultimoToque.current = null;
      instanteDoUltimoDuploToque.current = agora;
      alternarZoom();
    } else {
      ultimoToque.current = { instante: agora, x: evento.clientX, y: evento.clientY };
    }
  };

  const aoDarDoisCliques = () => {
    // Depois de um duplo toque, alguns navegadores ainda disparam `dblclick`: não alternar de novo.
    if (performance.now() - instanteDoUltimoDuploToque.current < JANELA_DO_DBLCLICK_FANTASMA_MS)
      return;
    alternarZoom();
  };

  // Barra de ferramentas com tabIndex móvel (roving): um só botão visível entra na ordem de Tab.
  // O tabindex é ajustado direto no DOM porque depende do CSS (botões ocultos por breakpoint).
  const barraRef = useRef<HTMLDivElement>(null);
  const ativoRef = useRef<HTMLButtonElement | null>(null);
  const aproximarRef = useRef<HTMLButtonElement>(null);

  const sincronizarTabIndex = useCallback(() => {
    const visiveis = botoesVisiveis(barraRef.current);
    const alvo =
      ativoRef.current && visiveis.includes(ativoRef.current) ? ativoRef.current : visiveis[0];
    for (const botao of barraRef.current?.querySelectorAll('button') ?? []) {
      botao.tabIndex = botao === alvo ? 0 : -1;
    }
  }, []);

  useEffect(() => {
    sincronizarTabIndex();
    window.addEventListener('resize', sincronizarTabIndex);
    return () => window.removeEventListener('resize', sincronizarTabIndex);
  }, [sincronizarTabIndex, temCorte, giroDisponivel]);

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    const visiveis = botoesVisiveis(barraRef.current);
    const atual = visiveis.findIndex((botao) => botao === document.activeElement);
    if (atual === -1) return;
    let proximo: number;
    switch (evento.key) {
      case 'ArrowRight':
        proximo = (atual + 1) % visiveis.length;
        break;
      case 'ArrowLeft':
        proximo = (atual - 1 + visiveis.length) % visiveis.length;
        break;
      case 'Home':
        proximo = 0;
        break;
      case 'End':
        proximo = visiveis.length - 1;
        break;
      default:
        return;
    }
    evento.preventDefault();
    visiveis[proximo]?.focus();
  };

  const aoFocar = (evento: FocusEvent<HTMLDivElement>) => {
    if (evento.target instanceof HTMLButtonElement) {
      ativoRef.current = evento.target;
      sincronizarTabIndex();
    }
  };

  // O 3D falhou e os botões "Girar à esquerda/direita" somem: o foco que estava num deles (agora
  // fora do DOM, com o foco no <body>) vai para "Aproximar", que está sempre visível.
  useEffect(() => {
    const perdido = ativoRef.current;
    if (!giroDisponivel && perdido?.dataset.giro && !perdido.isConnected) {
      if (document.activeElement === document.body) aproximarRef.current?.focus();
    }
  }, [giroDisponivel]);

  return (
    <div>
      <div ref={palcoRef} className={estilos.palco} data-aviso={temAlgumGlb}>
        {!interagiu && (
          <p className={estilos.dica} data-testid="dica-3d">
            <Icone nome="girar" tamanho={16} />
            {/* Sem GLB o SVG não gira: a dica só promete o que existe (decisão do dono, §7.2). */}
            {giroDisponivel ? (
              <span>
                Arraste para girar
                <span className={estilos.dicaExtra}> · Toque duas vezes para aproximar</span>
              </span>
            ) : (
              <span>Toque duas vezes para aproximar</span>
            )}
          </p>
        )}

        <span className={estilos.indicador}>{cortado ? 'POR DENTRO' : 'PEÇA INTEIRA'}</span>

        {/* A primeira interação esconde a dica; duplo clique ou duplo toque alterna o Aproximar.
            O SVG fica sempre na árvore (é o poster e o fallback); com o modelo pronto ele só
            deixa de ser visível, mantendo a caixa para o 3D não causar CLS. */}
        <div
          className={estilos.cena}
          onPointerDown={marcarInteracao}
          onPointerUp={aoSoltarPonteiro}
          onDoubleClick={aoDarDoisCliques}
        >
          <div className={estilos.ilustracao} data-zoom={estado.zoom} aria-hidden={modeloPronto}>
            {ilustracoes ? (
              cortado ? (
                <>
                  <div className={estilos.apenasDesktop}>
                    <ilustracoes.cortado />
                  </div>
                  <div className={estilos.apenasCelular}>
                    <ilustracoes.cortadoCelular />
                  </div>
                </>
              ) : (
                <ilustracoes.inteiro />
              )
            ) : (
              <div className={estilos.gerada}>
                <CheeseIllustration
                  shape={queijo.ilustracao.shape}
                  side={queijo.ilustracao.side}
                  top={queijo.ilustracao.top}
                  label={queijo.nome}
                />
              </div>
            )}
          </div>

          {mostrarModelo && (
            <FronteiraDoModelo aoFalhar={aoFalharModelo}>
              <Suspense fallback={null}>
                <CamadaDoModelo
                  pronto={modeloPronto}
                  src={caminhoDoModelo(queijo.slug, variante)}
                  alt={rotulo}
                  girando={girando}
                  zoom={estado.zoom}
                  aoCarregar={aoCarregarModelo}
                  aoFalhar={aoFalharModelo}
                  aoInteragir={aoInteragirComModelo}
                  registrarControle={setControleDoModelo}
                />
              </Suspense>
            </FronteiraDoModelo>
          )}
        </div>

        {/* Legenda do 3D (§7.5, P41): só para queijos com GLB; a região existe sempre para o
            anúncio funcionar e reserva a linha, sem empurrar a barra quando o texto aparece. */}
        {temAlgumGlb && (
          <p role="status" className={estilos.aviso}>
            {situacao === 'preparando'
              ? TEXTO_PREPARANDO
              : situacao === 'sem-webgl'
                ? TEXTO_SEM_WEBGL
                : ''}
            {modeloPronto && <span className="sr-only">{TEXTO_PRONTO}</span>}
          </p>
        )}

        <div
          ref={barraRef}
          role="toolbar"
          aria-label="Controles do 3D"
          className={estilos.barra}
          onKeyDown={aoTeclar}
          onFocus={aoFocar}
        >
          <button
            type="button"
            className={`${estilos.botao} ${giroDisponivel ? '' : estilos.soDesktop}`}
            aria-pressed={girando}
            aria-disabled={giroDisponivel ? undefined : 'true'}
            aria-describedby={giroDisponivel ? undefined : idDoAvisoGiro}
            onClick={() => {
              if (!giroDisponivel) return;
              marcarInteracao();
              setEstado((e) => ({ ...e, girando: !girando }));
            }}
          >
            <Icone nome="girar-curto" tamanho={16} />
            Girar
          </button>
          {!giroDisponivel && (
            <span id={idDoAvisoGiro} hidden>
              Giro disponível com o modelo 3D
            </span>
          )}

          {giroDisponivel && !modeloPronto && (
            <span id={idDoAvisoPronto} hidden>
              Disponível quando a peça estiver pronta
            </span>
          )}

          {/* WCAG 2.5.7: girar sem arrastar. Só com GLB; ativos quando o modelo já está na tela. */}
          {giroDisponivel &&
            (['esquerda', 'direita'] as const).map((lado) => (
              <button
                key={lado}
                type="button"
                data-giro={lado}
                className={estilos.botao}
                aria-disabled={modeloPronto ? undefined : 'true'}
                aria-describedby={modeloPronto ? undefined : idDoAvisoPronto}
                onClick={() => {
                  if (!modeloPronto || !controleDoModelo) return;
                  // Girar à esquerda/direita também encerra o giro automático (WCAG 2.2.2).
                  aoInteragirComModelo();
                  controleDoModelo.girarGraus((lado === 'esquerda' ? -1 : 1) * PASSO_DO_GIRO_GRAUS);
                }}
              >
                <Icone nome="girar-curto" tamanho={16} />
                Girar à {lado}
              </button>
            ))}

          {temCorte && (
            <button
              type="button"
              className={`${estilos.botao} ${estilos.corte}`}
              aria-pressed={cortado}
              onClick={() => {
                marcarInteracao();
                setEstado((e) => ({ ...e, cortado: !e.cortado }));
              }}
            >
              <Icone nome="ver-por-dentro" tamanho={16} />
              Ver por dentro
            </button>
          )}

          <button
            type="button"
            ref={aproximarRef}
            className={estilos.botao}
            aria-pressed={estado.zoom}
            onClick={alternarZoom}
          >
            <Icone nome="aproximar" tamanho={16} />
            Aproximar
          </button>

          {/* Fullscreen API no palco; sem suporte no navegador, fica focável e anunciado como indisponível. */}
          <button
            type="button"
            className={`${estilos.botao} ${estilos.soIcone} ${estilos.soDesktop}`}
            aria-label="Tela cheia"
            aria-pressed={telaCheia.ativa}
            aria-disabled={telaCheia.suportada ? undefined : 'true'}
            aria-describedby={telaCheia.suportada ? undefined : idDoAvisoTelaCheia}
            onClick={() => {
              if (!telaCheia.suportada) return;
              marcarInteracao();
              telaCheia.alternar();
            }}
          >
            <Icone nome="tela-cheia" tamanho={16} />
          </button>
          {!telaCheia.suportada && (
            <span id={idDoAvisoTelaCheia} hidden>
              Tela cheia indisponível neste navegador
            </span>
          )}
        </div>
      </div>

      <ul className={estilos.miniaturas}>
        <li className={`${estilos.miniatura} ${estilos.ativa}`}>
          <span aria-hidden="true">3D</span>
          <span className="sr-only">Visualização 3D (atual)</span>
        </li>
        {FOTOS.map((descricao) => (
          <li key={descricao} className={estilos.miniatura}>
            <PhotoPlaceholder descricao={descricao} altura={200} />
          </li>
        ))}
      </ul>
    </div>
  );
}
