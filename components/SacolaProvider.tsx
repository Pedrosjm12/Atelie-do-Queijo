'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SlugDoQueijo } from '@/data/cheeses';
import { AvisoDaSacola } from './AvisoDaSacola';
import { ContextoDoAviso, type AvisoAtual } from './avisoDaSacola.contexto';
import {
  CHAVE_DA_SACOLA,
  QUANTIDADE_MAXIMA_POR_ITEM,
  SACOLA_VAZIA,
  lerSacolaSalva,
  reduzirSacola,
  serializarSacola,
  totalDeItens as somarItens,
  type AcaoDaSacola,
  type Sacola,
} from '@/lib/sacola';

// Importa só TIPOS de `data/cheeses`: o provider fica no pacote global (ADR-0008 §2).

export const TEXTO_ADICIONADO = 'Adicionado à sacola. Boa escolha.';
export const TEXTO_LIMITE = `Você já tem ${QUANTIDADE_MAXIMA_POR_ITEM} unidades deste queijo na sacola.`;

export type ItemParaAdicionar = {
  slug: SlugDoQueijo;
  formatoId: string;
  quantidade?: number;
  presente?: boolean;
};

export type EstadoDaSacola = {
  sacola: Sacola;
  /** `false` no servidor, na primeira renderização e até ler o localStorage. */
  pronta: boolean;
  totalDeItens: number;
};

/** Ações estáveis (identidade fixa): quem só dispara ações não re-renderiza com a sacola. */
export type AcoesDaSacola = {
  adicionar: (item: ItemParaAdicionar) => void;
  alterarQuantidade: (slug: SlugDoQueijo, formatoId: string, quantidade: number) => void;
  remover: (slug: SlugDoQueijo, formatoId: string) => void;
  definirPresente: (presente: boolean) => void;
  limpar: () => void;
};

export type ValorDaSacola = EstadoDaSacola & AcoesDaSacola;

const ContextoDoEstado = createContext<EstadoDaSacola | null>(null);
const ContextoDasAcoes = createContext<AcoesDaSacola | null>(null);

/** `null` quando o localStorage não existe ou lança (SecurityError, modo privado, etc.). */
function lerDoStorage(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_DA_SACOLA);
  } catch {
    return null;
  }
}

/** Falha (cota cheia, acesso negado) é silenciosa: a sacola segue só em memória. */
function gravarNoStorage(sacola: Sacola): void {
  try {
    window.localStorage.setItem(CHAVE_DA_SACOLA, serializarSacola(sacola));
  } catch {
    // sem localStorage: só em memória
  }
}

/**
 * Estado da sacola (ADR-0003/0008). Servidor e 1ª renderização: vazia. Depois do mount lê e
 * sanitiza o localStorage; SÓ ENTÃO passa a gravar, e apenas em ações do usuário. O evento
 * `storage` de outra aba substitui a sacola em memória, sem regravar.
 */
export function SacolaProvider({ children }: { children: ReactNode }) {
  const [sacola, setSacola] = useState<Sacola>(SACOLA_VAZIA);
  const [pronta, setPronta] = useState(false);
  const atual = useRef<Sacola>(SACOLA_VAZIA);
  const lida = useRef(false);
  const [aviso, setAviso] = useState<AvisoAtual | null>(null);
  const contadorDoAviso = useRef(0);

  useEffect(() => {
    try {
      const { sacola: salva } = lerSacolaSalva(lerDoStorage());
      // Não regrava a versão corrigida: só a próxima ação do usuário grava.
      atual.current = salva;
      lida.current = true;
      // Leitura do localStorage (sistema externo) só é possível depois do mount, para não divergir do HTML do servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSacola(salva);
      setPronta(true);
    } catch {
      lida.current = true;
      setPronta(true);
    }

    function aoMudarOStorage(evento: StorageEvent) {
      try {
        if (evento.storageArea !== window.localStorage) return;
        // `key === null` é localStorage.clear() em outra aba.
        if (evento.key !== null && evento.key !== CHAVE_DA_SACOLA) return;
        const { sacola: nova } = lerSacolaSalva(evento.key === null ? null : evento.newValue);
        atual.current = nova;
        setSacola(nova);
      } catch {
        // evento malformado: ignora
      }
    }
    window.addEventListener('storage', aoMudarOStorage);
    return () => window.removeEventListener('storage', aoMudarOStorage);
  }, []);

  const despachar = useCallback((acao: AcaoDaSacola) => {
    const proxima = reduzirSacola(atual.current, acao);
    if (proxima === atual.current) return;
    atual.current = proxima;
    setSacola(proxima);
    if (lida.current) gravarNoStorage(proxima);
  }, []);

  const adicionar = useCallback(
    ({ slug, formatoId, quantidade = 1, presente }: ItemParaAdicionar) => {
      const quantidadeNaLinha = () =>
        atual.current.itens.find((i) => i.slug === slug && i.formatoId === formatoId)?.quantidade ??
        0;
      const antes = quantidadeNaLinha();
      despachar({ tipo: 'adicionar', slug, formatoId, quantidade, presente });
      const depois = quantidadeNaLinha();
      // Formato inexistente ou esgotado: o reducer ignora e nada é anunciado.
      // O sucesso só vale se TODA a quantidade pedida entrou; cortada pelo limite, avisa o limite.
      const pedida = Math.min(QUANTIDADE_MAXIMA_POR_ITEM, Math.max(1, quantidade));
      const texto =
        depois > antes && depois >= antes + pedida
          ? TEXTO_ADICIONADO
          : depois === QUANTIDADE_MAXIMA_POR_ITEM
            ? TEXTO_LIMITE
            : null;
      if (texto === null) return;
      contadorDoAviso.current += 1;
      setAviso({ texto, id: contadorDoAviso.current });
    },
    [despachar],
  );

  const esconderAviso = useCallback(() => setAviso(null), []);

  const acoes = useMemo<AcoesDaSacola>(
    () => ({
      adicionar,
      alterarQuantidade: (slug, formatoId, quantidade) =>
        despachar({ tipo: 'alterar-quantidade', slug, formatoId, quantidade }),
      remover: (slug, formatoId) => despachar({ tipo: 'remover', slug, formatoId }),
      definirPresente: (presente) => despachar({ tipo: 'definir-presente', presente }),
      limpar: () => despachar({ tipo: 'limpar' }),
    }),
    [despachar, adicionar],
  );

  const estado = useMemo<EstadoDaSacola>(
    () => ({ sacola, pronta, totalDeItens: somarItens(sacola) }),
    [sacola, pronta],
  );

  return (
    <ContextoDasAcoes value={acoes}>
      <ContextoDoEstado value={estado}>
        <ContextoDoAviso value={aviso}>
          {children}
          <AvisoDaSacola aoExpirar={esconderAviso} />
        </ContextoDoAviso>
      </ContextoDoEstado>
    </ContextoDasAcoes>
  );
}

/** Só as ações (identidade estável): não re-renderiza quando a sacola muda. */
export function useAcoesDaSacola(): AcoesDaSacola {
  const acoes = useContext(ContextoDasAcoes);
  if (!acoes) throw new Error('useAcoesDaSacola precisa estar dentro de <SacolaProvider>.');
  return acoes;
}

/** Só o estado (sacola, pronta, totalDeItens). */
export function useEstadoDaSacola(): EstadoDaSacola {
  const estado = useContext(ContextoDoEstado);
  if (!estado) throw new Error('useEstadoDaSacola precisa estar dentro de <SacolaProvider>.');
  return estado;
}

/** Compatibilidade: estado e ações juntos (re-renderiza a cada mudança da sacola). */
export function useSacola(): ValorDaSacola {
  const estado = useContext(ContextoDoEstado);
  const acoes = useContext(ContextoDasAcoes);
  if (!estado || !acoes) throw new Error('useSacola precisa estar dentro de <SacolaProvider>.');
  return { ...estado, ...acoes };
}
