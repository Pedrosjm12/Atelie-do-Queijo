import { classesDoBotao } from '@/components/Button';
import { LinkDoWhatsApp } from '@/components/LinkDoWhatsApp';
import estilos from './Presentes.module.css';

/** ID da âncora do rodapé ("Presentes corporativos"); o `FocoNoConteudo` leva o foco a ele. */
export const ID_DO_BLOCO_CORPORATIVO = 'presentes-corporativos';

/**
 * Bloco corporativo (spec §12). Sem número do WhatsApp o botão não existe e fica só o texto (P58).
 * Um único botão principal dourado, sem verde (a §3.1 só o permite no atendimento).
 */
export function BlocoCorporativo() {
  return (
    <section
      id={ID_DO_BLOCO_CORPORATIVO}
      tabIndex={-1}
      className={estilos.corporativo}
      aria-labelledby="titulo-corporativo"
    >
      <div>
        <h2 id="titulo-corporativo" className={estilos.tituloDaCaixa}>
          Presentes para equipes e clientes.
        </h2>
        <p className={estilos.textoDaCaixa}>Pedidos a partir de [n] kits com personalização.</p>
      </div>
      <LinkDoWhatsApp
        motivo={{ tipo: 'corporativo' }}
        className={classesDoBotao({
          variante: 'principal',
          tamanho: 'compacto',
          className: estilos.botao,
        })}
      >
        Pedir orçamento
      </LinkDoWhatsApp>
    </section>
  );
}
