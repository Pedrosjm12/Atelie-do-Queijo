import type { NextConfig } from 'next';
import { exigirSemDadosFicticiosEmProducao } from './data/ficticio';
import { urlDoSite } from './lib/site';

// Falha cedo (antes de qualquer outra trava): em produção NEXT_PUBLIC_SITE_URL é obrigatória e https.
urlDoSite();

// Trava: build de produção na Vercel não pode usar dados fictícios (não usar NODE_ENV: o build
// local também é `production`).
exigirSemDadosFicticiosEmProducao(process.env.VERCEL_ENV);

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions só recebem CEP e dados de pedido: 32 KB bastam (padrão do Next: 1 MB).
    serverActions: { bodySizeLimit: '32kb' },
  },
};

export default nextConfig;
