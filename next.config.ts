import type{NextConfig}from"next";
// CSP: self-hosted app + Yandex Metrika + inline Next.js bootstrap scripts/styles
const CSP=[
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.watch",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.watch",
  "connect-src 'self' https://mc.yandex.ru https://mc.yandex.watch wss://mc.yandex.ru wss://mc.yandex.watch",
  "media-src 'self' blob:",
  "frame-src https://mc.yandex.ru https://mc.yandex.watch",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig:NextConfig={
  experimental:{cpus:1,serverActions:{bodySizeLimit:"64mb"},proxyClientMaxBodySize:"64mb"},
  // Route Handler uploads: the app accepts videos up to 50 MiB.
  serverExternalPackages:[],
  async headers(){
    return[
      {source:"/(.*)",headers:[
        {key:"X-Frame-Options",value:"DENY"},
        {key:"X-Content-Type-Options",value:"nosniff"},
        {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
        {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
        {key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"},
        {key:"Content-Security-Policy",value: CSP},
      ]},

      // Long-lived cache for immutable image binaries
      {source:"/api/images/:path*",headers:[
        {key:"Cache-Control",value:"public, max-age=2592000, stale-while-revalidate=86400"},
      ]},
    ];
  },
  // Allow large file uploads through Route Handlers (max 64 MB)
  httpAgentOptions:{keepAlive:true},
};
export default nextConfig;
