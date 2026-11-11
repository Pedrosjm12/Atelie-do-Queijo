import { serializar, type DadoEstruturado } from '@/lib/dadosEstruturados';

/**
 * Server Component: `<script type="application/ld+json">`. Recebe só o que os construtores de
 * `lib/dadosEstruturados` devolvem; `serializar` escapa `<`. Único lugar do projeto com
 * `dangerouslySetInnerHTML`.
 */
export function DadosEstruturados({
  dados,
}: {
  dados: DadoEstruturado | readonly (DadoEstruturado | null)[];
}) {
  const lista = Array.isArray(dados)
    ? (dados as readonly (DadoEstruturado | null)[]).filter((d) => d !== null)
    : (dados as DadoEstruturado);
  if (Array.isArray(lista) && lista.length === 0) return null;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializar(lista) }} />
  );
}
