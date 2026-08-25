const path = require('path');
const withPWA = require('next-pwa')({
  dest: 'public',
  scope: '/games/sudoku',
  sw: 'sw-sudoku.js',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/thesharmaproject\.com\/games\/sudoku/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'sudoku-game',
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = withPWA(nextConfig);
