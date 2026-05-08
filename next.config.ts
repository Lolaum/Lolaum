import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // 트리쉐이킹이 약한 패키지의 named import를 자동 변환하여 번들 사이즈 절감.
    // lucide-react는 아이콘별 chunk, @supabase/* 는 클라이언트 빌드에서만 일부 모듈 로드.
    optimizePackageImports: [
      "lucide-react",
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  compress: true,
};

export default nextConfig;
