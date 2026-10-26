import estilos from './AnnouncementBar.module.css';

export function AnnouncementBar() {
  return (
    <div className={estilos.faixa}>
      <p className={estilos.texto}>
        Entrega refrigerada para todo o Brasil · Frete grátis acima de R$ 180 · 5% de desconto no
        Pix
      </p>
    </div>
  );
}
