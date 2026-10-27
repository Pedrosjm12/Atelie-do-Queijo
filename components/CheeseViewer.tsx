'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import type { Cheese } from '@/data/cheeses';
import { CheeseIllustration } from './CheeseIllustration';
import { Icone } from './icons';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { ILUSTRACOES_DE_PRODUTO } from './ilustracoes/CanastraProduto';
import estilos from './CheeseViewer.module.css';

type CheeseViewerProps = {
  queijo: Cheese;
};

type EstadoDoVisualizador = {
  cortado: boolean;
  girando: boolean;
  zoom: boolean;
};

const FOTOS = ['na tábua', 'produtor', 'fazenda'] as const;

/** Botões que o leitor de tela e o teclado alcançam: ignora os ocultos por CSS (display: none). */
function botoesVisiveis(barra: HTMLElement | null): HTMLButtonElement[] {
  if (!barra) return [];
  return Array.from(barra.querySelectorAll<HTMLButtonElement>('button')).filter(
    (botao) => getComputedStyle(botao).display !== 'none',
  );
}

/**
 * Palco do queijo (spec §7.2, §7.6 e §10.3). Nesta etapa só mostra ilustração SVG;
 * o `model-viewer` entra aqui dentro na etapa 5, sem mudar a interface pública.
 */
export function CheeseViewer({ queijo }: CheeseViewerProps) {
  const ilustracoes = ILUSTRACOES_DE_PRODUTO[queijo.slug];
  // Só os queijos com arte A.5 têm corte (P3).
  const temCorte = ilustracoes !== undefined;

  const [estado, setEstado] = useState<EstadoDoVisualizador>({
    cortado: true,
    girando: true,
    zoom: false,
  });
  const [interagiu, setInteragiu] = useState(false);

  const cortado = temCorte && estado.cortado;
  const marcarInteracao = () => setInteragiu(true);

  const idDoAvisoTelaCheia = useId();

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
      <div className={estilos.palco}>
        {!interagiu && (
          <p className={estilos.dica} data-testid="dica-3d">
            <Icone nome="girar" tamanho={16} />
            <span>
              Arraste para girar
              <span className={estilos.dicaExtra}> · Toque duas vezes para aproximar</span>
            </span>
          </p>
        )}

        <span className={estilos.indicador}>{cortado ? 'POR DENTRO' : 'PEÇA INTEIRA'}</span>

        {/* Detecta só a primeira interação (esconde a dica); o arraste real vem na etapa 5. */}
        <div className={estilos.ilustracao} data-zoom={estado.zoom} onPointerDown={marcarInteracao}>
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
            aria-pressed={estado.girando}
            onClick={() => {
              marcarInteracao();
              // Efeito na etapa 5 (rotação automática do model-viewer); por ora só o estado.
              setEstado((e) => ({ ...e, girando: !e.girando }));
            }}
          >
            <Icone nome="girar-curto" tamanho={16} />
            Girar
          </button>

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
            onClick={() => {
              marcarInteracao();
              setEstado((e) => ({ ...e, zoom: !e.zoom }));
            }}
          >
            <Icone nome="aproximar" tamanho={16} />
            Aproximar
          </button>

          {/* Sem ação até a etapa 5 (Fullscreen API): focável, anunciado como indisponível. */}
          <button
            type="button"
            className={`${estilos.botao} ${estilos.soIcone} ${estilos.soDesktop}`}
            aria-label="Tela cheia"
            aria-disabled="true"
            aria-describedby={idDoAvisoTelaCheia}
          >
            <Icone nome="tela-cheia" tamanho={16} />
          </button>
          <span id={idDoAvisoTelaCheia} hidden>
            Tela cheia disponível em breve
          </span>
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
