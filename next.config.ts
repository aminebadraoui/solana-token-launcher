import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Web3.Storage and multiformats module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ensure proper module resolution for multiformats
    config.resolve.alias = {
      ...config.resolve.alias,
      'multiformats/link': require.resolve('multiformats/src/link'),
      'multiformats/bases/base64': require.resolve('multiformats/src/bases/base64'),
      'multiformats/hashes/identity': require.resolve('multiformats/src/hashes/identity'),
    };

    return config;
  },
};

export default nextConfig;
