import type{NextConfig}from"next";
const nextConfig:NextConfig={
  experimental:{cpus:1,serverActions:{bodySizeLimit:"64mb"}},
  // Route Handler body limit — required for video upload via POST
  serverExternalPackages:[],
  async headers(){
    return[{source:"/(.*)",headers:[
      {key:"X-Frame-Options",value:"DENY"},
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
    ]}];
  },
  // Allow large file uploads through Route Handlers (max 60 MB)
  httpAgentOptions:{keepAlive:true},
};
export default nextConfig;
