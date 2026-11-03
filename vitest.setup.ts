import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// O jsdom não implementa showModal()/close() do <dialog>: simula o essencial (atributo `open`
// e evento `close`). Foco preso, Esc e backdrop só são verificados nos testes e2e.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// O jsdom não implementa Element.scrollTo (rolagem do chat): stub vazio; os testes que
// verificam a rolagem substituem por um spy.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

// O jsdom não implementa matchMedia: stub que nunca casa e aceita ouvintes. Os testes que
// precisam de uma consulta específica (ex.: movimento reduzido) substituem `window.matchMedia`.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// O jsdom não tem a Fullscreen API: simula o essencial (elemento atual, `fullscreenchange`).
// Para simular um navegador sem suporte, um teste define `document.fullscreenEnabled = false`.
const telaCheia: { atual: Element | null } = { atual: null };
if (typeof document !== 'undefined' && document.fullscreenEnabled === undefined) {
  Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
  Object.defineProperty(document, 'fullscreenElement', {
    get: () => telaCheia.atual,
    configurable: true,
  });
  Element.prototype.requestFullscreen = function requestFullscreen() {
    telaCheia.atual = this;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  };
  document.exitFullscreen = function exitFullscreen() {
    telaCheia.atual = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  };
  afterEach(() => {
    telaCheia.atual = null;
  });
}
