import estilos from './AnnouncementBar.module.css';

/**
 * Faixa de avisos (spec §4.2). É uma região rotulada (<section aria-label>), e não um segundo
 * "banner": o landmark banner continua sendo só o <header> do site.
 */
export function AnnouncementBar() {
  return (
    <section className={estilos.faixa} aria-label="Avisos da loja">
      <p className={estilos.texto}>
        Entrega refrigerada para todo o Brasil · Frete grátis acima de R$ 180 · 5% de desconto no
        Pix
      </p>
    </section>
  );
}
