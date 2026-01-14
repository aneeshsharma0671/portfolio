/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // For static export, since it's a portfolio
  trailingSlash: true,
  images: { unoptimized: true }, // If using images
}

module.exports = nextConfig