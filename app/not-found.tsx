import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { CabecalhoDePagina } from '@/components/CabecalhoDePagina';
import estilos from './not-found.module.css';

// O Next devolve status 404 e injeta `noindex` sozinho (ADR-0011, decisão 5).
export const metadata: Metadata = { title: 'Esta página foi maturar em outro lugar.' };

/** Página 404 (spec §12): serve URLs sem rota e as chamadas a `notFound()`. */
export default function NaoEncontrada() {
  return (
    <div className={`conteudo ${estilos.pagina}`}>
      <CabecalhoDePagina titulo="Esta página foi maturar em outro lugar." />
      <div className={estilos.acoes}>
        <Button href="/">Volta para a cave</Button>
      </div>
    </div>
  );
}
