/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.tiktok.com",
      "style-src 'self' 'unsafe-inline'",
      // ✅ Add Blob storage domain
      "img-src 'self' data: blob: https://*.vercel-storage.com https://tiktokcdn.com https://*.tiktokcdn.com https://www.tiktok.com",
      "connect-src 'self' https://api.stripe.com https://www.tiktok.com",
      "frame-src https://js.stripe.com https://checkout.stripe.com https://www.tiktok.com",
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
          {
            key: "Content-Security-Policy",
            value: csp,
          }
        ],
      },
    ];
  },
};

export default nextConfig;
