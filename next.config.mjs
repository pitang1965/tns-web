/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ビルド中のESLintエラーを無視
  },
};

export default nextConfig;
