import Link from 'next/link';
import estilos from './Header.module.css';
import { HeaderFrame } from './HeaderFrame';
import { HeaderNav } from './HeaderNav';
import { Icone } from './icons';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';

// Estático até a etapa 4, quando o botão da sacola passa a ler o contexto da sacola.
const itensNaSacola: number = 0;

export function Header() {
  return (
    <HeaderFrame>
      <div className={estilos.conteiner}>
        <MobileMenu />
        <div className={estilos.logo}>
          <Logo />
        </div>
        <HeaderNav />
        <div className={estilos.acoes}>
          <button type="button" className={estilos.botaoIcone} aria-label="Buscar">
            <Icone nome="buscar" tamanho={20} />
          </button>
          <button type="button" className={estilos.botaoIcone} aria-label="Minha conta">
            <Icone nome="conta" tamanho={20} />
          </button>
          <Link
            href="/sacola"
            className={estilos.sacola}
            aria-label={`Sacola, ${itensNaSacola} ${itensNaSacola === 1 ? 'item' : 'itens'}`}
          >
            <Icone nome="sacola" tamanho={18} />
            <span className={estilos.sacolaTexto}>Sacola</span>
            <span className={estilos.contador}>{itensNaSacola}</span>
          </Link>
        </div>
      </div>
    </HeaderFrame>
  );
}
