import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Hosts that profile images may come from.
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }, // films & shows
  { protocol: "https", hostname: "covers.openlibrary.org", pathname: "/b/**" }, // books
  { protocol: "https", hostname: "lastfm.freetls.fastly.net", pathname: "/i/**" }, // music
];

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
