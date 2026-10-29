import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('no máximo (padrão 10) o + fica aria-disabled e não chama onChange', async () => {
    const aoMudar = vi.fn();
    render(<QuantityStepper valor={10} onChange={aoMudar} />);
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    expect(mais).toHaveAttribute('aria-disabled', 'true');
    expect(mais).toHaveAccessibleDescription('Máximo de 10 por item');
    await userEvent.click(mais);
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('abaixo do máximo o + soma 1', async () => {
    const aoMudar = vi.fn();
    render(<QuantityStepper valor={9} onChange={aoMudar} />);
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    expect(mais).not.toHaveAttribute('aria-disabled');
    expect(mais).not.toHaveAccessibleDescription();
    await userEvent.click(mais);
    expect(aoMudar).toHaveBeenCalledWith(10);
  });

  it('o grupo "Quantidade" envolve o número, lido pelo conteúdo do output', () => {
    render(<QuantityStepper valor={4} onChange={vi.fn()} />);
    const grupo = screen.getByRole('group', { name: 'Quantidade' });
    expect(within(grupo).getByRole('status')).toHaveTextContent('4');
    expect(within(grupo).getByRole('status')).not.toHaveAttribute('aria-label');
  });
});
