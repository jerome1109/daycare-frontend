import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "export",
  images: {
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

export default nextConfig;
