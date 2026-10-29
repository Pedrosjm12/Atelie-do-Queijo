import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('no máximo (padrão 10) o + fica aria-disabled e não chama onChange', async () => {
    const aoMudar = vi.fn();
    render(<QuantityStepper valor={10} onChange={aoMudar} />);
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    expect(mais).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(mais);
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('abaixo do máximo o + soma 1', async () => {
    const aoMudar = vi.fn();
    render(<QuantityStepper valor={9} onChange={aoMudar} />);
    const mais = screen.getByRole('button', { name: 'Aumentar quantidade' });
    expect(mais).not.toHaveAttribute('aria-disabled');
    await userEvent.click(mais);
    expect(aoMudar).toHaveBeenCalledWith(10);
  });
});
