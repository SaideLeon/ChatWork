/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["jszip", "xml2js", "mammoth"],
  },
};

module.exports = nextConfig;
