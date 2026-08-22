/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@novaqa/types', '@novaqa/shared', '@novaqa/auth', '@novaqa/database']
};

module.exports = nextConfig;
