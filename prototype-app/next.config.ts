import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Serve under the repo path: https://the-exit-plan.github.io/unhazzle.io
  basePath: '/unhazzle.io',
  assetPrefix: '/unhazzle.io/',
  trailingSlash: true,

  // Make Next produce a full static export
  output: 'export',

  // Disable image optimization (not available on GitHub Pages)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
