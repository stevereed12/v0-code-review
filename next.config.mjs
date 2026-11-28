/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return ["/auth/:path*", "/account", "/dashboard", "/onboarding", "/subscribed", "/checkout/:path*", "/api/:path*"].map((source) => ({
      source,
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ...(source === "/subscribed" || source.startsWith("/checkout")
          ? [{ key: "Referrer-Policy", value: "no-referrer" }]
          : []),
      ],
    }))
  },
}

export default nextConfig
