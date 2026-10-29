import { Button } from '@/components/Button';
import estilos from './SacolaVazia.module.css';

/** Estado vazio (spec §10.1), igual na `/sacola` e no `/checkout`. */
export function SacolaVazia() {
  return (
    <div className={estilos.vazia}>
      <p className={estilos.textoVazio}>Sua tábua ainda está vazia.</p>
      <Button href="/queijos" seta>
        Explorar a cave
      </Button>
    </div>
  );
}
