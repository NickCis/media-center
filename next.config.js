// https://serwist.pages.dev/docs/next/configuring
const withSerwist = require('@serwist/next').default({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // to disable pwa in development
  cacheOnFrontEndNav: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'm.media-amazon.com',
      },
    ],
  },
};

module.exports = withSerwist(nextConfig);
