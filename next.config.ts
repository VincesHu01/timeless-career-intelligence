import type { NextConfig } from "next";

function getBackendOrigin() {
  const configured=process.env.TIMELESS_BACKEND_ORIGIN?.trim();
  if (!configured) return null;
  const parsed=new URL(configured);
  if (parsed.protocol !== "https:") throw new Error("TIMELESS_BACKEND_ORIGIN 必须是 HTTPS 地址");
  return parsed.origin;
}

const backendOrigin=getBackendOrigin();

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendOrigin) return [];
    // `beforeFiles` is intentional: the repository also contains local API
    // routes for standalone deployments.  When a backend origin is supplied,
    // the proxy must win before Next.js matches those filesystem routes.
    return {
      beforeFiles: [
        { source:"/api/:path*",destination:`${backendOrigin}/api/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
