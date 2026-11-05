import estilos from './Presentes.module.css';

const ITENS: readonly string[] = [
  'Embalagem de presente',
  'Cartão com mensagem (até 200 caracteres)',
  'Data de entrega escolhida',
  'Nota fiscal sem valor visível ao presenteado.',
];

/** "Em todo kit" (spec §12, P56): quatro itens, sem ícones. */
export function EmTodoKit() {
  return (
    <section className={estilos.emTodoKit} aria-labelledby="titulo-em-todo-kit">
      <h2 id="titulo-em-todo-kit" className={estilos.tituloDaCaixa}>
        Em todo kit
      </h2>
      <ul className={estilos.itens}>
        {ITENS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
