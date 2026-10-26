import { Icone, type NomeDoIcone } from '@/components/icons';
import estilos from './Garantias.module.css';

const GARANTIAS: readonly { icone: NomeDoIcone; titulo: string; descricao: string }[] = [
  {
    icone: 'frio',
    titulo: 'Entrega refrigerada',
    descricao: 'Caixa térmica do Ateliê até a sua porta.',
  },
  {
    icone: 'selo-certificado',
    titulo: 'Produtores certificados',
    descricao: 'Todos com SIF, SISBI ou Selo Arte.',
  },
  { icone: 'pix', titulo: '5% de desconto no Pix', descricao: 'Aprovação imediata.' },
  {
    icone: 'conversa',
    titulo: 'Fale com um queijista',
    descricao: 'Atendimento humano pelo WhatsApp.',
  },
];

/** Faixa de confiança (spec §5.3). */
export function Garantias() {
  return (
    <section className={estilos.faixa} aria-label="Garantias">
      <ul className={`conteudo ${estilos.grade}`}>
        {GARANTIAS.map((g) => (
          <li key={g.titulo} className={estilos.item}>
            <Icone nome={g.icone} tamanho={28} espessura={1.5} className={estilos.icone} />
            <div>
              <p className={estilos.titulo}>{g.titulo}</p>
              <p className={estilos.descricao}>{g.descricao}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
