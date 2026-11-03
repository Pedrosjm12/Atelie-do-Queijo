'use client';

import { useEffect, useRef } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { prefereMovimentoReduzido } from '@/lib/suporte3d';
import estilos from './ModeloDoQueijo.module.css';

/**
 * Controle imperativo que o `CheeseViewer` usa para os botões "Girar à esquerda/direita"
 * (WCAG 2.5.7: alternativa ao arrasto).
 */
export interface ControleDoModelo {
  /** Gira a câmera em torno da peça; positivo = a peça gira para a direita. */
  girarGraus: (graus: number) => void;
}

export type PropsDoModeloDoQueijo = {
  /** `caminhoDoModelo(slug, variante)`; nunca vem de URL nem de entrada da pessoa. */
  src: string;
  /** O mesmo `aria-label` do SVG da variante (§13). */
  alt: string;
  /** `auto-rotate`. */
  girando: boolean;
  /** Aproximar: `camera-orbit` com raio de 105% (normal) ou 89% (perto, o mesmo fator 1,18 do SVG). */
  zoom: boolean;
  aoCarregar: () => void;
  /** `error` do elemento (falha de carga ou contexto WebGL perdido) ou falha ao importar a biblioteca. */
  aoFalhar: () => void;
  /** `camera-change` causado pela pessoa (arrasto, roda, toque, setas do teclado). */
  aoInteragir: () => void;
  registrarControle?: (controle: ControleDoModelo | null) => void;
};

const DECODIFICADOR_DRACO = '/decodificadores/draco/';
const DECODIFICADOR_KTX2 = '/decodificadores/basis/';
const CARREGADOR_LOTTIE = '/decodificadores/lottie/LottieLoader.js';

const RAIO_NORMAL = '105%';
const RAIO_PERTO = '89%'; // 105% / 1,18
const VELOCIDADE_DO_GIRO = '36deg'; // uma volta a cada 10 s (§10.3)

/**
 * Textos internos do model-viewer para leitor de tela, em português (P42). As chaves são as
 * que o elemento usa; "interaction-prompt" entra no rótulo, depois do `alt`.
 */
export const TRADUCOES_A11Y = {
  front: 'Vista de frente',
  back: 'Vista por trás',
  left: 'Vista pela esquerda',
  right: 'Vista pela direita',
  'upper-front': 'Vista por cima, de frente',
  'upper-back': 'Vista por cima, por trás',
  'upper-left': 'Vista por cima, pela esquerda',
  'upper-right': 'Vista por cima, pela direita',
  'lower-front': 'Vista por baixo, de frente',
  'lower-back': 'Vista por baixo, por trás',
  'lower-left': 'Vista por baixo, pela esquerda',
  'lower-right': 'Vista por baixo, pela direita',
  'interaction-prompt': 'Use o mouse, o toque ou as setas do teclado para girar a peça.',
} as const;

/** Região de avisos do shadow DOM do elemento, que a propriedade `a11y` não cobre. */
const ROTULO_DA_REGIAO_DE_AVISOS = 'Avisos do visualizador 3D';

/** Movimento reduzido: leva a câmera ao destino sem interpolar (depois de o elemento aplicar a órbita). */
function saltarParaOAlvo(elemento: ModelViewerElement) {
  void elemento.updateComplete?.then(() => elemento.jumpCameraToGoal?.());
}

/**
 * Palco do `<model-viewer>`: importa a biblioteca só aqui (chunk tardio), aponta os
 * decodificadores para /decodificadores/ (sem CDN) ANTES de qualquer `src` e cria o elemento
 * por código, com atributos (e não propriedades), para os valores da §11 ficarem visíveis no DOM.
 * Sem `ar` (D23) e sem `poster`: o SVG faz esse papel.
 */
export default function ModeloDoQueijo(props: PropsDoModeloDoQueijo) {
  const hospedeiro = useRef<HTMLDivElement>(null);
  const elementoRef = useRef<ModelViewerElement | null>(null);
  // O que o elemento criado uma vez precisa ler depois, sem recriá-lo.
  const propsRef = useRef(props);
  const zoomAplicado = useRef(props.zoom);

  useEffect(() => {
    propsRef.current = props;
  });

  // Criação (uma vez) e destruição.
  useEffect(() => {
    let vivo = true;
    let limpar = () => {};

    void (async () => {
      // ADR-0009: nada de CDN. O construtor do elemento lê `self.ModelViewerElement` (e não a
      // classe exportada) a cada instância e, se estiver vazio, volta para o CDN do Google. Por
      // isso o objeto global é definido ANTES do `import()` e antes de qualquer `src`.
      // Mescla com o que já houver no global (não sobrescreve configuração de outra parte).
      const global = globalThis as { ModelViewerElement?: object };
      global.ModelViewerElement = {
        ...global.ModelViewerElement,
        dracoDecoderLocation: DECODIFICADOR_DRACO,
        ktx2TranscoderLocation: DECODIFICADOR_KTX2,
        // Só é usado com modelos Lottie (não usamos); o padrão apontaria para o jsDelivr.
        lottieLoaderLocation: CARREGADOR_LOTTIE,
      };
      try {
        await import('@google/model-viewer');
      } catch {
        if (vivo) propsRef.current.aoFalhar();
        return;
      }
      if (!vivo || !hospedeiro.current) return;

      const inicial = propsRef.current;
      const elemento = document.createElement('model-viewer');
      const atributos: Record<string, string> = {
        alt: inicial.alt,
        'camera-controls': '',
        'camera-orbit': `0deg 75deg ${inicial.zoom ? RAIO_PERTO : RAIO_NORMAL}`,
        'auto-rotate-delay': '0',
        'rotation-per-second': VELOCIDADE_DO_GIRO,
        'shadow-intensity': '1',
        exposure: '0.9',
        'interaction-prompt': 'none',
        'touch-action': 'pan-y',
        loading: 'eager',
        a11y: JSON.stringify(TRADUCOES_A11Y),
      };
      for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
      if (inicial.girando) elemento.setAttribute('auto-rotate', '');
      elemento.setAttribute('src', inicial.src);
      elemento.className = estilos.modelo ?? '';

      const aoCarregarEvento = (evento: Event) => {
        // `load` de uma variante que já foi trocada não vale para a atual.
        const url = (evento as CustomEvent<{ url?: string } | null>).detail?.url;
        if (url && !url.endsWith(propsRef.current.src)) return;
        propsRef.current.aoCarregar();
      };
      const aoErrar = () => propsRef.current.aoFalhar();
      const aoMexerNaCamera = (evento: Event) => {
        if ((evento as CustomEvent<{ source?: string }>).detail?.source === 'user-interaction') {
          propsRef.current.aoInteragir();
        }
      };
      elemento.addEventListener('load', aoCarregarEvento);
      elemento.addEventListener('error', aoErrar);
      elemento.addEventListener('camera-change', aoMexerNaCamera);

      hospedeiro.current.append(elemento);
      elementoRef.current = elemento;
      zoomAplicado.current = inicial.zoom;
      elemento.shadowRoot
        ?.querySelector('[role="region"]')
        ?.setAttribute('aria-label', ROTULO_DA_REGIAO_DE_AVISOS);

      propsRef.current.registrarControle?.({
        girarGraus: (graus) => {
          const orbita = elemento.getCameraOrbit?.();
          if (!orbita) return;
          // Na órbita, theta maior leva a câmera para a direita, e a peça parece girar para a esquerda.
          const theta = orbita.theta - (graus * Math.PI) / 180;
          elemento.cameraOrbit = `${theta}rad ${orbita.phi}rad ${orbita.radius}m`;
          if (prefereMovimentoReduzido()) saltarParaOAlvo(elemento);
        },
      });

      limpar = () => {
        elemento.removeEventListener('load', aoCarregarEvento);
        elemento.removeEventListener('error', aoErrar);
        elemento.removeEventListener('camera-change', aoMexerNaCamera);
        elemento.remove();
        elementoRef.current = null;
        propsRef.current.registrarControle?.(null);
      };
    })();

    return () => {
      vivo = false;
      limpar();
    };
  }, []);

  // Mudanças depois da criação: troca de variante, giro e zoom.
  const { src, alt, girando, zoom } = props;
  useEffect(() => {
    const elemento = elementoRef.current;
    if (!elemento) return;
    if (elemento.getAttribute('src') !== src) elemento.setAttribute('src', src);
    if (elemento.getAttribute('alt') !== alt) elemento.setAttribute('alt', alt);
    if (girando) elemento.setAttribute('auto-rotate', '');
    else elemento.removeAttribute('auto-rotate');
    if (zoom !== zoomAplicado.current) {
      zoomAplicado.current = zoom;
      // Mantém o ângulo atual: só o raio muda.
      const orbita = elemento.getCameraOrbit?.();
      const raio = zoom ? RAIO_PERTO : RAIO_NORMAL;
      elemento.cameraOrbit = orbita
        ? `${orbita.theta}rad ${orbita.phi}rad ${raio}`
        : `0deg 75deg ${raio}`;
      // Movimento reduzido (§10.3): o zoom é um salto, sem interpolação da câmera.
      if (prefereMovimentoReduzido()) saltarParaOAlvo(elemento);
    }
  }, [src, alt, girando, zoom]);

  return <div ref={hospedeiro} className={estilos.hospedeiro} />;
}
