/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'pump.mypinata.cloud' },
    ],
  },
  // Pre-transpile heavy packages for faster compilation
  transpilePackages: [
    '@solana/web3.js',
    '@solana/spl-token',
    '@meteora-ag/dynamic-bonding-curve-sdk',
    '@jup-ag/api',
    '@jup-ag/wallet-adapter',
    '@privy-io/react-auth',
    'bn.js',
    'react-tinder-card',
    '@react-spring/web',
    '@react-spring/animated',
    '@react-spring/core',
    '@react-spring/shared',
    '@react-spring/types',
  ],
  experimental: {
    // Optimize package imports to reduce bundle parse time
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@heroicons/react',
      'date-fns',
      'framer-motion',
    ],
  },
  // Only use webpack config for production builds (Turbopack ignores this in dev)
  webpack: (config, { isServer }) => {
    // Resolve fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Add Solana externals for Privy (server-side only)
    if (isServer) {
      // Ensure externals is an array
      if (!Array.isArray(config.externals)) {
        config.externals = config.externals ? [config.externals] : [];
      }

      // Add Solana kit externals to avoid bundling issues
      config.externals.push({
        '@solana/kit': 'commonjs @solana/kit',
        '@solana-program/memo': 'commonjs @solana-program/memo',
        '@solana-program/system': 'commonjs @solana-program/system',
        '@solana-program/token': 'commonjs @solana-program/token',
      });
    }

    return config;
  },
}

module.exports = nextConfig
