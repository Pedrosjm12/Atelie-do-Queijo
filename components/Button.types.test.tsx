import { describe, expect, it } from 'vitest';
import { Button, type ButtonProps } from './Button';

// Verificado pelo typecheck: cada @ts-expect-error falha se o tipo deixar de recusar o caso.
describe('tipos do Button', () => {
  it('recusa combinações inválidas', () => {
    // @ts-expect-error opcao exige `selecionado`
    const semSelecionado = <Button variante="opcao">Chip</Button>;
    // @ts-expect-error `selecionado` só existe em opcao
    const foraDeOpcao = <Button selecionado>Botão</Button>;
    // @ts-expect-error opcao nunca é link
    const link: ButtonProps = { children: 'X', variante: 'opcao', selecionado: true, href: '/' };
    expect([semSelecionado, foraDeOpcao, link]).toHaveLength(3);
  });
});
