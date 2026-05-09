import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in iframes.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing the content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control how much referrer info is sent with requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features the app doesn't need.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Speed up external resource resolution.
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Enforce HTTPS after the first visit (1 year).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    {
      // Apply security headers to all routes.
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
