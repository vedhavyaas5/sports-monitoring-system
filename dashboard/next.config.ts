import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ── Athlete Module (port 8001) ────────────────────────────────────────
      // Self-assessment, MRI analysis, and athlete sessions
      {
        source: "/api/self-assessment",
        destination: "http://localhost:8001/api/self-assessment",
      },
      {
        source: "/api/self-assessment/:path*",
        destination: "http://localhost:8001/api/self-assessment/:path*",
      },
      {
        source: "/api/mri/:path*",
        destination: "http://localhost:8001/api/mri/:path*",
      },

      // ── Dashboard Backend (port 8000) ─────────────────────────────────────
      // Everything else goes to the main backend
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
