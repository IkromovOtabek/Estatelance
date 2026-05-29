/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow images from these domains
  images: {
    domains: [
      'images.unsplash.com',
      't.me',
      'telegram.org',
      'res.cloudinary.com',
      'bufu.uz',
      'api.bufu.uz',
    ],
  },

  // Expose env vars to browser
  env: {
    NEXT_PUBLIC_GRAPHQL_URL:        process.env.NEXT_PUBLIC_GRAPHQL_URL,
    NEXT_PUBLIC_TELEGRAM_BOT_NAME:  process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME,
    NEXT_PUBLIC_API_URL:            process.env.NEXT_PUBLIC_API_URL,
  },

  // Production: compress output
  compress: true,

  // Disable powered-by header (minor security)
  poweredByHeader: false,
};

module.exports = nextConfig;
