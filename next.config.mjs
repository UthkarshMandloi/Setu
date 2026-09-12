/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // KPI evidence files (up to 5 MB) are sent through server actions; the default limit is 1 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
