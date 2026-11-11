import type { NextConfig } from 'next';
import { ARTIGOS, CATEGORIAS } from './data/artigos';
import { QUEIJOS } from './data/cheeses';
import { exigirDadosFicticiosPermitidos, exigirSemDadosFicticiosEmProducao } from './data/ficticio';
import { KITS } from './data/kits';
import { PRODUTORES } from './data/produtores';
import { cabecalhosDeSeguranca, ehServidorDeDesenvolvimento } from './lib/cabecalhos';
import { exigirSemLacunasEmProducao } from './lib/lacunas';
import { TEXTOS_DO_ROTEIRO } from './lib/roteiro';
import { urlDoSite } from './lib/site';
import { AVISO_DE_NOVA_ABA } from './lib/whatsapp';

/** Roda as travas de publicação; se mais de uma falhar, lança uma só mensagem com todas. */
function exigirTravasDePublicacao(fase: string): void {
  // Não usar NODE_ENV: o build local também é `production`.
  const vercelEnv = process.env.VERCEL_ENV;
  const travas: Array<() => void> = [
    // Em produção NEXT_PUBLIC_SITE_URL é obrigatória e https.
    () => void urlDoSite(),
    // P73: todo "[A DEFINIR" do assistente e de data/.
    () =>
      exigirSemLacunasEmProducao(vercelEnv, {
        TEXTOS_DO_ROTEIRO,
        AVISO_DE_NOVA_ABA,
        QUEIJOS,
        ARTIGOS,
        CATEGORIAS,
        KITS,
        PRODUTORES,
      }),
    // Dados fictícios: nunca em produção na Vercel...
    () => exigirSemDadosFicticiosEmProducao(vercelEnv),
    // ...e, em qualquer `next build`, só com PERMITIR_DADOS_FICTICIOS=1 (P74).
    () => {
      if (fase === 'phase-production-build') exigirDadosFicticiosPermitidos();
    },
  ];
  const mensagens: string[] = [];
  for (const trava of travas) {
    try {
      trava();
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      if (!mensagens.includes(msg)) mensagens.push(msg);
    }
  }
  if (mensagens.length === 1) throw new Error(mensagens[0]);
  if (mensagens.length > 1) {
    throw new Error(
      `${mensagens.length} travas de publicação falharam:\n\n${mensagens.join('\n\n')}`,
    );
  }
}

function montarConfiguracao(fase: string): NextConfig {
  return {
    poweredByHeader: false,
    async headers() {
      // Cabeçalhos estáticos (ADR-0015): sem nonce, as páginas continuam pré-renderizadas.
      return [
        {
          source: '/:path*',
          headers: [
            ...cabecalhosDeSeguranca({
              desenvolvimento: ehServidorDeDesenvolvimento(fase),
              producao: process.env.VERCEL_ENV === 'production',
            }),
          ],
        },
      ];
    },
    experimental: {
      // Server Actions só recebem CEP e dados de pedido: 32 KB bastam (padrão do Next: 1 MB).
      serverActions: { bodySizeLimit: '32kb' },
    },
  };
}

export default function nextConfig(fase: string): NextConfig {
  exigirTravasDePublicacao(fase);
  return montarConfiguracao(fase);
}
