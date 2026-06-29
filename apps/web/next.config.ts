const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shipflow/db"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") ?? "",
      ].filter(Boolean),
    },
  },
};
