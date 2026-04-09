import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si",
              "frame-src 'self' https://meet.jit.si",
              "connect-src 'self' http://localhost:* https://meet.jit.si wss://meet.jit.si",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
