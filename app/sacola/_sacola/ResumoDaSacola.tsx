import { Button } from '@/components/Button';
import { FRETE_GRATIS_A_PARTIR_DE, faltaParaFreteGratis } from '@/lib/commerce';
import type { Centavos } from '@/lib/dinheiro';
import { formatarPreco } from '@/lib/format';
import estilos from './Sacola.module.css';

type ResumoDaSacolaProps = {
  subtotal: Centavos;
  presente: boolean;
  aoTirarPresente: () => void;
};

/** Sempre filho de `ConteudoDaSacola` (que garante a sacola pronta). Subtotal, barra de frete grátis (P29, P38), embalagem para presente (P31) e botão do checkout. */
export function ResumoDaSacola({ subtotal, presente, aoTirarPresente }: ResumoDaSacolaProps) {
  const falta = faltaParaFreteGratis(subtotal);
  const progresso = Math.min(100, (subtotal / FRETE_GRATIS_A_PARTIR_DE) * 100);
  return (
    <section className={estilos.resumo} aria-label="Resumo do pedido">
      <p className={estilos.subtotal}>
        <span>Subtotal</span>
        <span className={estilos.valor}>{formatarPreco(subtotal)}</span>
      </p>

      <div className={estilos.frete}>
        {/* Região viva: o texto muda quando a quantidade muda, e o leitor de tela avisa. */}
        <p className={estilos.textoFrete} aria-live="polite">
          {falta === 0
            ? 'Frete grátis garantido.'
            : `Faltam ${formatarPreco(falta)} para o frete grátis.`}
        </p>
        <div className={estilos.trilha} aria-hidden="true">
          <div className={estilos.preenchimento} style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {presente ? (
        <p className={estilos.presente}>
          <span>Embalagem para presente</span>
          <button
            type="button"
            className={estilos.tirar}
            aria-label="Tirar a embalagem para presente"
            onClick={aoTirarPresente}
          >
            Tirar
          </button>
        </p>
      ) : null}

      <Button href="/checkout" seta className={estilos.finalizar}>
        Finalizar compra
      </Button>
    </section>
  );
}
