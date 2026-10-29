import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions só recebem CEP e dados de pedido: 32 KB bastam (padrão do Next: 1 MB).
    serverActions: { bodySizeLimit: '32kb' },
  },
};

export default nextConfig;
