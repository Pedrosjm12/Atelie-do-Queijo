import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { obterQueijo } from '@/lib/catalogo';
import { SensoryProfile } from './SensoryProfile';

function perfilDe(slug: string) {
  const q = obterQueijo(slug);
  if (!q) throw new Error(slug);
  return q.detalhe.perfil;
}

describe('SensoryProfile', () => {
  it('Canastra curado: quatro grupos com o valor da spec', () => {
    render(<SensoryProfile perfil={perfilDe('canastra-curado')} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Perfil sensorial' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Intensidade: 4 de 5' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cremosidade: 2 de 5' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Salinidade: 3 de 5' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Aroma: 4 de 5' })).toBeInTheDocument();
    expect(screen.getByText('suave → marcante')).toBeInTheDocument();
    expect(screen.getByText('firme → derrete')).toBeInTheDocument();
    expect(screen.getByText('delicado → salgado')).toBeInTheDocument();
    expect(screen.getByText('leve → pungente')).toBeInTheDocument();
  });

  it('tem cinco barras por grupo, preenchidas até o valor', () => {
    render(<SensoryProfile perfil={perfilDe('canastra-curado')} />);
    const grupo = screen.getByRole('img', { name: 'Intensidade: 4 de 5' });
    expect(grupo.children).toHaveLength(5);
    const cheias = Array.from(grupo.children).filter((b) => b.className.includes('barraCheia'));
    expect(cheias).toHaveLength(4);
  });

  it('valores nulos mostram [A DEFINIR] no lugar das barras', () => {
    render(<SensoryProfile perfil={perfilDe('manchego')} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('[A DEFINIR]')).toHaveLength(4);
  });
});
