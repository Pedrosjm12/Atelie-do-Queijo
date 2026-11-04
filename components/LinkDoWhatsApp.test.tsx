import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AVISO_DE_NOVA_ABA } from '@/lib/whatsapp';
import { AtendimentoProvider } from './Atendimento';
import { LinkDoWhatsApp } from './LinkDoWhatsApp';
import { SacolaProvider } from './SacolaProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

function renderizar(numero: string | null, motivo: Parameters<typeof LinkDoWhatsApp>[0]['motivo']) {
  return render(
    <SacolaProvider>
      <AtendimentoProvider numeroDoWhatsApp={numero}>
        <LinkDoWhatsApp motivo={motivo} className="verde">
          Falar agora
        </LinkDoWhatsApp>
      </AtendimentoProvider>
    </SacolaProvider>,
  );
}

describe('LinkDoWhatsApp', () => {
  it('é um <a> para o wa.me com a mensagem codificada, em nova aba e com rel seguro', () => {
    renderizar('5520900000000', { tipo: 'corporativo' });
    const link = screen.getByRole('link', { name: 'Falar agora' });
    expect(link).toHaveClass('verde');
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/5520900000000?text=${encodeURIComponent('Olá! Quero um orçamento de presentes para empresa.')}`,
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('anuncia a nova aba só pela descrição acessível (lacuna do P52 visível ao leitor de tela)', () => {
    renderizar('5520900000000', { tipo: 'geral' });
    expect(screen.getByRole('link', { name: 'Falar agora' })).toHaveAccessibleDescription(
      AVISO_DE_NOVA_ABA,
    );
    expect(AVISO_DE_NOVA_ABA).toMatch(/^\[A DEFINIR: /);
  });

  it('não renderiza nada com número null', () => {
    const { container } = renderizar(null, { tipo: 'geral' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('a, [hidden]')).toBeNull();
  });

  it('não derruba a página com número inválido: não renderiza o link', () => {
    renderizar('123', { tipo: 'geral' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('exige o provider', () => {
    expect(() => render(<LinkDoWhatsApp motivo={{ tipo: 'geral' }}>x</LinkDoWhatsApp>)).toThrow(
      'AtendimentoProvider',
    );
  });
});
