import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Disabled static export to allow client-side dynamic routing
  output: process.env.NEXT_PUBLIC_EXPORT_STATIC === 'true' ? 'export' : undefined,
  
  // Enable client-side routing for dynamic routes
  trailingSlash: false,
  
  // Configure images for static export
  images: {
    unoptimized: process.env.NEXT_PUBLIC_EXPORT_STATIC === 'true',
  },
  
  // Build-time injected environment variables
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  
  // Custom output directory for AI builds
  distDir: process.env.NEXT_PUBLIC_AI_BUILD === 'true' ? 'out-ai' : '.next',
  
  /* config options here */
};

export default nextConfig;
