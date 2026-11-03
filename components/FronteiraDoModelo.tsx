'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; aoFalhar: () => void };

/**
 * Se o chunk do `ModeloDoQueijo` não baixar (rede, versão nova no ar), o `React.lazy` lança no
 * render. Sem esta fronteira o erro derrubaria a página de produto; aqui ele vira "voltar ao SVG".
 *
 * Não há "nova tentativa" aqui de propósito: o `React.lazy` guarda a
 * promessa rejeitada, então remontar o componente cairia de novo no mesmo erro. Depois da falha a
 * situação vira `erro` (SVG); a pessoa tenta de novo recarregando a página.
 */
export class FronteiraDoModelo extends Component<Props, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch() {
    this.props.aoFalhar();
  }

  render() {
    return this.state.falhou ? null : this.props.children;
  }
}
