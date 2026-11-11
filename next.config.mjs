/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
