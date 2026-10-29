import { describe, expect, it } from 'vitest';
import { render as renderizar, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SacolaProvider } from '@/components/SacolaProvider';
import { listarQueijos } from '@/lib/catalogo';
import { GradeDeQueijos } from './GradeDeQueijos';

const render = (ui: ReactElement) => renderizar(<SacolaProvider>{ui}</SacolaProvider>);

describe('GradeDeQueijos', () => {
  it('sem queijos mostra a mensagem literal da §6 e nenhuma lista', () => {
    render(<GradeDeQueijos queijos={[]} />);
    expect(
      screen.getByText(
        'Nenhum queijo com esses filtros por enquanto. Que tal ampliar a busca ou pedir uma sugestão ao queijista?',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('com queijos mostra o h2 oculto "Queijos" e um item por queijo', () => {
    render(<GradeDeQueijos queijos={listarQueijos()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Queijos' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(listarQueijos().length);
  });
});
