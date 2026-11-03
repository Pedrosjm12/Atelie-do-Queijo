import estilos from './Header.module.css';
import { HeaderFrame } from './HeaderFrame';
import { HeaderNav } from './HeaderNav';
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
          <LinkDaSacola />
        </div>
      </div>
    </HeaderFrame>
  );
}
