/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  experimental: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "calivian-daycare-images.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/children/**",
      },
    ],
  },
};

module.exports = nextConfig;
