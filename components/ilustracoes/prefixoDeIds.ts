import { useId } from 'react';

/**
 * Prefixo único por instância de SVG, para os `id` de gradientes não colidirem quando
 * o mesmo desenho aparece mais de uma vez na página (ADR-0005).
 *
 * `useId()` funciona em Server Component síncrono. Os caracteres fora de [A-Za-z0-9_-]
 * (por exemplo `:` ou `«»` em versões antigas do React) são removidos para o valor ser
 * seguro dentro de `url(#…)`. O sufixo `-` separa o prefixo do nome do gradiente.
 */
export function usePrefixoDeIds(): string {
  const bruto = useId();
  return `ilu${bruto.replace(/[^A-Za-z0-9_-]/g, '')}-`;
}
