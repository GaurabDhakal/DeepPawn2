import { NextConfig } from "next";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Add WASM support
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Enable async WebAssembly
    config.experiments = { asyncWebAssembly: true, ...config.experiments };

    // Add path alias
    config.resolve.alias["@"] = path.join(__dirname);

    // Fix for "Module not found: Can't resolve 'fs'" in the browser
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*.wasm", // ✅ Apply this header ONLY to .wasm files
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
      
      {
        source: "/:path*", // ✅ Apply security headers to everything else
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
