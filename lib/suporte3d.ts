// Detecção de recursos do navegador para o visualizador 3D. Só roda no navegador:
// no servidor, todas as funções devolvem o valor mais conservador.

let cacheWebGL: boolean | undefined;

/**
 * Cria um canvas, tenta 'webgl2' e depois 'webgl' e libera o contexto na hora
 * (WEBGL_lose_context), para não gastar um dos poucos contextos do navegador.
 * O resultado fica em cache.
 */
export function temWebGL(): boolean {
  if (cacheWebGL !== undefined) return cacheWebGL;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const contexto = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    cacheWebGL = contexto !== null;
    contexto?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cacheWebGL = false;
  }
  return cacheWebGL;
}

/** Só para os testes: apaga o resultado em cache de `temWebGL`. */
export function limparCacheDoWebGL(): void {
  cacheWebGL = undefined;
}

const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

/** `prefers-reduced-motion: reduce` (spec §10.3). */
export function prefereMovimentoReduzido(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(CONSULTA_MOVIMENTO_REDUZIDO).matches;
}

/** Assinatura para `useSyncExternalStore`: avisa quando a preferência muda. */
export function assinarMovimentoReduzido(aoMudar: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const consulta = window.matchMedia(CONSULTA_MOVIMENTO_REDUZIDO);
  consulta.addEventListener('change', aoMudar);
  return () => consulta.removeEventListener('change', aoMudar);
}

/** `navigator.connection.saveData`: com economia de dados, o GLB não baixa sozinho. */
export function querEconomizarDados(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return conexao?.saveData === true;
}
