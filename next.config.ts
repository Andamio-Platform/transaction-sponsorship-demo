import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for dynamic content
  trailingSlash: false,
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Fix for WASM imports in Node.js environment
    if (options.isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@sidan-lab/whisky-js-nodejs": "@sidan-lab/whisky-js-nodejs",
      });
    }

    return config;
  },
};

export default nextConfig;
