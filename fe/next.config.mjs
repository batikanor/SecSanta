/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, { isServer, webpack }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Exclude Zama SDK from server bundle to avoid 'self is not defined' errors
    if (isServer) {
      config.externals.push('@zama-fhe/relayer-sdk');
      config.externals.push('@zama-fhe/relayer-sdk/web');
    }
    
    // Add polyfills for browser using Next.js's webpack
    if (!isServer) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        new webpack.DefinePlugin({
          'global': 'globalThis',
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
