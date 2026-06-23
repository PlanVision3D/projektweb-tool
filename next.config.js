/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Erlaubt das Laden lokaler Upload-Bilder ohne Optimizer-Setup (MVP)
  images: { unoptimized: true },
};
module.exports = nextConfig;
