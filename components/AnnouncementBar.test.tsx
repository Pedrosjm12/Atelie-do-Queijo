import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnnouncementBar } from './AnnouncementBar';

describe('AnnouncementBar', () => {
  it('mantém o texto da spec e fica dentro de uma região rotulada', () => {
    render(<AnnouncementBar />);
    const regiao = screen.getByRole('region', { name: 'Avisos da loja' });
    expect(regiao.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Entrega refrigerada para todo o Brasil · Frete grátis acima de R$ 180 · 5% de desconto no Pix',
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
