import { Button } from '@/components/Button';
import { Icone } from '@/components/icons';
import { HeroCanastra } from '@/components/ilustracoes/HeroCanastra';
import { Overline } from '@/components/Overline';
import estilos from './Hero.module.css';

/** Spec §5.2. Ilustração A.3 estática; o `model-viewer` entra na etapa 5. */
export function Hero() {
  return (
    <section className={`conteudo ${estilos.hero}`}>
      <div className={estilos.texto}>
        <Overline className={estilos.sobretitulo}>CURADORIA DE QUEIJOS FINOS</Overline>
        <h1 className={`titulo-home ${estilos.titulo}`}>
          Queijos de autor, <em>escolhidos à mão.</em>
        </h1>
        <p className={`texto-apoio ${estilos.paragrafo}`}>
          Do Serro à Borgonha, selecionamos queijos artesanais brasileiros e importados no ponto
          certo de maturação, e levamos até você em embalagem refrigerada.
        </p>
        <div className={estilos.botoes}>
          <Button href="/queijos" seta>
            Explorar a cave
          </Button>
          <Button href="/presentes" variante="secundario">
            Montar um presente
          </Button>
        </div>
        <p className={estilos.origens}>BRASIL · FRANÇA · ITÁLIA · SUÍÇA · ESPANHA · PORTUGAL</p>
      </div>
      <div className={estilos.palco}>
        <HeroCanastra />
        <p className={estilos.pilula}>
          <Icone nome="girar" tamanho={16} espessura={1.5} />
          Arraste para girar
        </p>
        <div className={estilos.etiqueta}>
          <p className={estilos.etiquetaTag}>BRASIL · SERRA DA CANASTRA, MG</p>
          <p className={estilos.etiquetaNome}>Canastra curado</p>
          <p className={estilos.etiquetaNota}>Leite cru · 60 dias de cura</p>
        </div>
      </div>
    </section>
  );
}
