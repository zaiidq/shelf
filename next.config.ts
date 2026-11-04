import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

import { MEDIA_IMAGE_HOSTS } from "./src/lib/image-hosts";

// Hosts that profile images may come from (see src/lib/image-hosts.ts).
const remotePatterns: RemotePattern[] = MEDIA_IMAGE_HOSTS.map(({ hostname, pathname }) => ({
  protocol: "https",
  hostname,
  pathname,
}));

// Uploaded avatars and covers (Supabase Storage).
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const { protocol, hostname, port } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  remotePatterns.push({
    protocol: protocol === "http:" ? "http" : "https",
    hostname,
    port,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching: pages are static by default and
  // cached data is marked with "use cache". See node_modules/next/dist/docs.
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
