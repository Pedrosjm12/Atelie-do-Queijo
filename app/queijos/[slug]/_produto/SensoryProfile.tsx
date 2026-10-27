import type { DetalheDoQueijo, Nivel } from '@/data/cheeses';
import estilos from './Detalhes.module.css';

type ChaveDoPerfil = keyof DetalheDoQueijo['perfil'];

/** Atributos e escalas da spec §7.3. */
const ATRIBUTOS: readonly { chave: ChaveDoPerfil; nome: string; escala: string }[] = [
  { chave: 'intensidade', nome: 'Intensidade', escala: 'suave → marcante' },
  { chave: 'cremosidade', nome: 'Cremosidade', escala: 'firme → derrete' },
  { chave: 'salinidade', nome: 'Salinidade', escala: 'delicado → salgado' },
  { chave: 'aroma', nome: 'Aroma', escala: 'leve → pungente' },
];

const NIVEIS: readonly Nivel[] = [1, 2, 3, 4, 5];

type SensoryProfileProps = {
  perfil: DetalheDoQueijo['perfil'];
};

/** Perfil sensorial (spec §7.3): quatro linhas com cinco barras. Valor `null` mostra a lacuna. */
export function SensoryProfile({ perfil }: SensoryProfileProps) {
  return (
    <section className={estilos.perfil} aria-labelledby="titulo-perfil-sensorial">
      <h2 id="titulo-perfil-sensorial" className={`titulo-bloco ${estilos.tituloDoPerfil}`}>
        Perfil sensorial
      </h2>
      <ul className={estilos.atributos}>
        {ATRIBUTOS.map(({ chave, nome, escala }) => {
          const valor = perfil[chave];
          return (
            <li key={chave}>
              <div className={estilos.linhaDoAtributo}>
                <span className={estilos.nomeDoAtributo}>{nome}</span>
                <span className={estilos.escala}>{escala}</span>
              </div>
              {valor === null ? (
                <p className={estilos.lacuna}>[A DEFINIR]</p>
              ) : (
                <div role="img" aria-label={`${nome}: ${valor} de 5`} className={estilos.barras}>
                  {NIVEIS.map((nivel) => (
                    <span
                      key={nivel}
                      className={nivel <= valor ? estilos.barraCheia : estilos.barra}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
