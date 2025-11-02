// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { turbo: {} },

  async headers() {
    const csp = [
      "default-src 'self'",
      // FB + TikTok + Stripe scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.tiktok.com https://connect.facebook.net https://www.facebook.com",
      "style-src 'self' 'unsafe-inline'",
      // Images and media from FB + TikTok CDNs
      "img-src 'self' data: blob: https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://www.tiktok.com https://www.facebook.com https://*.fbcdn.net https://scontent.xx.fbcdn.net",
      "font-src 'self' https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://static.xx.fbcdn.net https://*.fbcdn.net",
      // Network calls FB/TikTok/Stripe
      "connect-src 'self' https://api.stripe.com https://www.tiktok.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://www.facebook.com https://connect.facebook.net https://graph.facebook.com",
      // Frames (embeds)
      "frame-src https://js.stripe.com https://checkout.stripe.com https://www.tiktok.com https://*.tiktokcdn.com https://www.facebook.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "navigate-to 'self' https://checkout.stripe.com"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;