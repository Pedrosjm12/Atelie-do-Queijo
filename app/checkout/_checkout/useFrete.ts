'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { consultarFrete } from '@/app/_acoes/frete';
import type { ResultadoDoFrete } from '@/lib/commerce';

export type EstadoDoFrete =
  | { tipo: 'ocioso' }
  | { tipo: 'calculando' }
  | { tipo: 'resultado'; resultado: ResultadoDoFrete }
  | { tipo: 'cep-invalido' }
  | { tipo: 'falha' };

export type FreteDoCheckout = {
  estado: EstadoDoFrete;
  /** Consulta o CEP. Chamadas repetidas para o mesmo CEP enquanto uma está pendente dividem a mesma consulta. */
  consultar: (cep: string) => Promise<EstadoDoFrete>;
  /** O CEP mudou: a consulta pendente (se houver) deixa de valer e o resultado sai da tela. */
  reiniciar: () => void;
};

/**
 * Consulta de frete do checkout (mesmos estados do `ShippingCalculator`). Só a resposta da última
 * consulta vale; ao desmontar, a resposta pendente é descartada (resolve como `ocioso`). Vive no
 * fluxo, não na etapa: o resultado sobrevive à ida e volta entre as etapas.
 */
export function useFrete(): FreteDoCheckout {
  const [estado, setEstado] = useState<EstadoDoFrete>({ tipo: 'ocioso' });
  const montado = useRef(true);
  const consultaAtual = useRef(0);
  const pendente = useRef<{ cep: string; promessa: Promise<EstadoDoFrete> } | null>(null);

  // O ciclo marca/desmarca também vale no modo estrito, que monta, desmonta e monta de novo.
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const consultar = useCallback((cep: string): Promise<EstadoDoFrete> => {
    if (pendente.current?.cep === cep) return pendente.current.promessa;
    const minha = ++consultaAtual.current;
    setEstado({ tipo: 'calculando' });
    const promessa = (async (): Promise<EstadoDoFrete> => {
      let proximo: EstadoDoFrete;
      try {
        const resposta = await consultarFrete(cep);
        if (resposta.ok) proximo = { tipo: 'resultado', resultado: resposta.resultado };
        else if (resposta.erro === 'cep-invalido') proximo = { tipo: 'cep-invalido' };
        else proximo = { tipo: 'falha' };
      } catch {
        // Rede fora do ar ou "Failed to find Server Action" depois de uma nova publicação.
        proximo = { tipo: 'falha' };
      }
      if (consultaAtual.current === minha) pendente.current = null;
      if (!montado.current || consultaAtual.current !== minha) return { tipo: 'ocioso' };
      setEstado(proximo);
      return proximo;
    })();
    pendente.current = { cep, promessa };
    return promessa;
  }, []);

  const reiniciar = useCallback(() => {
    consultaAtual.current++;
    pendente.current = null;
    setEstado({ tipo: 'ocioso' });
  }, []);

  return { estado, consultar, reiniciar };
}
