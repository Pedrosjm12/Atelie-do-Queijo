import estilos from './Header.module.css';
import { HeaderFrame } from './HeaderFrame';
import { HeaderNav } from './HeaderNav';
import { Icone } from './icons';
import { LinkDaSacola } from './LinkDaSacola';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';

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
          <LinkDaSacola />
        </div>
      </div>
    </HeaderFrame>
  );
}
