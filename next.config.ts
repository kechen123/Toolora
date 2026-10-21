import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态导出：构建产物输出到 out/，可直接部署到 Cloudflare Pages 等静态托管。
  output: "export",
  // 静态导出不支持 next/image 的运行时优化，图片需以静态资源形式提供。
  images: {
    unoptimized: true,
  },
  // 静态托管下每个路由输出为目录 + index.html，便于直接部署。
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
