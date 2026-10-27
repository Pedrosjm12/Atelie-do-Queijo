import '@testing-library/jest-dom/vitest';

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
