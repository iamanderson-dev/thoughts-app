import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  experimental: {
    // turbo: false, // Removed as it's not a valid option
  },
  /* config options here */
  images: {
    domains: [
      'nccmhcpmeabhygrhstki.supabase.co' 
      // Your Supabase domain
    ],
  },

  
};

export default nextConfig;
