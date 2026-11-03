import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SemQuebra } from './SemQuebra';

describe('SemQuebra (D14)', () => {
  it('mantém o texto idêntico e isola CEP e "e-mail" em spans', () => {
    const { container } = render(
      <p>
        <SemQuebra texto="Informe um CEP, por exemplo 01310-100. Deixe seu e-mail e avisamos." />
      </p>,
    );
    expect(container.textContent).toBe(
      'Informe um CEP, por exemplo 01310-100. Deixe seu e-mail e avisamos.',
    );
    const spans = [...container.querySelectorAll('span')].map((s) => s.textContent);
    expect(spans).toEqual(['01310-100', 'e-mail']);
  });

  it('sem CEP nem e-mail, não cria spans', () => {
    const { container } = render(<SemQuebra texto="Chega refrigerado em até 3 dias úteis." />);
    expect(container.querySelector('span')).toBeNull();
  });
});
