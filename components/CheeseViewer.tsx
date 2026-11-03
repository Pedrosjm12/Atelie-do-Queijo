'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { Cheese } from '@/data/cheeses';
import { temModelo } from '@/data/modelos3d';
import { assinarMovimentoReduzido, prefereMovimentoReduzido } from '@/lib/suporte3d';
import { CheeseIllustration } from './CheeseIllustration';
import { Icone } from './icons';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { ILUSTRACOES_DE_PRODUTO } from './ilustracoes/CanastraProduto';
import { useTelaCheia } from './useTelaCheia';
import estilos from './CheeseViewer.module.css';

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

const FOTOS = ['na tábua', 'produtor', 'fazenda'] as const;

/** Botões que o leitor de tela e o teclado alcançam: ignora os ocultos por CSS (display: none). */
function botoesVisiveis(barra: HTMLElement | null): HTMLButtonElement[] {
  if (!barra) return [];
  return Array.from(barra.querySelectorAll<HTMLButtonElement>('button')).filter(
    (botao) => getComputedStyle(botao).display !== 'none',
  );
}

/**
 * Palco do queijo (spec §7.2, §7.6 e §10.3). Mostra a ilustração SVG; o `model-viewer` entra
 * aqui dentro no bloco B da etapa 5 (só para queijos com GLB no manifesto), sem mudar a
 * interface pública. Tela cheia e Aproximar (inclusive por duplo toque) já valem sobre o SVG.
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

  // Girar (P39 = C): sem GLB o SVG não gira; o botão fica desabilitado e com aria-pressed="false".
  // Com movimento reduzido (§10.3), o giro só liga se a pessoa pedir.
  const giroDisponivel = temModelo(queijo.slug, cortado ? 'cortado' : 'inteiro');
  const movimentoReduzido = useSyncExternalStore(
    assinarMovimentoReduzido,
    prefereMovimentoReduzido,
    () => false,
  );
  const girando = giroDisponivel && (estado.girando ?? !movimentoReduzido);

  const palcoRef = useRef<HTMLDivElement>(null);
  const telaCheia = useTelaCheia(palcoRef);
  const idDoAvisoTelaCheia = useId();
  const idDoAvisoGiro = useId();

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
  }, [sincronizarTabIndex, temCorte]);

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

  return (
    <div>
      <div ref={palcoRef} className={estilos.palco}>
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

        {/* A primeira interação esconde a dica; duplo clique ou duplo toque alterna o Aproximar. */}
        <div
          className={estilos.ilustracao}
          data-zoom={estado.zoom}
          onPointerDown={marcarInteracao}
          onPointerUp={aoSoltarPonteiro}
          onDoubleClick={aoDarDoisCliques}
        >
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
            className={`${estilos.botao} ${estilos.soDesktop}`}
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
