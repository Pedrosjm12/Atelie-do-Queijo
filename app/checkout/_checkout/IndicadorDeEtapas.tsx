import estilos from './Checkout.module.css';

export type Etapa = 'entrega' | 'pagamento' | 'confirmacao';

// Textos literais da spec §10.2.
const ETAPAS: readonly { id: Etapa; texto: string }[] = [
  { id: 'entrega', texto: '1. Entrega' },
  { id: 'pagamento', texto: '2. Pagamento' },
  { id: 'confirmacao', texto: '3. Confirmação' },
];

/** `<ol>` das três etapas; a atual leva `aria-current="step"`. */
export function IndicadorDeEtapas({ atual }: { atual: Etapa }) {
  return (
    // `role="list"` devolve a semântica de lista que o `list-style: none` tira no Safari/VoiceOver.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari/VoiceOver tira a lista com list-style: none
    <ol className={estilos.etapas} role="list" aria-label="Etapas do pedido">
      {ETAPAS.map((etapa) => (
        <li
          key={etapa.id}
          className={etapa.id === atual ? `${estilos.etapa} ${estilos.etapaAtual}` : estilos.etapa}
          aria-current={etapa.id === atual ? 'step' : undefined}
        >
          {etapa.texto}
          {etapa.id === atual && <span className="sr-only"> (etapa atual)</span>}
        </li>
      ))}
    </ol>
  );
}
